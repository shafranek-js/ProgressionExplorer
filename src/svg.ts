/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChordVoicingData } from './types';
import { GUITAR_TUNING, UKULELE_TUNING } from './data/tunings';
import { getNoteFromFret, getNotesInChord, parseChordName } from './harmonics';

/**
 * Generates a small, horizontally oriented SVG chord diagram.
 * @param voicingData - An object containing frets and optional barre information.
 * @param instrument - The name of the instrument ('guitar' or 'ukulele').
 * @returns An SVG string.
 */
export function generateMiniDiagram(voicingData: ChordVoicingData, instrument: string): string {
    const isGuitar = instrument === 'guitar';
    const numStrings = isGuitar ? 6 : 4;
    const { frets, barres } = voicingData;
    
    // --- Determine Diagram Window ---
    const numericFrets = frets.filter(f => typeof f === 'number') as number[];
    const maxFret = numericFrets.length > 0 ? Math.max(...numericFrets) : 0;
    const positiveFrets = numericFrets.filter(f => f > 0);
    const minPositiveFret = positiveFrets.length > 0 ? Math.min(...positiveFrets) : 0;
    
    let baseFret = 1;
    // If any fret is higher than 4, shift the diagram window to that position.
    if (maxFret > 4 && minPositiveFret > 0) {
        baseFret = minPositiveFret;
    }
    const numFretsToShow = 5;

    // --- SVG Drawing Setup ---
    const width = 100;
    const height = 80;
    const startX = 25;
    const startY = 15;
    const fretWidth = (width - startX - 5) / numFretsToShow;
    const stringHeight = (height - startY - 20) / (numStrings - 1);

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chord-diagram">`;
    
    // Add base fret label if not starting at the nut
    if (baseFret > 1) {
        svg += `<text x="${startX - 15}" y="${startY + 5}" dominant-baseline="hanging" text-anchor="middle" font-size="10" fill="currentColor">${baseFret}fr</text>`;
    }
    
    // Strings (Horizontal)
    for (let i = 0; i < numStrings; i++) {
        const y = startY + i * stringHeight;
        svg += `<line class="string-line" data-string-index="${i}" x1="${startX}" y1="${y}" x2="${startX + numFretsToShow * fretWidth}" y2="${y}" stroke="currentColor" stroke-width="0.5" />`;
    }

    // Frets (Vertical), with the nut being thicker if it's the nut (baseFret === 1)
    const nutWidth = baseFret === 1 ? 2.5 : 0.5;
    svg += `<line x1="${startX}" y1="${startY}" x2="${startX}" y2="${startY + stringHeight * (numStrings - 1)}" stroke="currentColor" stroke-width="${nutWidth}" />`;
    for (let i = 1; i <= numFretsToShow; i++) {
        const x = startX + i * fretWidth;
        svg += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + stringHeight * (numStrings - 1)}" stroke="currentColor" stroke-width="0.5" />`;
    }

    // Barre(s) (Vertical Rectangle) - Drawn from explicit data
    if (barres) {
        for (const barre of barres) {
            const relativeFret = barre.fret - baseFret + 1;
            // Only draw the barre if it's within the visible fret window
            if (relativeFret > 0 && relativeFret <= numFretsToShow) {
                const x = startX + (relativeFret * fretWidth) - (fretWidth / 2);
                const barreYStart = startY + barre.from * stringHeight;
                const barreYEnd = startY + barre.to * stringHeight;
                svg += `<rect x="${x - 4}" y="${barreYStart - 4}" width="8" height="${barreYEnd - barreYStart + 8}" rx="4" ry="4" fill="currentColor" />`;
            }
        }
    }


    // Dots, open/muted strings
    frets.forEach((fret, stringIndex) => {
        const y = startY + stringIndex * stringHeight;

        if (fret === 'x') {
            svg += `<text x="${startX - 10}" y="${y}" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="currentColor">x</text>`;
        } else if (fret === 0) {
            // Only show open string 'o' if we are at the nut
            if (baseFret === 1) {
                svg += `<text x="${startX - 10}" y="${y}" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="currentColor">o</text>`;
            }
        } else if (typeof fret === 'number' && fret > 0) {
            const relativeFret = fret - baseFret + 1;
            if (relativeFret > 0 && relativeFret <= numFretsToShow) {
                const x = startX + (relativeFret * fretWidth) - (fretWidth / 2);
                svg += `<circle cx="${x}" cy="${y}" r="4" fill="currentColor" />`;
            }
        }
    });

    svg += `</svg>`;
    return svg;
}


/**
 * Generates a full fretboard diagram showing a specific chord voicing.
 * @param voicingData - The specific voicing to render.
 * @param instrument - The name of the instrument.
 * @param chordName - The name of the chord, used to identify root notes.
 * @returns An SVG string.
 */
export function generateFretboardVoicingDiagram(voicingData: ChordVoicingData, instrument: string, chordName: string): string {
    const isGuitar = instrument === 'guitar';
    const tuning = isGuitar ? GUITAR_TUNING : UKULELE_TUNING;
    const numStrings = tuning.length;
    const numFrets = 12;

    const width = 800;
    const height = 150;
    const fretWidth = width / (numFrets + 2); // Add more space for open/muted strings
    const stringHeight = (height - 40) / (numStrings - 1);
    const startX = fretWidth * 1.5; // Start drawing further right
    const startY = 20;

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="fretboard-diagram">`;

    // --- Draw Fretboard ---
    // Nut
    svg += `<rect x="${startX}" y="${startY}" width="5" height="${(numStrings - 1) * stringHeight}" fill="#ccc" />`;

    // Frets
    for (let i = 1; i <= numFrets; i++) {
        const x = startX + i * fretWidth;
        svg += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + (numStrings - 1) * stringHeight}" stroke="#aaa" stroke-width="1.5" />`;
    }

    // Strings
    for (let i = 0; i < numStrings; i++) {
        const y = startY + i * stringHeight;
        const strokeWidth = 1 + ((numStrings - 1 - i) * 0.2);
        svg += `<line x1="${startX}" y1="${y}" x2="${startX + numFrets * fretWidth}" y2="${y}" stroke="#ddd" stroke-width="${strokeWidth}" />`;
    }
    
    // Fret markers
    const markers = isGuitar ? [3, 5, 7, 9, 12] : [3, 5, 7, 10, 12];
    markers.forEach(fret => {
        const x = startX + fret * fretWidth - fretWidth / 2;
        const y = startY + (numStrings - 1) * stringHeight / 2;
        if (fret === 12) {
            svg += `<circle cx="${x}" cy="${y - stringHeight}" r="5" fill="#888" />`;
            svg += `<circle cx="${x}" cy="${y + stringHeight}" r="5" fill="#888" />`;
        } else {
            svg += `<circle cx="${x}" cy="${y}" r="5" fill="#888" />`;
        }
    });

    // --- Render the Voicing ---
    const chordInfo = getNotesInChord(chordName);
    if (!chordInfo) return svg + `</svg>`;
    const rootNoteSimple = parseChordName(chordInfo.root)!.root;

    // Barres
    if (voicingData.barres) {
        for (const barre of voicingData.barres) {
            const x = startX + barre.fret * fretWidth - fretWidth / 2;
            const yStart = startY + barre.from * stringHeight;
            const height = (barre.to - barre.from) * stringHeight;
            svg += `<rect x="${x - 5}" y="${yStart - 5}" width="10" height="${height + 10}" rx="5" ry="5" fill="#a78bfa" fill-opacity="0.8" />`;
        }
    }

    // Dots, open/muted strings
    voicingData.frets.forEach((fret, stringIndex) => {
        const y = startY + stringIndex * stringHeight;
        const openStringNote = tuning[stringIndex];

        if (fret === 'x') {
            svg += `<text x="${startX - fretWidth / 1.5}" y="${y}" class="fretboard-note" font-size="20" fill="#888">x</text>`;
        } else if (fret === 0) {
            svg += `<circle cx="${startX - fretWidth / 1.5}" cy="${y}" r="8" stroke-width="2" stroke="#fff" fill="none" />`;
        } else if (typeof fret === 'number') {
            const x = startX + fret * fretWidth - fretWidth / 2;
            const noteName = getNoteFromFret(openStringNote, fret);
            const simpleNote = parseChordName(noteName)!.root;
            const isRoot = simpleNote === rootNoteSimple;
            const color = isRoot ? '#3b82f6' : '#a78bfa';

            svg += `<g class="fretboard-note-marker">`;
            svg += `<circle cx="${x}" cy="${y}" r="10" fill="${color}" />`;
            svg += `<text x="${x}" y="${y}" class="fretboard-note">${simpleNote}</text>`;
            svg += `</g>`;
        }
    });

    svg += `</svg>`;
    return svg;
}