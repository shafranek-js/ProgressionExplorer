/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { audioLoader, errorMessage } from './dom';
import { StrumBeat, ArpeggioPattern } from './types';
import { logger } from './logger';

// Since Soundfont is loaded from a CDN, we declare it to satisfy TypeScript.
declare const Soundfont: any;

/**
 * The Audio Engine singleton.
 * Manages audio context, loading soundfonts, and playing chords.
 */
export const audio = {
    context: null as AudioContext | null,
    players: { guitar: null, ukulele: null } as { [key:string]: any },
    isInitialized: false,
    isInitializing: false,

    async init() {
        if (this.isInitialized || this.isInitializing) return;
        this.isInitializing = true;
        audioLoader.style.display = 'block';
        logger.info('Audio engine initializing...');
        try {
            if (typeof Soundfont === 'undefined') {
                throw new Error("Soundfont library is not loaded.");
            }
            
            // Lazily create the AudioContext on first initialization attempt
            if (!this.context) {
                this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
    
            // Resume context if suspended. This is the key fix for autoplay policies.
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }

            const guitarPlayer = Soundfont.instrument(this.context, 'acoustic_guitar_nylon', { soundfont: 'MusyngKite' });
            const ukulelePlayer = Soundfont.instrument(this.context, 'acoustic_guitar_nylon', { soundfont: 'MusyngKite' });
            [this.players.guitar, this.players.ukulele] = await Promise.all([guitarPlayer, ukulelePlayer]);
            this.isInitialized = true;
            logger.info("Audio engine initialized successfully.");
        } catch (e) {
            logger.error("Audio initialization failed.", e);
            console.error("Could not initialize audio.", e);
            errorMessage.textContent = "Could not load audio. Please try refreshing the page.";
            errorMessage.classList.remove('hidden');
        } finally {
            this.isInitializing = false;
            audioLoader.style.display = 'none';
        }
    },

    /** Plays notes simultaneously as a block chord */
    playChord(notes: string[], instrument: string) {
        if (!this.isInitialized || !this.players[instrument]) {
            logger.warn(`Player for ${instrument} not ready. Initializing...`);
            console.warn(`Player for ${instrument} not ready. Initializing...`);
            this.init().then(() => {
                if (this.isInitialized && this.players[instrument]) {
                    this.playChord(notes, instrument);
                }
            });
            return;
        }
        if (!this.context) return;
        
        const player = this.players[instrument];
        const time = this.context.currentTime;
        const delay = 0.02; // Strumming effect
        notes.forEach((note, index) => {
             player.play(note, time + index * delay, { duration: 1.5 });
        });
    },

    /** Plays a single note. Used for UI feedback. */
    playSingleNote(note: string, instrument: string) {
        if (!this.isInitialized || !this.players[instrument]) {
            logger.warn(`Player for ${instrument} not ready for single note playback.`);
            this.init().then(() => {
                if (this.isInitialized && this.players[instrument]) {
                    this.playSingleNote(note, instrument);
                }
            });
            return;
        }
        if (!this.context) return;
        
        const player = this.players[instrument];
        player.play(note, this.context.currentTime, { duration: 0.8, gain: 0.8 });
    },

    /** Plays notes rhythmically based on a strumming pattern */
    async playStrummedChord(notes: string[], instrument: string, durationSeconds: number, pattern: StrumBeat[], previewElement?: HTMLElement): Promise<void> {
        if (!this.context || !this.isInitialized || !this.players[instrument]) return;

        const player = this.players[instrument];
        const startTime = this.context.currentTime;
        const downStrumDelay = 0.012; // Slower, more deliberate down-strum
        const upStrumDelay = 0.008;   // Faster up-strum
        
        let currentTimeInPattern = 0;
        const icons = previewElement?.querySelectorAll('.strum-icon');
        const numNotes = notes.length;

        pattern.forEach((beat, beatIndex) => {
            const beatStartTime = startTime + (currentTimeInPattern * durationSeconds);
            const beatDuration = beat.duration * durationSeconds;

            if (beat.type !== 'rest') {
                 // --- Visual Highlight for Preview ---
                if (icons && icons[beatIndex]) {
                    const icon = icons[beatIndex];
                    const highlightDelay = (beatStartTime - this.context!.currentTime) * 1000;
                    setTimeout(() => {
                        icon.classList.add('highlight');
                        setTimeout(() => icon.classList.remove('highlight'), beatDuration * 1000 * 0.95);
                    }, Math.max(0, highlightDelay));
                }

                if (beat.type === 'down') {
                    // Down-strum: low pitch to high pitch (reverse of notes array)
                    // More emphasis on the first (bass) string.
                    [...notes].reverse().forEach((note, index) => {
                        // Dynamic gain for a more natural sound
                        const gain = 1.0 - (index / numNotes) * 0.25; // Ramps from 1.0 down to ~0.75
                        player.play(note, beatStartTime + index * downStrumDelay, { duration: beatDuration * 0.9, gain: gain });
                    });
                } else if (beat.type === 'up') {
                    // Up-strum: high pitch to low pitch (natural order of notes array)
                    // Generally quieter, with emphasis on the first (treble) string.
                    notes.forEach((note, index) => {
                        // Dynamic gain for a more natural sound, and generally quieter
                        const gain = 0.85 - (index / numNotes) * 0.25; // Ramps from 0.85 down to ~0.6
                        player.play(note, beatStartTime + index * upStrumDelay, { duration: beatDuration * 0.9, gain: gain });
                    });
                }
            }
            // 'rest' does nothing, just takes up time
            currentTimeInPattern += beat.duration;
        });

        return new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
    },

    /** Plays an arpeggio and triggers a callback for each note, allowing synchronized UI updates. */
    async playArpeggioWithCallback(
        voicing: {note: string, stringIndex: number}[], 
        instrument: string, 
        durationSeconds: number, 
        pattern: ArpeggioPattern,
        onNotePlay: (stringIndex: number, stepIndex: number, noteDurationMs: number) => void
    ): Promise<void> {
        if (!this.context || !this.isInitialized || !this.players[instrument]) return;

        const player = this.players[instrument];
        const startTime = this.context.currentTime;
        
        let noteOrder = pattern.noteOrder;
        // A pattern is scalable if its base definition has an empty noteOrder.
        const isScalablePattern = pattern.noteOrder.length === 0;

        if (isScalablePattern) {
            const voicedStringIndexes = voicing.map(v => v.stringIndex);
            if (pattern.name.includes('Ascending')) {
                noteOrder = [...voicedStringIndexes].sort((a, b) => b - a);
            } else { // Descending
                noteOrder = [...voicedStringIndexes].sort((a, b) => a - b);
            }
        }
        
        if (noteOrder.length === 0) {
            return Promise.resolve();
        }
        
        const noteDuration = durationSeconds / noteOrder.length;
        
        noteOrder.forEach((stringIndexToPlay, i) => {
            const noteInfo = voicing.find(v => v.stringIndex === stringIndexToPlay);
            
            if (noteInfo) {
                const { note: noteToPlay, stringIndex } = noteInfo;
                const noteStartTime = startTime + i * noteDuration;
                player.play(noteToPlay, noteStartTime, { duration: noteDuration * 1.5 });

                const highlightDelay = (noteStartTime - this.context.currentTime) * 1000;
                setTimeout(() => {
                    onNotePlay(stringIndex, i, noteDuration * 1000);
                }, Math.max(0, highlightDelay));
            }
        });

        return new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
    },
    
    /** Plays notes sequentially based on an arpeggio pattern, with visual highlighting */
    async playArpeggiatedChord(voicing: {note: string, stringIndex: number}[], instrument: string, durationSeconds: number, pattern: ArpeggioPattern, domNode: HTMLElement, previewElement?: HTMLElement): Promise<void> {
        if (!this.context || !this.isInitialized || !this.players[instrument] || !domNode) return;

        // Clear previous highlights from the node before starting
        domNode.querySelectorAll('.string-highlight').forEach(el => el.classList.remove('string-highlight'));

        const player = this.players[instrument];
        const startTime = this.context.currentTime;
        
        let noteOrder = pattern.noteOrder;
        // A pattern is scalable if its base definition has an empty noteOrder. This is the source of truth.
        const isScalablePattern = pattern.noteOrder.length === 0;
        
        // For scalable patterns, the note order MUST be generated dynamically based on the chord's actual voicing.
        // This is critical because a chord might not use all strings (e.g., muted strings).
        // By recalculating from the `voicing` object, we ensure we only try to play strings that have a note.
        if (isScalablePattern) {
            const voicedStringIndexes = voicing.map(v => v.stringIndex);
            if (pattern.name.includes('Ascending')) {
                // Ascending pitch = from low-pitched string to high (e.g., index 5 down to 0)
                noteOrder = [...voicedStringIndexes].sort((a, b) => b - a);
            } else { // Descending
                // Descending pitch = from high-pitched string to low (e.g., index 0 up to 5)
                noteOrder = [...voicedStringIndexes].sort((a, b) => a - b);
            }
        }
        
        if (noteOrder.length === 0) {
            return Promise.resolve(); // Prevent division by zero if pattern is empty
        }
        
        const noteDuration = durationSeconds / noteOrder.length;
        
        noteOrder.forEach((stringIndexToPlay, i) => {
            // Find the actual note from the voicing data that corresponds to the string we need to play.
            const noteInfo = voicing.find(v => v.stringIndex === stringIndexToPlay);
            
            // Only play a note if the string is not muted for this chord.
            if (noteInfo) {
                const { note: noteToPlay, stringIndex } = noteInfo;
                const noteStartTime = startTime + i * noteDuration;
                // Play note with a slight overlap for a more legato feel
                player.play(noteToPlay, noteStartTime, { duration: noteDuration * 1.5 });

                const highlightDelay = (noteStartTime - this.context!.currentTime) * 1000;
                const highlightDuration = noteDuration * 1000 * 0.95;

                // --- Visual Highlight Logic (Main Tree) ---
                const stringLine = domNode.querySelector(`.string-line[data-string-index="${stringIndex}"]`) as SVGLineElement;
                if (stringLine) {
                    setTimeout(() => {
                        stringLine.classList.add('string-highlight');
                        setTimeout(() => stringLine.classList.remove('string-highlight'), highlightDuration);
                    }, Math.max(0, highlightDelay));
                }
                
                // --- Visual Highlight Logic (Preview Modal) ---
                if (previewElement) {
                    const dot = previewElement.querySelector(`.arpeggio-dot[data-step-index="${i}"]`);
                    if (dot) {
                        setTimeout(() => {
                            dot.classList.add('highlight');
                            setTimeout(() => dot.classList.remove('highlight'), highlightDuration);
                        }, Math.max(0, highlightDelay));
                    }
                }
            }
            // If noteInfo is null, the string is muted, so we do nothing, creating silence for that step.
        });

        return new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
    }
};