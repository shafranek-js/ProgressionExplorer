/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChordVoicingData } from './types';
import { GUITAR_CHORDS, UKULELE_CHORDS } from './data/chords';
import { GUITAR_TUNING, UKULELE_TUNING } from './data/tunings';
import { NOTES, CHORD_INTERVALS, MAJOR_KEYS_DIATONIC, MINOR_KEYS_DIATONIC, PROGRESSION_RULES_MAJOR, PROGRESSION_RULES_MINOR } from './data/theory';


// --- Type Definitions ---
interface ChordVoicing {
    note: string;
    stringIndex: number;
}

interface ChordInfo {
    root: string;
    quality: string;
}

export type ChordFunctionGroup = 'primary' | 'secondary' | 'borrowed' | 'tense' | 'secondaryDominant';

export interface ChordSubstitution {
    name: string;
    description: string;
    voicing: ChordVoicingData;
}


// --- Note & Chord Parsing ---

/**
 * Parses a chord name into its root note and quality.
 * e.g., "C#m7" -> { root: "C#", quality: "m7" }
 */
export function parseChordName(chordName: string): ChordInfo | null {
    const match = chordName.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return null;
    return {
        root: match[1],
        quality: match[2] || ''
    };
}

/**
 * Finds the MIDI value for a given note name (e.g., "C4").
 * Aligns with the standard where C4 (middle C) is 60.
 */
function noteToMidi(note: string): number {
    const match = note.match(/([A-G][#b]?)(\d+)/);
    if (!match) return -1;
    const noteName = match[1];
    const octave = parseInt(match[2], 10);
    const noteIndex = NOTES.indexOf(noteName);
    if (noteIndex === -1) return -1;
    return 12 * (octave + 1) + noteIndex;
}

/**
 * Converts a standard MIDI value back to a note name.
 */
function midiToNote(midi: number): string {
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return NOTES[noteIndex] + octave;
}

/**
 * Calculates the note at a specific fret on a given open string.
 */
export function getNoteFromFret(openStringNote: string, fret: number): string {
    const startMidi = noteToMidi(openStringNote);
    if (startMidi === -1) return '';
    return midiToNote(startMidi + fret);
}

/**
 * Gets the notes that make up a chord.
 * e.g., "Cmaj7" -> { root: "C", notes: ["C", "E", "G", "B"] }
 */
export function getNotesInChord(chordName: string): { root: string, notes: string[] } | null {
    const parsed = parseChordName(chordName);
    if (!parsed) return null;
    const { root, quality } = parsed;
    
    const intervals = CHORD_INTERVALS[quality];
    if (!intervals) return null;

    const rootIndex = NOTES.indexOf(root);
    if (rootIndex === -1) return null;

    const notes = intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });

    return { root, notes };
}


// --- Voicing & Transposition ---

/**
 * Generates the specific notes (voicings) for a chord on an instrument.
 * It can return a specific voicing by index or the default (first) one.
 */
export function getVoicingForChord(chordName: string, instrument: string, voicingIndex: number = 0): ChordVoicing[] {
    const chordDB = instrument === 'guitar' ? GUITAR_CHORDS : UKULELE_CHORDS;
    const tuning = instrument === 'guitar' ? GUITAR_TUNING : UKULELE_TUNING;
    const allVoicings = chordDB[chordName];

    if (!allVoicings || allVoicings.length === 0) return [];
    
    // Fallback to the first voicing if the index is out of bounds
    const voicingData = allVoicings[voicingIndex] || allVoicings[0];
    const fretting = voicingData?.frets;

    if (!fretting) return [];

    return fretting.map((fret, stringIndex) => {
        if (fret === 'x') return null;
        const note = getNoteFromFret(tuning[stringIndex], fret as number);
        return { note, stringIndex };
    }).filter(v => v !== null) as ChordVoicing[];
}


/**
 * Transposes a sequence of chords from an old key to a new one, handling changes in mode (major/minor).
 * @param sequence The array of chord names to transpose.
 * @param oldKey The starting key (e.g., "Am", "C").
 * @param newKey The target key (e.g., "C", "Gm").
 * @returns A new array of transposed chord names.
 */
export function transposeChordSequence(sequence: string[], oldKey: string, newKey: string): string[] {
    const oldKeyTonic = oldKey.endsWith('m') ? oldKey.slice(0, -1) : oldKey;
    const newKeyTonic = newKey.endsWith('m') ? newKey.slice(0, -1) : newKey;

    /** A fallback function for simple chromatic transposition, used for non-diatonic chords. */
    const fallbackTranspose = (chord: string): string => {
        const oldKeyParsed = parseChordName(oldKeyTonic);
        const newKeyParsed = parseChordName(newKeyTonic);
        if (!oldKeyParsed || !newKeyParsed) return chord;

        const oldKeyRootIndex = NOTES.indexOf(oldKeyParsed.root);
        const newKeyRootIndex = NOTES.indexOf(newKeyParsed.root);
        if (oldKeyRootIndex === -1 || newKeyRootIndex === -1) return chord;

        const interval = newKeyRootIndex - oldKeyRootIndex;
        const parsed = parseChordName(chord);
        if (!parsed) return chord;

        const rootIndex = NOTES.indexOf(parsed.root);
        if (rootIndex === -1) return chord;

        const newRootIndex = (rootIndex + interval + 12) % 12;
        const newRoot = NOTES[newRootIndex];
        return newRoot + parsed.quality;
    };

    const oldKeyIsMinor = oldKey.endsWith('m');
    const newKeyIsMinor = newKey.endsWith('m');

    // If there's no mode change, simple chromatic shift is sufficient and safer for non-diatonic chords.
    if (oldKeyIsMinor === newKeyIsMinor) {
        return sequence.map(chord => fallbackTranspose(chord));
    }

    // --- Harmonic Transposition for Mode Changes ---
    const minorToMajorMap: { [key: string]: string } = { 'i': 'I', 'ii': 'ii', 'III': 'iii', 'iv': 'IV', 'v': 'V', 'V': 'V', 'VI': 'vi', 'VII': 'vii' };
    const majorToMinorMap: { [key: string]: string } = { 'I': 'i', 'ii': 'ii', 'iii': 'III', 'IV': 'iv', 'V': 'V', 'vi': 'VI', 'vii': 'VII' };

    return sequence.map(chord => {
        const roman = findFunctionOfChord(chord, oldKey);
        if (!roman) {
            return fallbackTranspose(chord); // Fallback for non-diatonic chords
        }

        let targetRoman = roman;
        if (oldKeyIsMinor) { // minor to major
            targetRoman = minorToMajorMap[roman] || roman;
        } else { // major to minor
            targetRoman = majorToMinorMap[roman] || roman;
        }

        const newChord = realizeRomanNumeral(targetRoman, newKey);
        return newChord || fallbackTranspose(chord);
    });
}

// --- Music Theory & Progressions ---

/**
 * Determines the major key for a given tonic chord.
 */
export function getKeyForTonic(tonicChord: string): string | null {
    const parsed = parseChordName(tonicChord);
    if (!parsed) return null;
    const key = parsed.root;
    return key in MAJOR_KEYS_DIATONIC ? key : null;
}


/**
 * Translates a Roman numeral into a concrete chord name for a given key.
 * Handles diatonic chords, secondary dominants, and borrowed chords.
 */
export function realizeRomanNumeral(roman: string, key: string): string | null {
    const isMinorKey = key.endsWith('m');

    if (isMinorKey) {
        const minorChords = MINOR_KEYS_DIATONIC[key];
        if (!minorChords) return null;

        // Handle harmonic minor V chord, which is very common
        if (roman === 'V') {
            const v_chord = minorChords['v']; // e.g., 'Em' for 'Am' key
            if (v_chord) {
                const parsed = parseChordName(v_chord);
                if (parsed && parsed.quality === 'm') {
                    return parsed.root; // 'Em' -> 'E'
                }
            }
        }
        return minorChords[roman as keyof typeof minorChords] || null;
    }
    
    // --- Major Key Logic ---
    const keyChordsMajor = MAJOR_KEYS_DIATONIC[key];
    if (!keyChordsMajor) return null;

    // Handle secondary dominants like 'V/V'
    if (roman.startsWith('V/')) {
        const targetRoman = roman.split('/')[1];
        const targetChordName = keyChordsMajor[targetRoman as keyof typeof keyChordsMajor];
        if (!targetChordName) return null;
        
        const targetParsed = parseChordName(targetChordName);
        if (!targetParsed) return null;
        
        const targetRootIndex = NOTES.indexOf(targetParsed.root);
        if (targetRootIndex === -1) return null;
        
        const dominantRootIndex = (targetRootIndex + 7) % 12;
        // Secondary dominants are major chords.
        return NOTES[dominantRootIndex];
    }

    // Handle borrowed chords
    const parallelMinorKey = key + 'm';
    const parallelMinorChords = MINOR_KEYS_DIATONIC[parallelMinorKey];
    if (roman === 'iv') {
        return parallelMinorChords?.['iv'] || null;
    }
    if (roman === '♭VII') {
        // In natural minor, VII is a major chord on the b7 degree.
        return parallelMinorChords?.['VII'] || null;
    }

    // Handle diatonic chords
    return keyChordsMajor[roman as keyof typeof keyChordsMajor] || null;
}


/**
 * Finds the Roman numeral function of a chord within a given key.
 * This is the reverse of realizeRomanNumeral, enabling the engine to understand any chord.
 */
function findFunctionOfChord(chordName: string, key: string): string | null {
    const isMinorKey = key.endsWith('m');

    if (isMinorKey) {
        const keyChords = MINOR_KEYS_DIATONIC[key];
        if (!keyChords) return null;
        for (const roman in keyChords) {
            if (keyChords[roman as keyof typeof keyChords] === chordName) {
                return roman;
            }
        }
        // Check for harmonic minor V
        const v_chord = keyChords['v']; // e.g. Em in Am
        if (v_chord) {
             const parsedV = parseChordName(v_chord); // {root: E, quality: m}
             const parsedCurrent = parseChordName(chordName); // e.g. E -> {root: E, quality: ''}
             if (parsedV && parsedCurrent && parsedV.root === parsedCurrent.root && (parsedCurrent.quality === '' || parsedCurrent.quality === '7')) {
                 return 'V'; // It's the major dominant
             }
        }
        return null; // For now, no non-diatonic checks in minor
    }

    // --- Major Key Logic ---
    const keyChords = MAJOR_KEYS_DIATONIC[key];
    if (!keyChords) return null;

    // 1. Check diatonic chords for an exact match
    for (const roman in keyChords) {
        if (keyChords[roman as keyof typeof keyChords] === chordName) {
            return roman;
        }
    }

    // 2. If no exact match, check non-diatonic functions (borrowed, secondary dominants)
    const allFunctions = Object.keys(PROGRESSION_RULES_MAJOR);
    
    for (const func of allFunctions) {
        // Skip diatonic functions, which we already checked
        if (keyChords[func as keyof typeof keyChords]) continue;
        
        const realizedChordName = realizeRomanNumeral(func, key);
        if (realizedChordName === chordName) {
            return func;
        }

        // Handle cases where chord quality differs slightly (e.g., V/V is D, user clicks D7)
        const parsedRealized = parseChordName(realizedChordName || '');
        const parsedCurrent = parseChordName(chordName);

        if (parsedRealized && parsedCurrent && parsedRealized.root === parsedCurrent.root) {
            // Secondary dominants (V/x) are major or dominant 7th chords.
            if (func.startsWith('V/')) {
                if (parsedCurrent.quality === '' || parsedCurrent.quality === '7') {
                    return func;
                }
            }
        }
    }
    
    return null; // No function found
}


/**
 * Gets a list of common next chords based on progression rules.
 */
export function getCommonProgressions(fromChord: string, key: string, allowBorrowed: boolean): string[] {
    const isMinorKey = key.endsWith('m');
    const progressionRules = isMinorKey ? PROGRESSION_RULES_MINOR : PROGRESSION_RULES_MAJOR;

    const currentFunction = findFunctionOfChord(fromChord, key);
    
    if (!currentFunction || !progressionRules[currentFunction as keyof typeof progressionRules]) {
        console.warn(`No progression rule found for function: ${currentFunction} (from chord ${fromChord} in key ${key})`);
        return [];
    }
    
    let transitions = progressionRules[currentFunction as keyof typeof progressionRules]
        .sort((a, b) => b.weight - a.weight);

    // Borrowed chords logic only applies to major keys for now
    if (!isMinorKey) {
        transitions = transitions.filter(rule => allowBorrowed || !rule.isBorrowed);
    }

    const nextChords = transitions.map(t => {
        // Handle self-loop case: the function is the same, so the chord should be the same.
        if (t.to === currentFunction) {
            return fromChord;
        }
        return realizeRomanNumeral(t.to, key);
    }).filter((c): c is string => !!c);

    return [...new Set(nextChords)]; // Remove duplicates
}


/**
 * Creates a human-readable description of a chord's intervals.
 */
export function getChordIntervalsDescription(chordName: string): string | null {
    const parsed = parseChordName(chordName);
    if (!parsed) return null;

    const intervals = CHORD_INTERVALS[parsed.quality];
    if (!intervals) return null;

    const intervalNames = ['Root', 'Minor Second', 'Major Second', 'Minor Third', 'Major Third', 'Perfect Fourth', 'Tritone', 'Perfect Fifth', 'Minor Sixth', 'Major Sixth', 'Minor Seventh', 'Major Seventh'];
    
    // Handle notes beyond one octave like the 9th
    const extendedIntervals = intervals.map(i => {
        if (i > 11) {
            return 'Major Ninth';
        }
        return intervalNames[i];
    });


    return extendedIntervals.join(' - ');
}


/**
 * Classifies a chord into a functional group based on its role in a given key.
 * @param chordName The name of the chord to classify.
 * @param key The musical key to analyze against.
 * @returns A string representing the functional group.
 */
export function getChordFunctionGroup(chordName: string, key: string): ChordFunctionGroup | null {
    const roman = findFunctionOfChord(chordName, key);
    if (!roman) return null;

    const isMinorKey = key.endsWith('m');

    if (isMinorKey) {
        if (['i', 'iv', 'v', 'V'].includes(roman)) return 'primary';
        if (['VI', 'III', 'VII'].includes(roman)) return 'secondary';
        if (['ii'].includes(roman)) return 'tense'; // ii° is tense
        return null;
    } else { // Major key logic
        if (['I', 'IV', 'V'].includes(roman)) return 'primary';
        if (['ii', 'iii', 'vi'].includes(roman)) return 'secondary';
        if (roman.startsWith('V/')) return 'secondaryDominant';
        if (['vii'].includes(roman)) return 'tense';
        
        // Check progression rules for any chord marked as borrowed
        for (const func in PROGRESSION_RULES_MAJOR) {
            for (const rule of PROGRESSION_RULES_MAJOR[func]) {
                if (rule.to === roman && rule.isBorrowed) {
                    return 'borrowed';
                }
            }
        }
        // Fallback for common borrowed chords
        if (['iv', '♭VII'].includes(roman)) return 'borrowed';
    }

    return null;
}


/**
 * Gets a list of valid chord substitutions based on music theory rules.
 * @param chordName The name of the original chord.
 * @param key The current key.
 * @param instrument The current instrument.
 * @returns An array of substitution objects, each with a name, description, and voicing.
 */
export function getChordSubstitutions(chordName: string, key: string, instrument: 'guitar' | 'ukulele'): ChordSubstitution[] {
    const subs: { name: string; description: string }[] = [];
    const parsed = parseChordName(chordName);
    if (!parsed) return [];

    const chordDB = instrument === 'guitar' ? GUITAR_CHORDS : UKULELE_CHORDS;

    // Rule 1: Add extensions/alterations
    if (parsed.quality === '') { // Major
        subs.push({ name: parsed.root + 'sus4', description: 'Suspended 4th: Open, airy feel.' });
        subs.push({ name: parsed.root + 'sus2', description: 'Suspended 2nd: Bright, modern sound.' });
        subs.push({ name: parsed.root + 'maj7', description: 'Major 7th: Jazzy, sophisticated.' });
    }
    if (parsed.quality === 'm') { // Minor
        subs.push({ name: parsed.root + 'm7', description: 'Minor 7th: Soulful, mellow.' });
    }
    if (parsed.quality === '7') { // Dominant
        subs.push({ name: parsed.root + '9', description: 'Dominant 9th: Funkier, richer dominant.' });
        subs.push({ name: parsed.root + '7sus4', description: '7sus4: A softer, modern dominant.' });

        // Rule 2: Tritone substitution
        const rootIndex = NOTES.indexOf(parsed.root);
        const tritoneRootIndex = (rootIndex + 6) % 12;
        const tritoneRoot = NOTES[tritoneRootIndex];
        subs.push({ name: tritoneRoot + '7', description: 'Tritone Sub: Tense, jazzy resolution.' });
    }

    // Rule 3: Diatonic function swaps
    const func = findFunctionOfChord(chordName, key);
    const keyChords = MAJOR_KEYS_DIATONIC[key];
    if (func && keyChords) {
        if (func === 'I') subs.push({ name: keyChords['vi'], description: 'Relative Minor: Deeper, emotional feel.' });
        if (func === 'IV') subs.push({ name: keyChords['ii'], description: 'Subdominant Minor: A common pop swap.' });
        if (func === 'V') subs.push({ name: keyChords['vii'], description: 'Leading-Tone Dim: Adds tension to V.' });
    }

    // Final filter: only return unique chords that have a defined voicing
    const uniqueSubs = new Map<string, { description: string; voicing: ChordVoicingData }>();
    subs.forEach(sub => {
        const voicings = chordDB[sub.name];
        if (voicings && voicings.length > 0 && !uniqueSubs.has(sub.name)) {
            uniqueSubs.set(sub.name, { description: sub.description, voicing: voicings[0] });
        }
    });

    return Array.from(uniqueSubs.entries()).map(([name, data]) => ({ name, ...data }));
}
