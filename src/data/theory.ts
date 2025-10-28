/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transition } from '../types';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CHORD_INTERVALS: { [key: string]: number[] } = {
    '': [0, 4, 7], // Major
    'maj7': [0, 4, 7, 11], // Major 7th
    'm': [0, 3, 7], // Minor
    'm7': [0, 3, 7, 10], // Minor 7th
    '7': [0, 4, 7, 10], // Dominant 7th
    'm7b5': [0, 3, 6, 10], // Half-diminished (Minor 7th flat 5)
    'dim': [0, 3, 6], // Diminished triad
};

export const MAJOR_KEYS_DIATONIC: { [key: string]: { [roman: string]: string } } = {
    'C': { I: 'C', ii: 'Dm', iii: 'Em', IV: 'F', V: 'G', vi: 'Am', vii: 'Bdim' },
    'G': { I: 'G', ii: 'Am', iii: 'Bm', IV: 'C', V: 'D', vi: 'Em', vii: 'F#dim' },
    'D': { I: 'D', ii: 'Em', iii: 'F#m', IV: 'G', V: 'A', vi: 'Bm', vii: 'C#dim' },
    'A': { I: 'A', ii: 'Bm', iii: 'C#m', IV: 'D', V: 'E', vi: 'F#m', vii: 'G#dim' },
    'E': { I: 'E', ii: 'F#m', iii: 'G#m', IV: 'A', V: 'B', vi: 'C#m', vii: 'D#dim' },
    'B': { I: 'B', ii: 'C#m', iii: 'D#m', IV: 'E', V: 'F#', vi: 'G#m', vii: 'A#dim' },
    'F#': { I: 'F#', ii: 'G#m', iii: 'A#m', IV: 'B', V: 'C#', vi: 'D#m', vii: 'Fdim' },
    'C#': { I: 'C#', ii: 'D#m', iii: 'Fm', IV: 'F#', V: 'G#', vi: 'A#m', vii: 'Cdim' },
    'Ab': { I: 'Ab', ii: 'Bbm', iii: 'Cm', IV: 'Db', V: 'Eb', vi: 'Fm', vii: 'Gdim' },
    'Eb': { I: 'Eb', ii: 'Fm', iii: 'Gm', IV: 'Ab', V: 'Bb', vi: 'Cm', vii: 'Ddim' },
    'Bb': { I: 'Bb', ii: 'Cm', iii: 'Dm', IV: 'Eb', V: 'F', vi: 'Gm', vii: 'Adim' },
    'F': { I: 'F', ii: 'Gm', iii: 'Am', IV: 'Bb', V: 'C', vi: 'Dm', vii: 'Edim' },
};

export const MINOR_KEYS_DIATONIC: { [key: string]: { [roman: string]: string } } = { // Natural Minor + Dorian IV
    'Am': { i: 'Am', ii: 'Bdim', III: 'C', iv: 'Dm', IV: 'D', v: 'Em', VI: 'F', VII: 'G' },
    'Em': { i: 'Em', ii: 'F#dim', III: 'G', iv: 'Am', IV: 'A', v: 'Bm', VI: 'C', VII: 'D' },
    'Bm': { i: 'Bm', ii: 'C#dim', III: 'D', iv: 'Em', IV: 'E', v: 'F#m', VI: 'G', VII: 'A' },
    'F#m': { i: 'F#m', ii: 'G#dim', III: 'A', iv: 'Bm', IV: 'B', v: 'C#m', VI: 'D', VII: 'E' },
    'C#m': { i: 'C#m', ii: 'D#dim', III: 'E', iv: 'F#m', IV: 'F#', v: 'G#m', VI: 'A', VII: 'B' },
    'G#m': { i: 'G#m', ii: 'A#dim', III: 'B', iv: 'C#m', IV: 'C#', v: 'D#m', VI: 'E', VII: 'F#' },
    'D#m': { i: 'D#m', ii: 'Fdim', III: 'F#', iv: 'G#m', IV: 'G#', v: 'A#m', VI: 'B', VII: 'C#' },
    'Bbm': { i: 'Bbm', ii: 'Cdim', III: 'Db', iv: 'Ebm', IV: 'Eb', v: 'Fm', VI: 'Gb', VII: 'Ab' },
    'Fm': { i: 'Fm', ii: 'Gdim', III: 'Ab', iv: 'Bbm', IV: 'Bb', v: 'Cm', VI: 'Db', VII: 'Eb' },
    'Cm': { i: 'Cm', ii: 'Ddim', III: 'Eb', iv: 'Fm', IV: 'F', v: 'Gm', VI: 'Ab', VII: 'Bb' },
    'Gm': { i: 'Gm', ii: 'Adim', III: 'Bb', iv: 'Cm', IV: 'C', v: 'Dm', VI: 'Eb', VII: 'F' },
    'Dm': { i: 'Dm', ii: 'Edim', III: 'F', iv: 'Gm', IV: 'G', v: 'Am', VI: 'Bb', VII: 'C' },
};

export const MAJOR_KEYS_DIATONIC_SEVENTHS: { [key: string]: { [roman: string]: string } } = {
    'C': { I: 'Cmaj7', ii: 'Dm7', iii: 'Em7', IV: 'Fmaj7', V: 'G7', vi: 'Am7', vii: 'Bm7b5' },
    'G': { I: 'Gmaj7', ii: 'Am7', iii: 'Bm7', IV: 'Cmaj7', V: 'D7', vi: 'Em7', vii: 'F#m7b5' },
    'D': { I: 'Dmaj7', ii: 'Em7', iii: 'F#m7', IV: 'Gmaj7', V: 'A7', vi: 'Bm7', vii: 'C#m7b5' },
    'A': { I: 'Amaj7', ii: 'Bm7', iii: 'C#m7', IV: 'Dmaj7', V: 'E7', vi: 'F#m7', vii: 'G#m7b5' },
    'E': { I: 'Emaj7', ii: 'F#m7', iii: 'G#m7', IV: 'Amaj7', V: 'B7', vi: 'C#m7', vii: 'D#m7b5' },
    'B': { I: 'Bmaj7', ii: 'C#m7', iii: 'D#m7', IV: 'Emaj7', V: 'F#7', vi: 'G#m7', vii: 'A#m7b5' },
    'F#': { I: 'F#maj7', ii: 'G#m7', iii: 'A#m7', IV: 'Bmaj7', V: 'C#7', vi: 'D#m7', vii: 'Fm7b5' }, // Using Fm7b5 for E#m7b5
    'C#': { I: 'C#maj7', ii: 'D#m7', iii: 'Fm7', IV: 'F#maj7', V: 'G#7', vi: 'A#m7', vii: 'Cm7b5' },
    'Ab': { I: 'Abmaj7', ii: 'Bbm7', iii: 'Cm7', IV: 'Dbmaj7', V: 'Eb7', vi: 'Fm7', vii: 'Gm7b5' },
    'Eb': { I: 'Ebmaj7', ii: 'Fm7', iii: 'Gm7', IV: 'Abmaj7', V: 'Bb7', vi: 'Cm7', vii: 'Dm7b5' },
    'Bb': { I: 'Bbmaj7', ii: 'Cm7', iii: 'Dm7', IV: 'Ebmaj7', V: 'F7', vi: 'Gm7', vii: 'Am7b5' },
    'F': { I: 'Fmaj7', ii: 'Gm7', iii: 'Am7', IV: 'Bbmaj7', V: 'C7', vi: 'Dm7', vii: 'Em7b5' },
};

export const MINOR_KEYS_DIATONIC_SEVENTHS: { [key: string]: { [key: string]: string } } = {
    'Am': { im7: 'Am7', iim7b5: 'Bm7b5', IIImaj7: 'Cmaj7', ivm7: 'Dm7', vm7: 'Em7', V7: 'E7', VImaj7: 'Fmaj7', VII7: 'G7' },
    'Em': { im7: 'Em7', iim7b5: 'F#m7b5', IIImaj7: 'Gmaj7', ivm7: 'Am7', vm7: 'Bm7', V7: 'B7', VImaj7: 'Cmaj7', VII7: 'D7' },
    'Bm': { im7: 'Bm7', iim7b5: 'C#m7b5', IIImaj7: 'Dmaj7', ivm7: 'Em7', vm7: 'F#m7', V7: 'F#7', VImaj7: 'Gmaj7', VII7: 'A7' },
    'F#m': { im7: 'F#m7', iim7b5: 'G#m7b5', IIImaj7: 'Amaj7', ivm7: 'Bm7', vm7: 'C#m7', V7: 'C#7', VImaj7: 'Dmaj7', VII7: 'E7' },
    'C#m': { im7: 'C#m7', iim7b5: 'D#m7b5', IIImaj7: 'Emaj7', ivm7: 'F#m7', vm7: 'G#m7', V7: 'G#7', VImaj7: 'Amaj7', VII7: 'B7' },
    'G#m': { im7: 'G#m7', iim7b5: 'A#m7b5', IIImaj7: 'Bmaj7', ivm7: 'C#m7', vm7: 'D#m7', V7: 'D#7', VImaj7: 'Emaj7', VII7: 'F#7' },
    'D#m': { im7: 'D#m7', iim7b5: 'Fm7b5', IIImaj7: 'F#maj7', ivm7: 'G#m7', vm7: 'A#m7', V7: 'A#7', VImaj7: 'Bmaj7', VII7: 'C#7' },
    'Bbm': { im7: 'Bbm7', iim7b5: 'Cm7b5', IIImaj7: 'Dbmaj7', ivm7: 'Ebm7', vm7: 'Fm7', V7: 'F7', VImaj7: 'Gbmaj7', VII7: 'Ab7' },
    'Fm': { im7: 'Fm7', iim7b5: 'Gm7b5', IIImaj7: 'Abmaj7', ivm7: 'Bbm7', vm7: 'Cm7', V7: 'C7', VImaj7: 'Dbmaj7', VII7: 'Eb7' },
    'Cm': { im7: 'Cm7', iim7b5: 'Dm7b5', IIImaj7: 'Ebmaj7', ivm7: 'Fm7', vm7: 'Gm7', V7: 'G7', VImaj7: 'Abmaj7', VII7: 'Bb7' },
    'Gm': { im7: 'Gm7', iim7b5: 'Am7b5', IIImaj7: 'Bbmaj7', ivm7: 'Cm7', vm7: 'Dm7', V7: 'D7', VImaj7: 'Ebmaj7', VII7: 'F7' },
    'Dm': { im7: 'Dm7', iim7b5: 'Em7b5', IIImaj7: 'Fmaj7', ivm7: 'Gm7', vm7: 'Am7', V7: 'A7', VImaj7: 'Bbmaj7', VII7: 'C7' },
};


export const PROGRESSION_RULES_MAJOR: { [key: string]: Transition[] } = {
    'I':    [{to:'I', weight:2}, {to:'IV', weight:8}, {to:'V', weight:7}, {to:'ii', weight:6}, {to:'vi', weight:5}, {to:'iv', weight:5, isBorrowed: true}, {to:'V/V', weight:4}, {to:'♭VII', weight:4, isBorrowed: true}, {to:'iii', weight:3}, {to:'V/iii', weight:3}],
    'ii':   [{to:'ii', weight:2}, {to:'V', weight:10}, {to:'vii', weight:4}, {to:'IV', weight:2}],
    'iii':  [{to:'iii', weight:2}, {to:'vi', weight:9}, {to:'IV', weight:7}, {to:'ii', weight:4}, {to:'V/vi', weight:6}],
    'IV':   [{to:'IV', weight:2}, {to:'V', weight:9}, {to:'iv', weight:7, isBorrowed: true}, {to:'V/V', weight:6}, {to:'I', weight:5}, {to:'ii', weight:4}],
    'V':    [{to:'V', weight:2}, {to:'I', weight:12}, {to:'vi', weight:6}, {to:'V/ii', weight:3}, {to:'V/vi', weight:3}],
    'vi':   [{to:'vi', weight:2}, {to:'ii', weight:8}, {to:'IV', weight:8}, {to:'V', weight:5}, {to:'V/ii', weight:4}],
    'vii':  [{to:'vii', weight:2}, {to:'I', weight:9}, {to:'iii', weight:4}],
    // Secondary Dominants
    'V/V':  [{to:'V/V', weight:1}, {to:'V', weight:12}],
    'V/ii': [{to:'V/ii', weight:1}, {to:'ii', weight:12}],
    'V/vi': [{to:'V/vi', weight:1}, {to:'vi', weight:12}],
    'V/iii': [{to:'V/iii', weight:1}, {to:'iii', weight:12}],
    // Borrowed chords
    'iv':   [{to:'iv', weight:2}, {to:'I', weight:8}, {to:'V', weight:6}],
    '♭VII': [{to:'♭VII', weight:2}, {to:'I', weight:8}, {to:'IV', weight:6}],
};
export const PROGRESSION_RULES_MINOR: { [key: string]: Transition[] } = { // Natural Minor + Harmonic Minor V
    'i':    [{to:'i', weight:2}, {to:'VI', weight:9}, {to:'iv', weight:8}, {to:'V', weight:7}, {to:'v', weight:6}, {to:'VII', weight:5}, {to:'III', weight:4}, {to:'ii', weight:3}],
    'ii':   [{to:'ii', weight:2}, {to:'V', weight:10}, {to:'v', weight:9}, {to:'VII', weight:5}],
    'III':  [{to:'III', weight:2}, {to:'VI', weight:9}, {to:'iv', weight:8}],
    'iv':   [{to:'iv', weight:2}, {to:'V', weight:9}, {to:'v', weight:8}, {to:'VII', weight:6}, {to:'i', weight:4}],
    'v':    [{to:'v', weight:2}, {to:'i', weight:10}, {to:'VI', weight:5}],
    'V':    [{to:'V', weight:2}, {to:'i', weight:12}, {to:'VI', weight:6}],
    'VI':   [{to:'VI', weight:2}, {to:'ii', weight:8}, {to:'iv', weight:7}, {to:'V', weight:6}, {to:'v', weight:5}],
    'VII':  [{to:'VII', weight:2}, {to:'i', weight:10}, {to:'III', weight:8}],
};

export const TIME_SIGNATURES = {
  simple: {
    '4/4': { name: '4/4 (Common Time)', description: 'Widely used in classical music and most forms of popular music. Most common time signature in rock, blues, country, funk, and pop.' },
    '2/2': { name: '2/2 (Cut Time)', description: 'Alla breve, cut time: Used for marches and fast orchestral music.' },
    '2/4': { name: '2/4', description: 'Used for polkas, galops, marches, and many styles of Latin music (including bolero, cumbia, and merengue).' },
    '3/4': { name: '3/4', description: 'Used for waltzes, minuets, scherzi, polonaises, mazurkas, country & western ballads, R&B, and some pop.' },
    '3/8': { name: '3/8', description: 'Also used for the above but usually suggests higher tempo or shorter hypermeter. Sometimes preferred for certain folk dances such as cachucha.' },
  },
  compound: {
    '6/8': { name: '6/8', description: 'Double jigs, jotas, zortzikos, polkas, sega, salegy, tarantella, marches, barcarolles, loures, and some rock music. Anapestic tetrameter poetry 6/8 time when said aloud.' },
    '9/8': { name: '9/8', description: 'Compound triple time: Used in slip jigs; otherwise occurring rarely ("The Ride of the Valkyries", Tchaikovsky\'s Fourth Symphony, and the final movement of J.S. Bach\'s Violin Concerto in A minor (BWV 1041) are familiar examples. Debussy\'s "Clair de lune" and the opening bars of Prélude à l\'après-midi d\'un faune are also in 9/8.' },
    '12/8': { name: '12/8', description: 'Also common in slower blues (where it is called a shuffle) and doo-wop; also used more recently in rock music. Can also be heard in some jigs like "The Irish Washerwoman". This is also the time signature of Scene by the Brook, the second movement of Beethoven\'s Pastoral Symphony.' },
  }
};