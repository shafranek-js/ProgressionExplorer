/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSavedInstrument } from "./storage";
import { getVoicingForChord } from "./harmonics";
import { getPatternById, getActiveBpm } from "./strumming";
import { logger } from "./logger";

// --- MIDI Constants and Types ---
const NOTE_TO_MIDI_VAL: { [key: string]: number } = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
    'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};
const MIDI_NOTE_ON = 0x90;  // 144
const MIDI_NOTE_OFF = 0x80; // 128
const MIDI_VELOCITY = 100; // Default note velocity

interface MidiEvent {
    tick: number;
    type: 'on' | 'off';
    pitch: number;
}

interface ProgressionChord {
    chord: string;
    voicingIndex: number;
    strumPatternId?: string;
    arpeggioPatternId?: string;
}

// --- Binary Helper Functions ---

/** Writes a 32-bit integer to a byte array in big-endian format. */
function writeInt32(arr: number[], value: number) {
    arr.push((value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF);
}

/** Writes a 16-bit integer to a byte array in big-endian format. */
function writeInt16(arr: number[], value: number) {
    arr.push((value >> 8) & 0xFF, value & 0xFF);
}

/** Writes a variable-length quantity (VLQ) for MIDI delta-times. */
function writeVarInt(arr: number[], value: number) {
    let buffer = value & 0x7F;
    while ((value >>= 7) > 0) {
        buffer <<= 8;
        buffer |= ((value & 0x7F) | 0x80);
    }
    while (true) {
        arr.push(buffer & 0xFF);
        if (buffer & 0x80) {
            buffer >>= 8;
        } else {
            break;
        }
    }
}

/** Converts a note name (e.g., "C#4") to its corresponding MIDI number. */
function noteToMidi(note: string): number | null {
    const match = note.match(/^([A-G][#b]?)([0-9])$/);
    if (!match) return null;

    const noteName = match[1];
    const octave = parseInt(match[2], 10);
    const noteVal = NOTE_TO_MIDI_VAL[noteName];

    if (noteVal === undefined) return null;
    return 12 * (octave + 1) + noteVal;
}

/**
 * Generates and triggers the download of a MIDI file for the given chord progression.
 * This function is self-contained and does not rely on any external libraries.
 * @param progression An array of objects containing chord names and their selected voicing index.
 */
export function exportProgressionToMidi(progression: ProgressionChord[]) {
    const instrument = getSavedInstrument();
    if (!instrument) {
        logger.error("Cannot export MIDI: no instrument selected.");
        return;
    }
    const bpm = getActiveBpm() || 120;
    const timeDivision = 480; // Ticks per quarter note

    const microsecondsPerQuarter = Math.round(60000000 / bpm);
    const allMidiEvents: MidiEvent[] = [];
    let currentTick = 0;

    for (const progChord of progression) {
        const voicing = getVoicingForChord(progChord.chord, instrument, progChord.voicingIndex);
        if (voicing.length === 0) continue;

        const strumPattern = progChord.strumPatternId ? getPatternById(progChord.strumPatternId) : null;
        const arpeggioPattern = progChord.arpeggioPatternId ? getPatternById(progChord.arpeggioPatternId) : null;
        
        const activeStrum = strumPattern && 'beats' in strumPattern ? strumPattern : null;
        let activeArpeggio = arpeggioPattern && 'noteOrder' in arpeggioPattern ? arpeggioPattern : null;

        if (activeArpeggio) {
            // Dynamically generate noteOrder for scalable patterns based on actual voicing.
            const isScalablePattern = activeArpeggio.noteOrder.length === 0;
            if (isScalablePattern) {
                const voicedStringIndexes = voicing.map(v => v.stringIndex);
                let dynamicNoteOrder: number[];
                if (activeArpeggio.name.includes('Ascending')) {
                    dynamicNoteOrder = voicedStringIndexes.sort((a, b) => b - a); // low to high pitch
                } else { // Descending
                    dynamicNoteOrder = voicedStringIndexes.sort((a, b) => a - b); // high to low pitch
                }
                activeArpeggio = { ...activeArpeggio, noteOrder: dynamicNoteOrder };
            }

            const ticksPerMeasure = activeArpeggio.beatsPerMeasure * timeDivision;
            const numNotes = activeArpeggio.noteOrder.length;
            if (numNotes === 0) continue;
            const ticksPerNote = Math.floor(ticksPerMeasure / numNotes);

            // Correctly find the MIDI pitch for each string in the pattern, skipping muted strings.
            activeArpeggio.noteOrder.forEach((stringIndex, i) => {
                const noteInfo = voicing.find(v => v.stringIndex === stringIndex);
                if (noteInfo) {
                    const pitch = noteToMidi(noteInfo.note);
                    if (pitch) {
                         const startTick = currentTick + i * ticksPerNote;
                        allMidiEvents.push({ tick: startTick, type: 'on', pitch });
                        allMidiEvents.push({ tick: startTick + ticksPerNote, type: 'off', pitch });
                    }
                }
            });
            currentTick += ticksPerMeasure;

        } else if (activeStrum) {
            const midiNotes = voicing.map(v => noteToMidi(v.note)).filter(n => n !== null) as number[];
            const ticksPerMeasure = activeStrum.beatsPerMeasure * timeDivision;
            let tickInMeasure = 0;
            activeStrum.beats.forEach(beat => {
                const beatTicks = Math.round(beat.duration * ticksPerMeasure);
                if (beat.type !== 'rest') {
                    const strumNotes = (beat.type === 'down') ? midiNotes : [...midiNotes].reverse();
                    strumNotes.forEach((pitch, i) => {
                        const strumDelay = i * 5; // Add a tiny delay for realism
                        const startTick = currentTick + tickInMeasure + strumDelay;
                        allMidiEvents.push({ tick: startTick, type: 'on', pitch });
                        allMidiEvents.push({ tick: startTick + beatTicks - strumDelay, type: 'off', pitch });
                    });
                }
                tickInMeasure += beatTicks;
            });
            currentTick += ticksPerMeasure;

        } else {
            const midiNotes = voicing.map(v => noteToMidi(v.note)).filter(n => n !== null) as number[];
            // Default block chord (whole note)
            const ticksPerChord = timeDivision * 4;
            midiNotes.forEach(pitch => {
                allMidiEvents.push({ tick: currentTick, type: 'on', pitch });
                allMidiEvents.push({ tick: currentTick + ticksPerChord, type: 'off', pitch });
            });
            currentTick += ticksPerChord;
        }
    }

    // --- Build the MIDI File ---

    // Sort all events by tick time
    allMidiEvents.sort((a, b) => a.tick - b.tick);

    const trackBytes: number[] = [];
    // Tempo Meta Event
    writeVarInt(trackBytes, 0); // delta-time
    trackBytes.push(0xFF, 0x51, 0x03); // F_51 = tempo, 03 = length
    trackBytes.push((microsecondsPerQuarter >> 16) & 0xFF, (microsecondsPerQuarter >> 8) & 0xFF, microsecondsPerQuarter & 0xFF);
    
    let lastTick = 0;
    allMidiEvents.forEach(event => {
        const delta = event.tick - lastTick;
        writeVarInt(trackBytes, delta);
        const eventType = event.type === 'on' ? MIDI_NOTE_ON : MIDI_NOTE_OFF;
        trackBytes.push(eventType, event.pitch, MIDI_VELOCITY);
        lastTick = event.tick;
    });

    // End of Track Meta Event
    writeVarInt(trackBytes, 0);
    trackBytes.push(0xFF, 0x2F, 0x00);

    // --- Final Assembly ---
    const headerBytes = [
        ...('MThd'.split('').map(c => c.charCodeAt(0))), // Chunk ID
        0, 0, 0, 6, // Chunk length
        0, 0, // Format 0 (single track)
        0, 1, // Number of tracks
    ];
    writeInt16(headerBytes, timeDivision);

    const trackHeader = [
        ...('MTrk'.split('').map(c => c.charCodeAt(0))), // Chunk ID
    ];
    writeInt32(trackHeader, trackBytes.length); // Chunk length

    const midiData = new Uint8Array([...headerBytes, ...trackHeader, ...trackBytes]);
    const blob = new Blob([midiData], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = "chord_progression.mid";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}