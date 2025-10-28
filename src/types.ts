/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Type Definition for Chord Voicings ---
export interface ChordVoicingData {
    frets: (number | 'x')[];
    barres?: {
        fret: number;
        from: number; // string index (0 = high e)
        to: number;   // string index
    }[];
}

// --- Rhythm and Pattern Types ---
export interface StrumBeat {
    type: 'down' | 'up' | 'rest';
    duration: number; // as a fraction of the total time for one measure
}

export interface StrummingPattern {
    id?: string;
    name: string;
    bpm: number;
    beatsPerMeasure: number;
    timeSignature: string;
    visual: ('D' | 'U' | 'x')[];
    beats: StrumBeat[];
}

export interface ArpeggioPattern {
    id?: string;
    instrument?: 'guitar' | 'ukulele';
    name: string;
    bpm: number;
    beatsPerMeasure: number;
    timeSignature: string;
    noteOrder: number[];
}

// --- Progression & Harmonic Types ---
export interface Transition {
    to: string;
    weight: number;
    isBorrowed?: boolean;
}

// --- Song Arranger Types ---
export interface SongSection {
    id: string;
    label: string;
    chords: string[];
    voicingIndices: number[];
    strumPatternIds: (string | undefined)[];
    arpeggioPatternIds: (string | undefined)[];
}