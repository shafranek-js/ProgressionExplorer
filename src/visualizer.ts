/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
    chordSelect, circleOfFifthsContainer, keyExplorerModal, 
    fretboardModal, fretboardVisualizerContainer, fretboardModalTitle, 
    fretboardPrevVoicingBtn, fretboardNextVoicingBtn, fretboardVoicingIndicator 
} from './dom';
import { getKeyForTonic } from './harmonics';
import { MAJOR_KEYS_DIATONIC } from './data/theory';
import { GUITAR_CHORDS, UKULELE_CHORDS } from './data/chords';
import { ChordVoicingData } from './types';
import { generateFretboardVoicingDiagram } from './svg';
import { getSavedInstrument } from './storage';
import { logger } from './logger';

const CIRCLE_KEYS = [
    { major: 'C', minor: 'Am' }, { major: 'G', minor: 'Em' },
    { major: 'D', minor: 'Bm' }, { major: 'A', minor: 'F#m' },
    { major: 'E', minor: 'C#m' }, { major: 'B', minor: 'G#m' },
    { major: 'F#', minor: 'Ebm' }, { major: 'Db', minor: 'Bbm' },
    { major: 'Ab', minor: 'Fm' }, { major: 'Eb', minor: 'Cm' },
    { major: 'Bb', minor: 'Gm' }, { major: 'F', minor: 'Dm' }
];

/**
 * Renders the Circle of Fifths visualization into its container.
 * @param tonicChord - The currently selected tonic chord (e.g., 'C', 'G', 'Am').
 */
function renderCircleOfFifths(tonicChord: string) {
    if (!circleOfFifthsContainer) return;

    // Determine the diatonic chords for the current key
    const key = getKeyForTonic(tonicChord);
    const diatonicChords = key ? Object.values(MAJOR_KEYS_DIATONIC[key]) : [];
    
    // SVG Dimensions
    const width = 500;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const majorRadius = 210;
    const minorRadius = 155;

    let svgContent = '';

    CIRCLE_KEYS.forEach((keyPair, i) => {
        // Calculate angle for positioning. Start C at the top (-90 degrees).
        const angle = (i / 12) * 2 * Math.PI - (Math.PI / 2);

        // Major key position
        const majorX = centerX + majorRadius * Math.cos(angle);
        const majorY = centerY + majorRadius * Math.sin(angle);
        
        // Minor key position
        const minorX = centerX + minorRadius * Math.cos(angle);
        const minorY = centerY + minorRadius * Math.sin(angle);

        // Check if chords are diatonic to the selected key
        const isMajorDiatonic = diatonicChords.includes(keyPair.major);
        const isMinorDiatonic = diatonicChords.includes(keyPair.minor);
        const highlightClass = (isMajorDiatonic || isMinorDiatonic) ? 'highlighted' : '';
        
        svgContent += `
            <g class="key-label ${highlightClass}" data-major-chord="${keyPair.major}">
                <text x="${majorX}" y="${majorY}" class="major-key" text-anchor="middle" dominant-baseline="middle">${keyPair.major}</text>
                <text x="${minorX}" y="${minorY}" class="minor-key" text-anchor="middle" dominant-baseline="middle">${keyPair.minor}</text>
            </g>
        `;
    });

    circleOfFifthsContainer.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${centerX}" cy="${centerY}" r="${majorRadius + 25}" fill="none" stroke="#4b5563" stroke-width="1"/>
            <circle cx="${centerX}" cy="${centerY}" r="${minorRadius - 20}" fill="none" stroke="#4b5563" stroke-width="1"/>
            ${svgContent}
        </svg>
    `;

    // Add event listeners to the new SVG elements
    circleOfFifthsContainer.querySelectorAll('.key-label').forEach(el => {
        el.addEventListener('click', () => {
            const newTonic = (el as HTMLElement).dataset.majorChord;
            if (newTonic && Array.from(chordSelect.options).some(opt => opt.value === newTonic)) {
                chordSelect.value = newTonic;
                // Trigger a change event to re-render the main app
                chordSelect.dispatchEvent(new Event('change'));
                closeKeyExplorer();
            }
        });
    });
}

/**
 * Opens the key explorer modal and renders the visualization.
 */
export function openKeyExplorer() {
    if (!keyExplorerModal) return;
    const tonicChord = chordSelect.value;
    renderCircleOfFifths(tonicChord);
    keyExplorerModal.classList.remove('hidden');
    // Use a timeout to allow the display property to apply before adding transition classes
    setTimeout(() => {
        keyExplorerModal.classList.add('active');
    }, 10);
}

/**
 * Closes the key explorer modal.
 */
export function closeKeyExplorer() {
    if (!keyExplorerModal) return;
    keyExplorerModal.classList.remove('active');
    // Wait for transition to finish before hiding with display:none
    setTimeout(() => {
        keyExplorerModal.classList.add('hidden');
    }, 300); // Should match CSS transition duration
}


// --- Fretboard Voicing Explorer State ---
let currentFretboardVoicings: ChordVoicingData[] = [];
let currentFretboardChordName: string = '';
let currentVoicingIndex = 0;


/**
 * Renders the currently selected voicing in the fretboard visualizer.
 */
function renderCurrentFretboardVoicing() {
    if (currentFretboardVoicings.length === 0) {
        fretboardVisualizerContainer.innerHTML = `<p class="text-gray-400">No voicings available for this chord.</p>`;
        fretboardVoicingIndicator.textContent = 'Voicing 0 of 0';
        fretboardPrevVoicingBtn.disabled = true;
        fretboardNextVoicingBtn.disabled = true;
        return;
    }

    const instrument = getSavedInstrument();
    if (!instrument) {
        logger.error("Cannot render fretboard: no instrument selected.");
        return;
    }
    const currentVoicing = currentFretboardVoicings[currentVoicingIndex];
    
    fretboardVisualizerContainer.innerHTML = generateFretboardVoicingDiagram(currentVoicing, instrument, currentFretboardChordName);
    
    // Update controls
    fretboardVoicingIndicator.textContent = `Voicing ${currentVoicingIndex + 1} of ${currentFretboardVoicings.length}`;
    fretboardPrevVoicingBtn.disabled = currentVoicingIndex === 0;
    fretboardNextVoicingBtn.disabled = currentVoicingIndex === currentFretboardVoicings.length - 1;
}

/**
 * Opens the fretboard visualizer modal and populates it with chord voicings.
 */
export function openFretboardVisualizer(chordName: string) {
    if (!fretboardModal || !fretboardVisualizerContainer || !fretboardModalTitle) return;
    
    const instrument = getSavedInstrument();
    if (!instrument) {
        logger.error("Cannot open fretboard visualizer: no instrument selected.");
        return;
    }
    const chordDB = instrument === 'guitar' ? GUITAR_CHORDS : UKULELE_CHORDS;
    
    currentFretboardChordName = chordName;
    currentFretboardVoicings = chordDB[chordName] || [];
    currentVoicingIndex = 0;
    
    fretboardModalTitle.textContent = `${chordName} Chord - ${instrument.charAt(0).toUpperCase() + instrument.slice(1)}`;
    
    renderCurrentFretboardVoicing();

    fretboardModal.classList.remove('hidden');
    setTimeout(() => {
        fretboardModal.classList.add('active');
    }, 10);
}

/**
 * Closes the fretboard visualizer modal.
 */
export function closeFretboardVisualizer() {
    if (!fretboardModal) return;
    fretboardModal.classList.remove('active');
    setTimeout(() => {
        fretboardModal.classList.add('hidden');
    }, 300);
}

/**
 * Navigates to the next available voicing in the fretboard visualizer.
 */
export function showNextFretboardVoicing() {
    if (currentVoicingIndex < currentFretboardVoicings.length - 1) {
        currentVoicingIndex++;
        renderCurrentFretboardVoicing();
    }
}

/**
 * Navigates to the previous available voicing in the fretboard visualizer.
 */
export function showPreviousFretboardVoicing() {
     if (currentVoicingIndex > 0) {
        currentVoicingIndex--;
        renderCurrentFretboardVoicing();
    }
}