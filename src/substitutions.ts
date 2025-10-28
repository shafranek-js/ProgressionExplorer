/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { substitutionModal, substitutionModalTitle, substitutionOptionsContainer, chordSelect } from './dom';
import { getChordSubstitutions, getVoicingForChord } from './harmonics';
import { generateMiniDiagram } from './svg';
import { audio } from './audio';
import { replaceChordNode } from './tree';
import { getSavedInstrument } from './storage';
import { logger } from './logger';

let activeChordNode: HTMLElement | null = null;

/**
 * Opens the substitution selector modal for a specific chord node.
 * @param chordNodeEl The DOM element of the chord node that was right-clicked.
 */
export function openSubstitutionModal(chordNodeEl: HTMLElement, key: string) {
    if (!substitutionModal || !substitutionModalTitle || !substitutionOptionsContainer) return;

    activeChordNode = chordNodeEl;
    const chordName = activeChordNode.dataset.chord;
    const instrument = getSavedInstrument();
    if (!instrument) {
        logger.error("Cannot open substitutions: no instrument selected.");
        return;
    }
    
    if (!chordName) return;

    const substitutions = getChordSubstitutions(chordName, key, instrument);

    substitutionModalTitle.textContent = `Substitutions for ${chordName}`;
    substitutionOptionsContainer.innerHTML = '';

    if (substitutions.length === 0) {
        substitutionOptionsContainer.innerHTML = `<p class="text-gray-400 text-center col-span-full">No common substitutions found.</p>`;
    } else {
        substitutions.forEach(sub => {
            const optionEl = document.createElement('div');
            optionEl.className = 'flex flex-col gap-2 bg-gray-700 p-3 rounded-lg';

            const infoEl = document.createElement('div');
            infoEl.innerHTML = `
                <div class="font-bold text-lg">${sub.name}</div>
                <div class="text-xs text-gray-400 italic">${sub.description}</div>
            `;
            
            const diagramEl = document.createElement('div');
            diagramEl.innerHTML = generateMiniDiagram(sub.voicing, instrument);

            const buttonsEl = document.createElement('div');
            buttonsEl.className = 'flex items-center gap-2 mt-2';

            const previewBtn = document.createElement('button');
            previewBtn.className = 'flex-grow bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm';
            previewBtn.textContent = 'Preview';
            previewBtn.addEventListener('click', async () => {
                await audio.init();
                const voicing = getVoicingForChord(sub.name, instrument, 0);
                if (voicing.length > 0) {
                    audio.playChord(voicing.map(v => v.note), instrument);
                }
            });

            const selectBtn = document.createElement('button');
            selectBtn.className = 'flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm';
            selectBtn.textContent = 'Select';
            selectBtn.addEventListener('click', () => {
                replaceChordNode(activeChordNode!, sub.name);
                closeSubstitutionModal();
            });

            buttonsEl.appendChild(previewBtn);
            buttonsEl.appendChild(selectBtn);
            optionEl.appendChild(infoEl);
            optionEl.appendChild(diagramEl);
            optionEl.appendChild(buttonsEl);
            substitutionOptionsContainer.appendChild(optionEl);
        });
    }

    substitutionModal.classList.remove('hidden');
    setTimeout(() => {
        substitutionModal.classList.add('active');
    }, 10);
}

/**
 * Closes the substitution selector modal.
 */
export function closeSubstitutionModal() {
    if (!substitutionModal) return;
    substitutionModal.classList.remove('active');
    setTimeout(() => {
        substitutionModal.classList.add('hidden');
        activeChordNode = null;
    }, 300); // Should match CSS transition duration
}