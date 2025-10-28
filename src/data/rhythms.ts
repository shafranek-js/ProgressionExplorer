/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrummingPattern, ArpeggioPattern } from '../types';

export const STRUMMING_PATTERNS: { [id: string]: StrummingPattern } = {
    // --- 4/4 Patterns ---
    'basic-4-4': {
        name: 'Basic 4/4',
        bpm: 120,
        beatsPerMeasure: 4,
        timeSignature: '4/4',
        visual: ['D', 'D', 'U', 'U', 'D', 'U'],
        beats: [
            { type: 'down', duration: 0.25 },   // Beat 1
            { type: 'down', duration: 0.25 },   // Beat 2
            { type: 'up', duration: 0.125 },    // Beat 3
            { type: 'up', duration: 0.125 },    // Beat 3 &
            { type: 'down', duration: 0.125 },  // Beat 4
            { type: 'up', duration: 0.125 },    // Beat 4 &
        ]
    },
    'folk-pop': {
        name: 'Folk Pop',
        bpm: 100,
        beatsPerMeasure: 4,
        timeSignature: '4/4',
        visual: ['D', 'x', 'D', 'U', 'x', 'U', 'D', 'U'],
        beats: [
            { type: 'down', duration: 0.125 }, { type: 'rest', duration: 0.125 },
            { type: 'down', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'rest', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'down', duration: 0.125 }, { type: 'up', duration: 0.125 },
        ]
    },
    'campfire': {
        name: 'Campfire',
        bpm: 130,
        beatsPerMeasure: 4,
        timeSignature: '4/4',
        visual: ['D', 'D', 'U', 'x', 'U', 'D', 'U'],
        beats: [
            { type: 'down', duration: 0.25 },
            { type: 'down', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'rest', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'down', duration: 0.125 }, { type: 'up', duration: 0.125 },
        ]
    },
    'four-on-floor': {
        name: 'Four on the Floor',
        bpm: 120,
        beatsPerMeasure: 4,
        timeSignature: '4/4',
        visual: ['D', 'D', 'D', 'D'],
        beats: [
            { type: 'down', duration: 0.25 }, { type: 'down', duration: 0.25 },
            { type: 'down', duration: 0.25 }, { type: 'down', duration: 0.25 },
        ]
    },
    'simple-8ths': {
        name: 'Simple 8ths',
        bpm: 110,
        beatsPerMeasure: 4,
        timeSignature: '4/4',
        visual: ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'],
        beats: [
            { type: 'down', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'down', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'down', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'down', duration: 0.125 }, { type: 'up', duration: 0.125 },
        ]
    },
    'island-strum': {
        name: 'Island Strum',
        bpm: 110,
        beatsPerMeasure: 4,
        timeSignature: '4/4',
        visual: ['D', 'x', 'D', 'U', 'x', 'U', 'D', 'x'],
        beats: [
            { type: 'down', duration: 0.125 }, { type: 'rest', duration: 0.125 },
            { type: 'down', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'rest', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'down', duration: 0.125 }, { type: 'rest', duration: 0.125 },
        ]
    },
    'syncopated-pop': {
        name: 'Syncopated Pop',
        bpm: 95,
        beatsPerMeasure: 4,
        timeSignature: '4/4',
        visual: ['D', 'x', 'x', 'U', 'x', 'U', 'D', 'x'],
        beats: [
            { type: 'down', duration: 0.125 }, { type: 'rest', duration: 0.125 },
            { type: 'rest', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'rest', duration: 0.125 }, { type: 'up', duration: 0.125 },
            { type: 'down', duration: 0.125 }, { type: 'rest', duration: 0.125 },
        ]
    },

    // --- 2/2 Patterns ---
    'simple-cut': { name: 'Simple Cut', bpm: 100, beatsPerMeasure: 2, timeSignature: '2/2', visual: ['D', 'D'], beats: [{ type: 'down', duration: 0.5 }, { type: 'down', duration: 0.5 }] },
    'march-cut': { name: 'March (Cut Time)', bpm: 120, beatsPerMeasure: 2, timeSignature: '2/2', visual: ['D', 'D', 'U'], beats: [{ type: 'down', duration: 0.5 }, { type: 'down', duration: 0.25 }, { type: 'up', duration: 0.25 }] },
    'driving-cut': { name: 'Driving Cut', bpm: 140, beatsPerMeasure: 2, timeSignature: '2/2', visual: ['D', 'U', 'D', 'U'], beats: [{ type: 'down', duration: 0.25 }, { type: 'up', duration: 0.25 }, { type: 'down', duration: 0.25 }, { type: 'up', duration: 0.25 }] },
    'syncopated-march': { name: 'Syncopated March', bpm: 110, beatsPerMeasure: 2, timeSignature: '2/2', visual: ['D', 'x', 'U', 'D'], beats: [{ type: 'down', duration: 0.25 }, { type: 'rest', duration: 0.25 }, { type: 'up', duration: 0.25 }, { type: 'down', duration: 0.25 }] },
    'alla-breve-pulse': { name: 'Alla Breve Pulse', bpm: 130, beatsPerMeasure: 2, timeSignature: '2/2', visual: ['D', 'U', 'x', 'U'], beats: [{ type: 'down', duration: 0.25 }, { type: 'up', duration: 0.25 }, { type: 'rest', duration: 0.25 }, { type: 'up', duration: 0.25 }] },

    // --- 2/4 Patterns ---
    'polka-strum': { name: 'Polka Strum', bpm: 130, beatsPerMeasure: 2, timeSignature: '2/4', visual: ['D', 'U', 'D', 'U'], beats: [{ type: 'down', duration: 0.25 }, { type: 'up', duration: 0.25 }, { type: 'down', duration: 0.25 }, { type: 'up', duration: 0.25 }] },
    'simple-2-4': { name: 'Simple 2/4', bpm: 100, beatsPerMeasure: 2, timeSignature: '2/4', visual: ['D', 'D'], beats: [{ type: 'down', duration: 0.5 }, { type: 'down', duration: 0.5 }] },
    'march-2-4': { name: 'March 2/4', bpm: 120, beatsPerMeasure: 2, timeSignature: '2/4', visual: ['D', 'D', 'U'], beats: [{ type: 'down', duration: 0.5 }, { type: 'down', duration: 0.25 }, { type: 'up', duration: 0.25 }] },
    'latin-2-4': { name: 'Latin Feel', bpm: 110, beatsPerMeasure: 2, timeSignature: '2/4', visual: ['D', 'x', 'U', 'D'], beats: [{ type: 'down', duration: 0.25 }, { type: 'rest', duration: 0.25 }, { type: 'up', duration: 0.25 }, { type: 'down', duration: 0.25 }] },
    'bouncy-2-4': { name: 'Bouncy 2/4', bpm: 125, beatsPerMeasure: 2, timeSignature: '2/4', visual: ['D', 'x', 'D', 'U'], beats: [{ type: 'down', duration: 0.25 }, { type: 'rest', duration: 0.25 }, { type: 'down', duration: 0.25 }, { type: 'up', duration: 0.25 }] },

    // --- 3/4 Patterns ---
    'waltz-3-4': { name: 'Waltz', bpm: 140, beatsPerMeasure: 3, timeSignature: '3/4', visual: ['D', 'D', 'U', 'D', 'U'], beats: [{ type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }] },
    'classic-waltz': { name: 'Classic Waltz', bpm: 130, beatsPerMeasure: 3, timeSignature: '3/4', visual: ['D', 'D', 'D'], beats: [{ type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 3 }] },
    'folk-waltz': { name: 'Folk Waltz', bpm: 120, beatsPerMeasure: 3, timeSignature: '3/4', visual: ['D', 'D', 'U', 'D', 'U'], beats: [{ type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }] },
    'country-ballad-3-4': { name: 'Country Ballad', bpm: 90, beatsPerMeasure: 3, timeSignature: '3/4', visual: ['D', 'x', 'D', 'U', 'x', 'U'], beats: [{ type: 'down', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }] },
    'mazurka-3-4': { name: 'Mazurka Feel', bpm: 150, beatsPerMeasure: 3, timeSignature: '3/4', visual: ['D', 'x', 'D', 'x', 'D', 'x'], beats: [{ type: 'down', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }] },

    // --- 3/8 Patterns ---
    'simple-3-8': { name: 'Simple 3/8', bpm: 160, beatsPerMeasure: 3, timeSignature: '3/8', visual: ['D', 'D', 'D'], beats: [{ type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 3 }] },
    'quick-3-8': { name: 'Quick 3/8', bpm: 180, beatsPerMeasure: 3, timeSignature: '3/8', visual: ['D', 'U', 'D'], beats: [{ type: 'down', duration: 1 / 3 }, { type: 'up', duration: 1 / 3 }, { type: 'down', duration: 1 / 3 }] },
    'accented-3-8': { name: 'Accented 3/8', bpm: 150, beatsPerMeasure: 3, timeSignature: '3/8', visual: ['D', 'x', 'D'], beats: [{ type: 'down', duration: 1 / 3 }, { type: 'rest', duration: 1 / 3 }, { type: 'down', duration: 1 / 3 }] },
    'running-3-8': { name: 'Running 16ths', bpm: 140, beatsPerMeasure: 3, timeSignature: '3/8', visual: ['D', 'U', 'D', 'U', 'D', 'U'], beats: [{ type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }] },
    'gallop-3-8': { name: 'Gallop', bpm: 170, beatsPerMeasure: 3, timeSignature: '3/8', visual: ['D', 'D', 'U'], beats: [{ type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }] },

    // --- 6/8 Patterns ---
    'slow-ballad-6-8': { name: 'Slow Ballad', bpm: 120, beatsPerMeasure: 6, timeSignature: '6/8', visual: ['D', 'x', 'x', 'D', 'x', 'x'], beats: [{ type: 'down', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }] },
    'jig-6-8': { name: 'Jig Feel', bpm: 110, beatsPerMeasure: 6, timeSignature: '6/8', visual: ['D', 'x', 'D', 'D', 'x', 'D'], beats: [{ type: 'down', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'rest', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }] },
    'folk-6-8': { name: 'Folk 6/8', bpm: 100, beatsPerMeasure: 6, timeSignature: '6/8', visual: ['D', 'D', 'D', 'U'], beats: [{ type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }] },
    'simple-6-8': { name: 'Simple 6/8', bpm: 90, beatsPerMeasure: 6, timeSignature: '6/8', visual: ['D', 'D'], beats: [{ type: 'down', duration: 0.5 }, { type: 'down', duration: 0.5 }] },
    'running-6-8': { name: 'Running 6/8', bpm: 130, beatsPerMeasure: 6, timeSignature: '6/8', visual: ['D', 'U', 'D', 'U', 'D', 'U'], beats: [{ type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }, { type: 'down', duration: 1 / 6 }, { type: 'up', duration: 1 / 6 }] },

    // --- 9/8 Patterns ---
    'slip-jig-9-8': { name: 'Slip Jig', bpm: 120, beatsPerMeasure: 9, timeSignature: '9/8', visual: ['D', 'x', 'x', 'D', 'x', 'x', 'D', 'x', 'x'], beats: Array(9).fill(null).map((_, i) => ({ type: i % 3 === 0 ? 'down' : 'rest', duration: 1 / 9 })) },
    'simple-9-8': { name: 'Simple 9/8', bpm: 100, beatsPerMeasure: 9, timeSignature: '9/8', visual: ['D', 'D', 'D'], beats: [{ type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 3 }, { type: 'down', duration: 1 / 3 }] },
    'lyrical-9-8': { name: 'Lyrical 9/8', bpm: 90, beatsPerMeasure: 9, timeSignature: '9/8', visual: ['D', 'D', 'U', 'D', 'D', 'U', 'D', 'D', 'U'], beats: [{ type: 'down', duration: 1 / 9 }, { type: 'down', duration: 1 / 9 }, { type: 'up', duration: 1 / 9 }, { type: 'down', duration: 1 / 9 }, { type: 'down', duration: 1 / 9 }, { type: 'up', duration: 1 / 9 }, { type: 'down', duration: 1 / 9 }, { type: 'down', duration: 1 / 9 }, { type: 'up', duration: 1 / 9 }] },
    'running-9-8': { name: 'Running 9/8', bpm: 140, beatsPerMeasure: 9, timeSignature: '9/8', visual: ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U', 'D'], beats: Array(9).fill(null).map((_, i) => ({ type: i % 2 === 0 ? 'down' : 'up', duration: 1 / 9 })) },
    'valkyrie-9-8': { name: 'Valkyrie Gallop', bpm: 150, beatsPerMeasure: 9, timeSignature: '9/8', visual: ['D', 'U', 'D', 'D', 'U', 'D', 'D', 'U', 'D'], beats: [{ type: 'down', duration: 2 / 9 }, { type: 'up', duration: 1 / 9 }, { type: 'down', duration: 2 / 9 }, { type: 'up', duration: 1 / 9 }, { type: 'down', duration: 2 / 9 }, { type: 'up', duration: 1 / 9 }] },

    // --- 12/8 Patterns ---
    'blues-shuffle-12-8': { name: 'Blues Shuffle', bpm: 110, beatsPerMeasure: 12, timeSignature: '12/8', visual: ['D', 'x', 'U', 'D', 'x', 'U', 'D', 'x', 'U', 'D', 'x', 'U'], beats: Array(4).fill(null).flatMap(() => [{ type: 'down', duration: 2 / 12 }, { type: 'up', duration: 1 / 12 }]) },
    'simple-12-8': { name: 'Simple 12/8', bpm: 80, beatsPerMeasure: 12, timeSignature: '12/8', visual: ['D', 'D', 'D', 'D'], beats: [{ type: 'down', duration: 0.25 }, { type: 'down', duration: 0.25 }, { type: 'down', duration: 0.25 }, { type: 'down', duration: 0.25 }] },
    'slow-rock-12-8': { name: 'Slow Rock Ballad', bpm: 70, beatsPerMeasure: 12, timeSignature: '12/8', visual: ['D', 'x', 'x', 'D', 'x', 'x', 'D', 'x', 'x', 'D', 'x', 'x'], beats: Array(12).fill(null).map((_, i) => ({ type: i % 3 === 0 ? 'down' : 'rest', duration: 1 / 12 })) },
    'running-12-8': { name: 'Running 12/8', bpm: 120, beatsPerMeasure: 12, timeSignature: '12/8', visual: ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'], beats: Array(12).fill(null).map((_, i) => ({ type: i % 2 === 0 ? 'down' : 'up', duration: 1 / 12 })) },
    'doo-wop-12-8': { name: 'Doo-Wop', bpm: 90, beatsPerMeasure: 12, timeSignature: '12/8', visual: ['D', 'x', 'x', 'x', 'x', 'x', 'D', 'x', 'x', 'x', 'x', 'x'], beats: [{ type: 'down', duration: 1 / 12 }, ...Array(5).fill({ type: 'rest', duration: 1 / 12 }), { type: 'down', duration: 1 / 12 }, ...Array(5).fill({ type: 'rest', duration: 1 / 12 })] },
};

export const ARPEGGIO_PATTERNS: { [id: string]: ArpeggioPattern } = {
    // --- 4/4 Patterns ---
    'asc-44': { name: 'Ascending', bpm: 120, beatsPerMeasure: 4, timeSignature: '4/4', noteOrder: [] }, // Scalable
    'desc-44': { name: 'Descending', bpm: 120, beatsPerMeasure: 4, timeSignature: '4/4', noteOrder: [] }, // Scalable
    'up-down': { name: 'Up & Down', bpm: 120, beatsPerMeasure: 4, timeSignature: '4/4', noteOrder: [5, 4, 3, 2, 1, 0, 1, 2] },
    'alternating-bass': { name: 'Alternating Bass', bpm: 130, beatsPerMeasure: 4, timeSignature: '4/4', noteOrder: [5, 2, 1, 4, 2, 1] },
    'melodic-contour': { name: 'Melodic Contour', bpm: 120, beatsPerMeasure: 4, timeSignature: '4/4', noteOrder: [5, 2, 0, 1, 2, 0] },
    'forward-roll': { name: 'Forward Roll', bpm: 140, beatsPerMeasure: 4, timeSignature: '4/4', noteOrder: [5, 2, 0, 5, 2, 0, 5, 2] },
    'pachelbels-canon': { name: "Pachelbel's Canon", bpm: 90, beatsPerMeasure: 4, timeSignature: '4/4', noteOrder: [5, 4, 3, 2, 1, 0, 1, 2, 5, 4, 3, 2, 1, 0, 1, 2] },

    // --- 2/2 Patterns ---
    'asc-22': { name: 'Ascending (2/2)', bpm: 120, beatsPerMeasure: 2, timeSignature: '2/2', noteOrder: [] }, // Scalable
    'desc-22': { name: 'Descending (2/2)', bpm: 120, beatsPerMeasure: 2, timeSignature: '2/2', noteOrder: [] }, // Scalable
    'cut-outside-in': { name: 'Outside-In', bpm: 110, beatsPerMeasure: 2, timeSignature: '2/2', noteOrder: [5, 0, 4, 1] },
    'cut-inside-out': { name: 'Inside-Out', bpm: 110, beatsPerMeasure: 2, timeSignature: '2/2', noteOrder: [2, 3, 1, 4] },
    'cut-bass-chord': { name: 'Bass & Chord', bpm: 100, beatsPerMeasure: 2, timeSignature: '2/2', noteOrder: [5, 2, 1, 0] },

    // --- 2/4 Patterns ---
    'asc-24': { name: 'Ascending (2/4)', bpm: 120, beatsPerMeasure: 2, timeSignature: '2/4', noteOrder: [] }, // Scalable
    'desc-24': { name: 'Descending (2/4)', bpm: 120, beatsPerMeasure: 2, timeSignature: '2/4', noteOrder: [] }, // Scalable
    'polka-bass-24': { name: 'Polka Bass', bpm: 130, beatsPerMeasure: 2, timeSignature: '2/4', noteOrder: [5, 2, 4, 2] },
    'alternating-24': { name: 'Alternating', bpm: 110, beatsPerMeasure: 2, timeSignature: '2/4', noteOrder: [5, 3, 4, 2] },
    'simple-24': { name: 'Simple Arp', bpm: 100, beatsPerMeasure: 2, timeSignature: '2/4', noteOrder: [5, 3, 2, 1] },

    // --- 3/4 Patterns ---
    'asc-34': { name: 'Ascending (3/4)', bpm: 140, beatsPerMeasure: 3, timeSignature: '3/4', noteOrder: [] }, // Scalable
    'desc-34': { name: 'Descending (3/4)', bpm: 140, beatsPerMeasure: 3, timeSignature: '3/4', noteOrder: [] }, // Scalable
    'waltz-arpeggio': { name: 'Classic Waltz', bpm: 140, beatsPerMeasure: 3, timeSignature: '3/4', noteOrder: [5, 2, 1] },
    'pima-waltz-34': { name: 'PIMA Waltz', bpm: 130, beatsPerMeasure: 3, timeSignature: '3/4', noteOrder: [5, 2, 1, 0, 1, 2] },
    'travis-waltz-34': { name: 'Travis Waltz', bpm: 120, beatsPerMeasure: 3, timeSignature: '3/4', noteOrder: [5, 1, 4, 2, 5, 1] },

    // --- 3/8 Patterns ---
    'asc-38': { name: 'Ascending (3/8)', bpm: 160, beatsPerMeasure: 3, timeSignature: '3/8', noteOrder: [5, 3, 1] },
    'desc-38': { name: 'Descending (3/8)', bpm: 160, beatsPerMeasure: 3, timeSignature: '3/8', noteOrder: [0, 2, 4] },
    'outside-in-38': { name: 'Outside-In', bpm: 150, beatsPerMeasure: 3, timeSignature: '3/8', noteOrder: [5, 0, 4] },
    'pim-38': { name: 'P-I-M', bpm: 170, beatsPerMeasure: 3, timeSignature: '3/8', noteOrder: [5, 2, 1] },
    'broken-38': { name: 'Broken Chord', bpm: 150, beatsPerMeasure: 3, timeSignature: '3/8', noteOrder: [5, 1, 5] },

    // --- 6/8 Patterns ---
    'asc-68': { name: 'Ascending (6/8)', bpm: 120, beatsPerMeasure: 6, timeSignature: '6/8', noteOrder: [] }, // Scalable
    'desc-68': { name: 'Descending (6/8)', bpm: 120, beatsPerMeasure: 6, timeSignature: '6/8', noteOrder: [] }, // Scalable
    'pima-68': { name: 'PIMA Roll', bpm: 110, beatsPerMeasure: 6, timeSignature: '6/8', noteOrder: [5, 2, 1, 0, 1, 2] },
    'rolling-68': { name: 'Rolling', bpm: 130, beatsPerMeasure: 6, timeSignature: '6/8', noteOrder: [5, 2, 1, 5, 2, 1] },
    'thumb-fingers-68': { name: 'Thumb & Fingers', bpm: 100, beatsPerMeasure: 6, timeSignature: '6/8', noteOrder: [5, 2, 1, 4, 2, 1] },

    // --- 9/8 Patterns ---
    'asc-98': { name: 'Ascending (9/8)', bpm: 120, beatsPerMeasure: 9, timeSignature: '9/8', noteOrder: [] }, // Scalable
    'desc-98': { name: 'Descending (9/8)', bpm: 120, beatsPerMeasure: 9, timeSignature: '9/8', noteOrder: [] }, // Scalable
    'groups-of-3-98': { name: 'Groups of 3', bpm: 140, beatsPerMeasure: 9, timeSignature: '9/8', noteOrder: [5, 2, 1, 5, 2, 1, 5, 2, 1] },
    'cascade-98': { name: 'Cascade', bpm: 110, beatsPerMeasure: 9, timeSignature: '9/8', noteOrder: [5, 4, 3, 2, 1, 0, 1, 2, 3] },
    'broken-groups-98': { name: 'Broken Groups', bpm: 130, beatsPerMeasure: 9, timeSignature: '9/8', noteOrder: [5, 2, 1, 4, 2, 1, 5, 2, 1] },

    // --- 12/8 Patterns ---
    'asc-128': { name: 'Ascending (12/8)', bpm: 90, beatsPerMeasure: 12, timeSignature: '12/8', noteOrder: [] }, // Scalable
    'desc-128': { name: 'Descending (12/8)', bpm: 90, beatsPerMeasure: 12, timeSignature: '12/8', noteOrder: [] }, // Scalable
    'shuffle-arp-128': { name: 'Shuffle Arp', bpm: 110, beatsPerMeasure: 12, timeSignature: '12/8', noteOrder: [5, 2, 1, 5, 2, 1, 4, 2, 1, 4, 2, 1] },
    'groups-of-3-128': { name: 'Groups of 3', bpm: 100, beatsPerMeasure: 12, timeSignature: '12/8', noteOrder: [5, 2, 1, 5, 2, 1, 4, 2, 1, 4, 2, 1] },
    'slow-cascade-128': { name: 'Slow Cascade', bpm: 80, beatsPerMeasure: 12, timeSignature: '12/8', noteOrder: [5, 4, 3, 2, 1, 0, 5, 4, 3, 2, 1, 0] },
};