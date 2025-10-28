/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FixedProgression {
    tonic: string;
    chords: string[];
    voicings?: number[];
}

export const PROGRESSIONS: { [key: string]: string } = {
    'free-explore': 'Free Explore (Guided)',
    'free-build': 'Free Build (Manual)',
    'pop-punk': 'Pop-Punk (I-V-vi-IV)',
    'modern-pop-anthem': 'Modern Pop Anthem (vi-V-I-IV)',
    '50s-heart-and-soul': "50s / Heart and Soul (I-vi-IV-V)",
    'modern-pop-ballad': 'Modern Pop Ballad (vi-IV-I-V)',
    'classic-rock': 'Classic Rock (I-IV-V)',
    'folk-ballad': 'Folk Ballad (I-iii-IV-V)',
    'jazz-turnaround': 'Jazz Turnaround (ii-V-I)',
    'jazzy-ascent': 'Jazzy Ascent (ii-IV-V-I)',
    'pachelbel': "Pachelbel's Canon (I-V-vi-iii-IV-I-IV-V)",
    'pachelbel-d': "Pachelbel's Canon in D",
    'frere-jacques': "Frère Jacques (Canon)",
    'lean-on-me': '"Lean On Me" Verse',
    'jazz-doo-wop-turnaround': "Jazz/Doo-Wop Turnaround (I-vi-ii-V)",
    'subdominant-pop': "Subdominant Pop (IV-I-V-vi)",
    'simple-anthem': "Simple Anthem (I-IV-I-V)",
    'minor-feel-cadence': "Minor Feel Cadence (vi-IV-V-I)",
    '12-bar-blues': "12-Bar Blues",
    'hotel-california': "Hotel California Verse (Minor)",
    'circle-progression': "Circle Progression",
    'creep-verse': '"Creep" Verse (I-V/iii-IV-iv)',
    'dont-stop-believin': '"Don\'t Stop Believin\'" (I-V-vi-IV)',
    'hallelujah-verse': '"Hallelujah" Verse (I-vi-IV-V-I-V)',
    'losing-my-religion': '"Losing My Religion" (i-v-VII-iv)',
    'sweet-home-alabama': '"Sweet Home Alabama" (V-IV-I)',
    'house-of-the-rising-sun': '"House of the Rising Sun" (i-III-IV-VI-i-V)',
    'knockin-on-heavens-door': '"Knockin\' on Heaven\'s Door"',
    'take-on-me-chorus': '"Take On Me" Chorus (ii-V-I-vi)',
    'californication-chorus': '"Californication" (i-VI-III-VII)',
    'hey-jude-outro': '"Hey Jude" Outro (I-♭VII-IV-I)'
};

export const FIXED_PROGRESSIONS: { [key: string]: FixedProgression } = {
    'pachelbel-d': {
        tonic: 'D',
        chords: [
            'D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A', // Variation 1
            'D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A'  // Variation 2
        ],
        voicings: [
            0, 0, 0, 0, 0, 0, 0, 0, // Var 1: Low voicings
            1, 1, 1, 1, 1, 2, 1, 1  // Var 2: High voicings
        ]
    }
};

export const PROGRESSION_FORMULAS: { [key: string]: string[] } = {
    'pop-punk': ['I', 'V', 'vi', 'IV'],
    'modern-pop-anthem': ['vi', 'V', 'I', 'IV'],
    '50s-heart-and-soul': ['I', 'vi', 'IV', 'V'],
    'modern-pop-ballad': ['vi', 'IV', 'I', 'V'],
    'classic-rock': ['I', 'IV', 'V'],
    'folk-ballad': ['I', 'iii', 'IV', 'V'],
    'jazz-turnaround': ['ii', 'V', 'I'],
    'jazzy-ascent': ['ii', 'IV', 'V', 'I'],
    'pachelbel': ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    'frere-jacques': ['I', 'V', 'I', 'IV'],
    'lean-on-me': ['I', 'IV', 'I', 'V'],
    'jazz-doo-wop-turnaround': ['I', 'vi', 'ii', 'V'],
    'subdominant-pop': ['IV', 'I', 'V', 'vi'],
    'simple-anthem': ['I', 'IV', 'I', 'V'],
    'minor-feel-cadence': ['vi', 'IV', 'V', 'I'],
    '12-bar-blues': ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V'],
    'hotel-california': ['i', 'V', 'VII', 'IV', 'VI', 'III', 'iv', 'V'],
    'circle-progression': ['I', 'IV', 'vii', 'iii', 'vi', 'ii', 'V', 'I'],
    'creep-verse': ['I', 'V/iii', 'IV', 'iv'],
    'dont-stop-believin': ['I', 'V', 'vi', 'IV'],
    'hallelujah-verse': ['I', 'vi', 'IV', 'V', 'I', 'V'],
    'losing-my-religion': ['i', 'v', 'VII', 'iv'],
    'sweet-home-alabama': ['V', 'IV', 'I'],
    'house-of-the-rising-sun': ['i', 'III', 'IV', 'VI', 'i', 'V'],
    'knockin-on-heavens-door': ['I', 'V', 'ii', 'ii', 'I', 'V', 'IV', 'IV'],
    'take-on-me-chorus': ['ii', 'V', 'I', 'vi'],
    'californication-chorus': ['i', 'VI', 'III', 'VII'],
    'hey-jude-outro': ['I', '♭VII', 'IV', 'I'],
};
