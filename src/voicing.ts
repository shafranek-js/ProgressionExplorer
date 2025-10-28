/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { voicingModal, voicingModalTitle, voicingOptionsContainer } from './dom';
import { GUITAR_CHORDS, UKULELE_CHORDS } from './data/chords';
import { ChordVoicingData } from './types';
import { generateMiniDiagram } from './svg';
import { getVoicingForChord } from './harmonics';
import { audio } from './audio';
import { getSavedInstrument } from './storage';
import { logger } from './logger';

let activeChordNode: HTMLElement | null = null;

/**
 * Opens the voicing selector modal for a specific chord node.
 * @param chordNodeEl The DOM element of the chord node that was clicked.
 */
export function openVoicingModal(chordNodeEl: HTMLElement) {
    if (!voicingModal || !voicingModalTitle || !voicingOptionsContainer) return;

    activeChordNode = chordNodeEl;
    const chordName = activeChordNode.dataset.chord;
    if (!chordName) return;

    const instrument = getSavedInstrument();
    if (!instrument) {
        logger.error("Cannot open voicing modal: no instrument selected.");
        return;
    }
    const chordDB = instrument === 'guitar' ? GUITAR_CHORDS : UKULELE_CHORDS;
    const allVoicings = chordDB[chordName];
    const currentVoicingIndex = parseInt(activeChordNode.dataset.voicingIndex || '0', 10);

    if (!allVoicings || allVoicings.length <= 1) {
        // No alternate voicings to show.
        return;
    }

    voicingModalTitle.textContent = `${chordName} Voicings`;
    voicingOptionsContainer.innerHTML = '';

    allVoicings.forEach((voicingData, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'flex flex-col gap-2 bg-gray-700 p-3 rounded-lg border-2';
        optionEl.style.borderColor = index === currentVoicingIndex ? '#3b82f6' : 'transparent';

        const diagramEl = document.createElement('div');
        diagramEl.innerHTML = generateMiniDiagram(voicingData, instrument);

        const buttonsEl = document.createElement('div');
        buttonsEl.className = 'flex items-center gap-2';

        const previewBtn = document.createElement('button');
        previewBtn.className = 'flex-grow bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm';
        previewBtn.textContent = 'Preview';
        previewBtn.addEventListener('click', async () => {
            await audio.init();
            const voicing = getVoicingForChord(chordName, instrument, index);
            if (voicing.length > 0) {
                audio.playChord(voicing.map(v => v.note), instrument);
            }
        });

        const selectBtn = document.createElement('button');
        selectBtn.className = 'flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm';
        selectBtn.textContent = 'Select';
        selectBtn.addEventListener('click', () => {
            applyVoicing(index, voicingData);
            closeVoicingModal();
        });

        buttonsEl.appendChild(previewBtn);
        buttonsEl.appendChild(selectBtn);
        optionEl.appendChild(diagramEl);
        optionEl.appendChild(buttonsEl);
        voicingOptionsContainer.appendChild(optionEl);
    });

    voicingModal.classList.remove('hidden');
    setTimeout(() => {
        voicingModal.classList.add('active');
    }, 10);
}

/**
 * Applies the selected voicing to the active chord node.
 * @param index The index of the selected voicing.
 * @param voicingData The data for the selected voicing.
 */
function applyVoicing(index: number, voicingData: ChordVoicingData) {
    if (!activeChordNode) return;

    const instrument = getSavedInstrument();
    if (!instrument) return;

    // Update the data attribute on the node
    activeChordNode.dataset.voicingIndex = String(index);

    // Re-render the diagram inside the node
    const diagramContainer = activeChordNode.querySelector('.diagram-container');
    if (diagramContainer) {
        diagramContainer.innerHTML = generateMiniDiagram(voicingData, instrument);
    }
}

/**
 * Closes the voicing selector modal.
 */
export function closeVoicingModal() {
    if (!voicingModal) return;
    voicingModal.classList.remove('active');
    setTimeout(() => {
        voicingModal.classList.add('hidden');
        activeChordNode = null;
    }, 300); // Should match CSS transition duration
}