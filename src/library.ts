/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { chordLibraryModal, chordLibraryList, chordLibrarySearchInput } from './dom';
import { GUITAR_CHORDS, UKULELE_CHORDS } from './data/chords';
import { getChordIntervalsDescription, getNotesInChord, getVoicingForChord, parseChordName } from './harmonics';
import { generateMiniDiagram } from './svg';
import { audio } from './audio';

let isLibraryPopulated = false;
let onChordSelectCallback: ((chordName: string) => void) | null = null;
let isSelectionMode = false;


/**
 * Generates a human-readable description of a chord's typical "feel" or usage.
 * @param quality - The quality of the chord (e.g., 'm', '7', 'maj7').
 * @returns A string description.
 */
function getChordFeelDescription(quality: string): string {
    switch (quality) {
        case '': return 'Bright, happy, and stable. The foundation of major keys.';
        case 'm': return 'Somber, melancholic, or thoughtful in character.';
        case '7': return 'Tense and bluesy, strongly pulls towards resolution.';
        case 'maj7': return 'Jazzy, dreamy, and sophisticated. A mellow sound.';
        case 'm7': return 'Soulful, mellow, and jazzy. Common in R&B and jazz.';
        case 'm7b5': return 'Dissonant and mysterious. Often used in jazz turnarounds.';
        case 'dim': return 'Highly tense and unstable, typically used as a passing chord.';
        case 'sus4': return 'Open, airy, and unresolved. Creates anticipation.';
        case 'sus2': return 'Bright, modern, and spacious. Less tension than a sus4.';
        case '9': return 'A richer, funkier, and more colorful dominant chord.';
        case 'm9': return 'Lush, complex, and moody. A sophisticated minor sound.';
        case 'maj9': return 'Warm, gentle, and dreamy. A very rich major sound.';
        case '7sus4': return 'A modern, smoother dominant sound with less dissonance.';
        default: return 'A complex and interesting chord.';
    }
}

/**
 * Populates the chord library modal with all available chords if it hasn't been already.
 */
export function populateChordLibrary() {
    if (isLibraryPopulated) return;

    chordLibraryList.innerHTML = '<p class="text-gray-400 col-span-full">Loading library...</p>';

    const guitarChords = Object.keys(GUITAR_CHORDS);
    const ukuleleChords = Object.keys(UKULELE_CHORDS);
    const allChordNames = [...new Set([...guitarChords, ...ukuleleChords])].sort();

    const fragment = document.createDocumentFragment();

    for (const chordName of allChordNames) {
        const parsed = parseChordName(chordName);
        if (!parsed) continue;

        const notesInfo = getNotesInChord(chordName);
        const intervals = getChordIntervalsDescription(chordName);
        const feel = getChordFeelDescription(parsed.quality);
        const guitarVoicings = GUITAR_CHORDS[chordName];
        const ukuleleVoicings = UKULELE_CHORDS[chordName];

        const item = document.createElement('div');
        item.className = 'chord-library-item bg-gray-900/50 p-4 rounded-lg flex flex-col gap-3 border border-gray-700';
        item.dataset.chordName = chordName;

        item.innerHTML = `
            <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold text-white">${chordName}</h3>
            </div>
            <div>
                <p class="text-sm text-gray-400 italic">${feel}</p>
            </div>
            <div class="text-sm space-y-1">
                <p><strong class="font-medium text-gray-300">Notes:</strong> ${notesInfo?.notes.join(' - ') || 'N/A'}</p>
                <p><strong class="font-medium text-gray-300">Intervals:</strong> ${intervals || 'N/A'}</p>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <h4 class="font-semibold text-sm text-center mb-1">Guitar</h4>
                    ${(guitarVoicings && guitarVoicings.length > 0) 
                        ? `<div class="bg-gray-800 rounded p-1 playable-diagram cursor-pointer transition-transform hover:scale-105" data-instrument="guitar" title="Play Guitar Chord">${generateMiniDiagram(guitarVoicings[0], 'guitar')}</div>` 
                        : '<div class="bg-gray-800 rounded p-1 h-[88px] flex items-center justify-center text-xs text-gray-500">N/A</div>'
                    }
                </div>
                 <div>
                    <h4 class="font-semibold text-sm text-center mb-1">Ukulele</h4>
                    ${(ukuleleVoicings && ukuleleVoicings.length > 0) 
                        ? `<div class="bg-gray-800 rounded p-1 playable-diagram cursor-pointer transition-transform hover:scale-105" data-instrument="ukulele" title="Play Ukulele Chord">${generateMiniDiagram(ukuleleVoicings[0], 'ukulele')}</div>` 
                        : '<div class="bg-gray-800 rounded p-1 h-[88px] flex items-center justify-center text-xs text-gray-500">N/A</div>'
                    }
                </div>
            </div>
        `;
        fragment.appendChild(item);
    }
    
    chordLibraryList.innerHTML = '';
    chordLibraryList.appendChild(fragment);

    // Add event listener only once using the flag
    if (!isLibraryPopulated) {
        chordLibraryList.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const diagramContainer = target.closest('.playable-diagram');
            const item = target.closest('.chord-library-item') as HTMLElement;
            if (!item) return;
            
            const chordName = item.dataset.chordName!;

            // If a diagram was clicked, only play audio and then stop.
            if (diagramContainer) {
                e.stopPropagation();
                const instrument = (diagramContainer as HTMLElement).dataset.instrument;

                if (chordName && instrument) {
                    chordLibraryList.querySelectorAll('.playable-diagram.highlighted').forEach(el => {
                        el.classList.remove('highlighted');
                    });
                    diagramContainer.classList.add('highlighted');
                    
                    await audio.init();
                    const voicing = getVoicingForChord(chordName, instrument, 0);
                    if (voicing.length > 0) {
                        audio.playChord(voicing.map(v => v.note), instrument);
                    }
                }
                return; // IMPORTANT: return here to prevent selection
            }

            // If we are in selection mode, and the click was on the item (but not a diagram), trigger callback.
            if (isSelectionMode && onChordSelectCallback) {
                onChordSelectCallback(chordName);
            }
        });
    }

    isLibraryPopulated = true;
}

/**
 * Filters the displayed chords in the library based on the search input.
 * @param event - The input event from the search field.
 */
export function filterChordLibrary(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase().trim();
    const items = chordLibraryList.querySelectorAll('.chord-library-item');
    
    let foundItems = 0;
    items.forEach(item => {
        const chordName = (item as HTMLElement).dataset.chordName;
        if (chordName && chordName.toLowerCase().startsWith(searchTerm)) {
            (item as HTMLElement).style.display = '';
            foundItems++;
        } else {
            (item as HTMLElement).style.display = 'none';
        }
    });

    // Display a message if no items are found
    const noResultsMessage = chordLibraryList.querySelector('.no-results');
    if (foundItems === 0 && searchTerm) {
        if (!noResultsMessage) {
            const messageEl = document.createElement('p');
            messageEl.className = 'no-results text-gray-400 col-span-full text-center';
            messageEl.textContent = 'No chords found.';
            chordLibraryList.appendChild(messageEl);
        }
    } else {
        noResultsMessage?.remove();
    }
}


/**
 * Opens the chord library modal for browsing.
 */
export function openChordLibraryModal() {
    populateChordLibrary();
    isSelectionMode = false;
    chordLibraryList.classList.remove('selection-mode');
    chordLibraryModal.classList.remove('hidden');
    setTimeout(() => chordLibraryModal.classList.add('active'), 10);
}

/**
 * Opens the chord library modal in a special "selection" mode.
 * @param callback The function to call with the selected chord name.
 * @param searchQuery An optional string to pre-fill the search box.
 */
export function openLibraryForSelection(callback: (chordName: string) => void, searchQuery?: string) {
    populateChordLibrary();
    onChordSelectCallback = callback;
    isSelectionMode = true;
    chordLibraryList.classList.add('selection-mode');
    
    chordLibrarySearchInput.value = searchQuery || '';
    filterChordLibrary({ target: chordLibrarySearchInput } as unknown as Event);

    chordLibraryModal.classList.remove('hidden');
    setTimeout(() => chordLibraryModal.classList.add('active'), 10);
}

/**
 * Closes the chord library modal.
 */
export function closeChordLibraryModal() {
    onChordSelectCallback = null;
    isSelectionMode = false;
    chordLibraryList.classList.remove('selection-mode');
    chordLibraryModal.classList.remove('active');
    
    // Reset search field and filter when closing
    chordLibrarySearchInput.value = '';
    filterChordLibrary({ target: chordLibrarySearchInput } as unknown as Event);

    setTimeout(() => chordLibraryModal.classList.add('hidden'), 300);
}