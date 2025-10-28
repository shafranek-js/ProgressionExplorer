/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { connectionsSVG, treeContainer, treeRootEl, progressionSelect, chordSelect, borrowedChordsToggle, keyQualityToggle, clearProgressionBtn, backToExploreBtn, progressionToolbarContainer, progressionPreviewChords } from './dom';
import { generateMiniDiagram } from './svg';
import { getCommonProgressions, getVoicingForChord, getKeyForTonic, getChordIntervalsDescription, getChordFunctionGroup, parseChordName, realizeRomanNumeral } from './harmonics';
import { audio } from './audio';
import { GUITAR_CHORDS, UKULELE_CHORDS } from './data/chords';
import { PROGRESSIONS, PROGRESSION_FORMULAS } from './data/progressions';
import { MAJOR_KEYS_DIATONIC, MAJOR_KEYS_DIATONIC_SEVENTHS, MINOR_KEYS_DIATONIC, MINOR_KEYS_DIATONIC_SEVENTHS } from './data/theory';
import { openFretboardVisualizer } from './visualizer';
import { openVoicingModal } from './voicing';
import { getPatternById, openStrummingModal, openArpeggioModal, getActiveBpm } from './strumming';
import { StrummingPattern, ArpeggioPattern, SongSection } from './types';
import { openSubstitutionModal } from './substitutions';
import { openLibraryForSelection, closeChordLibraryModal } from './library';
import { SavedSong, getSavedInstrument } from './storage';
import { logger } from './logger';
import { getCurrentZoom } from './panning';
import { toggleSongArrangerPanel } from './song-arranger';


const STRUM_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>`;
const ARPEGGIO_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>`;
const BLOCK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4z"></path></svg>`;

/**
 * Initializes event listeners for the tree. Must be called after `initializeDom`.
 */
export function initializeTree() {
    // Add a global listener to update node visuals when a pattern is changed anywhere.
    treeRootEl.addEventListener('patternchange', (e) => {
        if (e.target instanceof HTMLElement && e.target.classList.contains('chord-node')) {
            updateTreeVisualsFromNode(e.target);
        }
    });

    // Drag-and-drop from progression bar to song arranger
    progressionPreviewChords.addEventListener('dragstart', (e) => {
        const payload = (e.currentTarget as HTMLElement).dataset.dragPayload;
        if (payload && e.dataTransfer) {
            e.dataTransfer.setData('application/json', payload);
            e.dataTransfer.effectAllowed = 'copy';
            progressionPreviewChords.classList.add('dragging');
        } else {
            e.preventDefault();
        }
    });
    progressionPreviewChords.addEventListener('dragend', () => {
        progressionPreviewChords.classList.remove('dragging');
    });
}

/**
 * Recursively finds the effective playback pattern for a node, traversing up the tree if necessary.
 * @param node The chord node element to check.
 * @returns An object with the pattern and a boolean indicating if it was inherited.
 */
export function getEffectivePatternForNode(node: HTMLElement): { pattern: (StrummingPattern | ArpeggioPattern) | null, isInherited: boolean } {
    if (!node) {
        return { pattern: null, isInherited: false };
    }

    const strumId = node.dataset.strumPatternId;
    if (strumId) {
        return { pattern: getPatternById(strumId), isInherited: false };
    }

    const arpeggioId = node.dataset.arpeggioPatternId;
    if (arpeggioId) {
        return { pattern: getPatternById(arpeggioId), isInherited: false };
    }

    // Explicit block style acts as an override
    if (node.dataset.playbackStyle === 'block') {
        return { pattern: null, isInherited: false };
    }

    const parentId = node.dataset.parentId;
    if (parentId) {
        const parentNode = document.getElementById(parentId);
        if (parentNode) {
            const parentResult = getEffectivePatternForNode(parentNode);
            // Only consider it inherited if there is an actual pattern
            if (parentResult.pattern) { 
                return { pattern: parentResult.pattern, isInherited: true };
            }
        }
    }

    return { pattern: null, isInherited: false };
}


/** Updates the visual state of a chord node (icon and tooltip) based on its effective pattern. */
function updateChordNodeVisuals(node: HTMLElement) {
    if (!node) return;

    const indicator = node.querySelector('.pattern-indicator') as HTMLElement;
    const tooltipInfo = node.querySelector('.pattern-info') as HTMLElement;
    if (!indicator || !tooltipInfo) return;

    const { pattern, isInherited } = getEffectivePatternForNode(node);
    
    indicator.classList.toggle('inherited', isInherited);

    if (pattern) {
        const isStrum = 'beats' in pattern;
        indicator.innerHTML = isStrum ? STRUM_ICON_SVG : ARPEGGIO_ICON_SVG;
        tooltipInfo.textContent = `${pattern.name}${isInherited ? ' (inherited)' : ''}`;
    } else {
        // It's a block chord. Check if it's explicitly set.
        if (node.dataset.playbackStyle === 'block') {
            indicator.innerHTML = BLOCK_ICON_SVG;
            // An explicit block style is not "inherited" in the same way, so remove the class.
            indicator.classList.remove('inherited');
            tooltipInfo.textContent = 'Block Chord';
        } else {
            // Default block chord (no pattern set locally or on any parent)
            indicator.innerHTML = '';
            tooltipInfo.textContent = '';
        }
    }
}

/** Updates the visuals for a node and all of its descendants. */
function updateTreeVisualsFromNode(startNode: HTMLElement) {
    updateChordNodeVisuals(startNode);

    const descendants = startNode.parentElement?.querySelectorAll('.chord-node');
    if (descendants) {
        descendants.forEach(descendant => {
            if (descendant !== startNode) {
                updateChordNodeVisuals(descendant as HTMLElement);
            }
        });
    }
}


/**
 * Updates the SVG connections between nodes. (Currently a placeholder).
 */
export function updateTreeConnections() {
    connectionsSVG.innerHTML = '';
    // Future logic to draw lines between parent and child nodes would go here.
}

/**
 * Smoothly scrolls the tree container to center the given node in the viewport.
 */
export function focusNodeInView(node: HTMLElement, instant = false) {
    if (!treeContainer || !node) return;
    
    const containerRect = treeContainer.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    
    // Horizontal centering: Calculate the visual distance (delta) from the container's
    // center to the node's center. All measurements are in screen pixels.
    const deltaX = (nodeRect.left - containerRect.left) + (nodeRect.width / 2) - (containerRect.width / 2);
    
    // The scrollLeft property and our visual delta are in the same coordinate space 
    // when a transformed element is scrolled, so we can simply add them.
    const desiredScrollLeft = treeContainer.scrollLeft + deltaX;
    
    // Vertical centering: Do the same for the vertical axis.
    const deltaY = (nodeRect.top - containerRect.top) + (nodeRect.height / 2) - (containerRect.height / 2);
    const desiredScrollTop = treeContainer.scrollTop + deltaY;
                             
    treeContainer.scrollTo({
        left: Math.max(0, desiredScrollLeft),
        top: Math.max(0, desiredScrollTop),
        behavior: instant ? 'auto' : 'smooth'
    });
}

/**
 * Creates a DOM element for a single chord node in the tree.
 */
function createChordNode(chordName: string, level: number, isInteractive: boolean, key: string, voicingIndex: number = 0): HTMLElement {
    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = 'node-wrapper flex flex-col items-center py-1 relative';

    const button = document.createElement('div');
    button.className = 'chord-node bg-gray-700 p-2 rounded-lg inline-block text-center relative';

    const functionGroup = getChordFunctionGroup(chordName, key);
    if (functionGroup) {
        button.classList.add(`function-${functionGroup}`);
    }

    button.dataset.chord = chordName;
    button.dataset.level = String(level);
    button.dataset.voicingIndex = String(voicingIndex);
    button.id = `node-${chordName}-${level}-${Math.random().toString(36).substr(2, 5)}`;

    const nameEl = document.createElement('div');
    nameEl.className = 'font-bold text-sm mb-1 pointer-events-none';
    nameEl.textContent = chordName;
    
    const diagramContainer = document.createElement('div');
    diagramContainer.className = 'diagram-container w-[100px] h-[80px]'; // Explicit size for the diagram container
    diagramContainer.style.cursor = 'zoom-in';
    diagramContainer.title = 'Ctrl + Click to view on fretboard';

    const instrument = getSavedInstrument();
    if (!instrument) {
        logger.error("Cannot create chord node: no instrument selected.");
        // Return an empty wrapper to avoid crashing the render loop.
        return nodeWrapper;
    }
    const chordDB = instrument === 'guitar' ? GUITAR_CHORDS : UKULELE_CHORDS;
    const allVoicings = chordDB[chordName];
    if (allVoicings && allVoicings.length > 0) {
        // Use the specified voicing, falling back to the first if the index is invalid
        const voicingData = allVoicings[voicingIndex] || allVoicings[0];
        diagramContainer.innerHTML = generateMiniDiagram(voicingData, instrument);

        // Add change voicing button only if there are multiple voicings
        if (allVoicings.length > 1) {
            const changeVoicingBtn = document.createElement('button');
            changeVoicingBtn.className = 'change-voicing-btn bg-gray-800/80 hover:bg-gray-700 text-white p-1 rounded-full transition-colors';
            changeVoicingBtn.title = 'Change Voicing (Right-click for library)';
            changeVoicingBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
            
            // QUICK VOICING CYCLE on left click
            changeVoicingBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const currentInstrument = getSavedInstrument();
                if (!currentInstrument) return;
                
                const currentVoicingIndex = parseInt(button.dataset.voicingIndex || '0', 10);
                const nextVoicingIndex = (currentVoicingIndex + 1) % allVoicings.length;

                button.dataset.voicingIndex = String(nextVoicingIndex);

                const voicingData = allVoicings[nextVoicingIndex];
                diagramContainer.innerHTML = generateMiniDiagram(voicingData, currentInstrument);
                
                await audio.init();
                const voicing = getVoicingForChord(chordName, currentInstrument, nextVoicingIndex);
                if (voicing.length > 0) {
                    audio.playChord(voicing.map(v => v.note), currentInstrument);
                }
            });

            // OPEN FULL MODAL on right click
            changeVoicingBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openVoicingModal(button);
            });
            button.appendChild(changeVoicingBtn);
        }
    } else {
        diagramContainer.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>`;
        diagramContainer.style.cursor = 'default';
    }
    
    // Add contextual buttons for strumming and arpeggio
    const changeStrumBtn = document.createElement('button');
    changeStrumBtn.className = 'change-strum-btn bg-gray-800/80 hover:bg-gray-700 text-white p-1 rounded-full transition-colors';
    changeStrumBtn.title = 'Change Strumming Style';
    changeStrumBtn.innerHTML = `<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>`;
    changeStrumBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openStrummingModal(button);
    });
    
    const changeArpeggioBtn = document.createElement('button');
    changeArpeggioBtn.className = 'change-arpeggio-btn bg-gray-800/80 hover:bg-gray-700 text-white p-1 rounded-full transition-colors';
    changeArpeggioBtn.title = 'Change Arpeggio Style';
    changeArpeggioBtn.innerHTML = `<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>`;
    changeArpeggioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openArpeggioModal(button);
    });

    const blockChordBtn = document.createElement('button');
    blockChordBtn.className = 'block-chord-btn bg-gray-800/80 hover:bg-gray-700 text-white p-1 rounded-full transition-colors';
    blockChordBtn.title = 'Set to Block Chord';
    blockChordBtn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4z"></path></svg>`;
    blockChordBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        button.removeAttribute('data-strum-pattern-id');
        button.removeAttribute('data-arpeggio-pattern-id');
        button.dataset.playbackStyle = 'block'; // Explicitly set style
        button.dispatchEvent(new CustomEvent('patternchange', { bubbles: true }));
    });
    
    button.appendChild(nameEl);
    button.appendChild(diagramContainer);
    button.appendChild(changeStrumBtn);
    button.appendChild(changeArpeggioBtn);
    button.appendChild(blockChordBtn);
    
    // Add pattern indicator placeholder
    const patternIndicator = document.createElement('div');
    patternIndicator.className = 'pattern-indicator';
    button.appendChild(patternIndicator);

    nodeWrapper.appendChild(button);

    // --- Tooltip ---
    const intervalDescription = getChordIntervalsDescription(chordName);
    if (intervalDescription) {
        button.classList.add('relative'); // Make it the anchor for the tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'chord-tooltip';
        tooltip.innerHTML = `
            <div class="font-bold text-base">${chordName}</div>
            <div class="text-xs text-gray-300 mt-1">${intervalDescription}</div>
            <div class="pattern-info text-xs text-blue-400 font-semibold mt-1"></div>
        `;
        button.appendChild(tooltip);
    }

    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'children-container flex justify-center items-start gap-4 mt-2';
    nodeWrapper.appendChild(childrenContainer);

    const mainClickHandler = async (e: MouseEvent) => {
        e.stopPropagation();
        const clickedNode = e.currentTarget as HTMLElement;
        const currentInstrument = getSavedInstrument();
        if (!currentInstrument) return;

        await audio.init();
        if (!audio.isInitialized) return;
        if (!document.body.contains(clickedNode)) return;

        const voicingIndex = parseInt(clickedNode.dataset.voicingIndex || '0', 10);
        const voicing = getVoicingForChord(chordName, currentInstrument, voicingIndex);
        if (voicing.length > 0) {
            audio.playChord(voicing.map(v => v.note), currentInstrument);
        }

        if (isInteractive) {
            const isExpanded = clickedNode.dataset.expanded === 'true';
            const parentWrapper = clickedNode.parentElement!;
            const containerOfWrappers = parentWrapper.parentElement!;
            const progressionMode = progressionSelect.value;

            // --- ALIGNMENT LOGIC ---
            if (containerOfWrappers?.classList.contains('children-container')) {
                const childWrapper = clickedNode.parentElement as HTMLElement;
                const containerCenter = containerOfWrappers.offsetWidth / 2;
                const childCenter = childWrapper.offsetLeft + childWrapper.offsetWidth / 2;
                const offset = containerCenter - childCenter;

                containerOfWrappers.style.transition = 'transform 0.3s ease-in-out';
                containerOfWrappers.style.transform = `translateX(calc(-50% + ${offset}px))`;
            }

            if (containerOfWrappers?.classList.contains('children-container')) {
                const siblings = Array.from(containerOfWrappers.children);
                siblings.forEach(siblingWrapper => {
                    if (siblingWrapper !== parentWrapper) {
                        const siblingButton = siblingWrapper.querySelector('.chord-node') as HTMLElement;
                        const siblingChildren = siblingWrapper.querySelector('.children-container') as HTMLElement;
                        if(siblingButton) siblingButton.dataset.expanded = 'false';
                        if(siblingChildren) {
                            siblingChildren.innerHTML = '';
                            siblingChildren.style.transform = 'translateX(-50%)';
                        }
                    }
                });
            }

            const currentChildrenContainer = parentWrapper.querySelector('.children-container') as HTMLElement;
            if (isExpanded) {
                currentChildrenContainer.innerHTML = '';
                clickedNode.dataset.expanded = 'false';
                currentChildrenContainer.style.transform = 'translateX(-50%)';
            } else {
                 currentChildrenContainer.innerHTML = ''; 
                 clickedNode.dataset.expanded = 'true';

                if (progressionMode === 'free-build') {
                    // --- FREE BUILD MODE (MANUAL): Show placeholder to add any chord ---
                    const placeholderWrapper = document.createElement('div');
                    placeholderWrapper.className = 'node-wrapper flex flex-col items-center py-1 relative';
                    const placeholderBtn = document.createElement('button');
                    placeholderBtn.className = 'placeholder-node';
                    placeholderBtn.innerHTML = `[ + ] Add Chord`;
                    placeholderWrapper.appendChild(placeholderBtn);
                    currentChildrenContainer.appendChild(placeholderWrapper);

                    placeholderBtn.addEventListener('click', () => {
                        openLibraryForSelection((selectedChordName) => {
                             const newLevel = level + 1;
                             const newNodeWrapper = createChordNode(selectedChordName, newLevel, true, key);
                             (newNodeWrapper.querySelector('.chord-node') as HTMLElement)!.dataset.parentId = clickedNode.id;
                             placeholderWrapper.replaceWith(newNodeWrapper);
                             closeChordLibraryModal();
                             // Programmatically click the new node to continue the building chain
                             (newNodeWrapper.querySelector('.chord-node') as HTMLElement).click();
                        });
                    });
                } else {
                    // --- GUIDED MODE ('free-explore' or loaded progression): Show diatonic progressions ---
                    const allowBorrowed = borrowedChordsToggle.checked;
                    const nextChords = getCommonProgressions(chordName, key, allowBorrowed);
                    if (nextChords.length > 0) {
                        const nextLevel = level + 1;
                        nextChords.forEach(nextChord => {
                            const childNodeWrapper = createChordNode(nextChord, nextLevel, true, key);
                            const childNode = childNodeWrapper.querySelector('.chord-node') as HTMLElement;
                            childNode.dataset.parentId = clickedNode.id;
                            currentChildrenContainer.appendChild(childNodeWrapper);
                            updateChordNodeVisuals(childNode);
                        });
                    }
                }
            }
            
            // --- Highlighting & Progression Bar Logic ---
            document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
            let current: HTMLElement | null = clickedNode;
            while(current) {
                current.classList.add('highlighted');
                const parentId = current.dataset.parentId;
                current = parentId ? document.getElementById(parentId) : null;
            }
            
            const highlightedNodes = Array.from(document.querySelectorAll('.chord-node.highlighted')) as HTMLElement[];
            highlightedNodes.sort((a, b) => parseInt(a.dataset.level!) - parseInt(b.dataset.level!));
            
            const showProgressionToolbar = highlightedNodes.length > 1;

            if (showProgressionToolbar) {
                progressionPreviewChords.innerHTML = ''; // Clear previous

                const previewSectionBlock = document.createElement('div');
                // Mimic the classes from song-arranger.ts
                previewSectionBlock.className = 'song-section-block bg-green-600/50 p-1 rounded-lg inline-flex';
                
                const chordsContainer = document.createElement('div');
                // Mimic the classes from song-arranger.ts
                chordsContainer.className = 'section-chords-container flex gap-0.5 flex-nowrap';

                highlightedNodes.forEach(node => {
                    const pill = document.createElement('span');
                    // Use the same classes as the real section pills
                    pill.className = 'section-chord-pill bg-gray-800 px-1 py-px rounded-sm text-xs font-medium whitespace-nowrap';
                    pill.textContent = node.dataset.chord!;
                    chordsContainer.appendChild(pill);
                });

                previewSectionBlock.appendChild(chordsContainer);
                progressionPreviewChords.appendChild(previewSectionBlock);


                // Prepare data for drag-and-drop
                const sectionDataForDrag: Omit<SongSection, 'id' | 'label'> = {
                    chords: highlightedNodes.map(n => n.dataset.chord!),
                    voicingIndices: highlightedNodes.map(n => parseInt(n.dataset.voicingIndex || '0', 10)),
                    strumPatternIds: highlightedNodes.map(n => getEffectivePatternForNode(n).pattern && 'beats' in getEffectivePatternForNode(n).pattern! ? getEffectivePatternForNode(n).pattern!.id : undefined),
                    arpeggioPatternIds: highlightedNodes.map(n => getEffectivePatternForNode(n).pattern && 'noteOrder' in getEffectivePatternForNode(n).pattern! ? getEffectivePatternForNode(n).pattern!.id : undefined),
                };
                progressionPreviewChords.dataset.dragPayload = JSON.stringify(sectionDataForDrag);
                progressionPreviewChords.draggable = true;

                toggleSongArrangerPanel(true); // Open panel to show the progression
                
                progressionToolbarContainer.classList.remove('hidden');
            } else {
                progressionPreviewChords.innerHTML = ''; // Clear it
                progressionPreviewChords.draggable = false;
                progressionToolbarContainer.classList.add('hidden');
            }

            clearProgressionBtn.classList.toggle('hidden', highlightedNodes.length < 1);
            treeRootEl.classList.toggle('path-highlighted', showProgressionToolbar);

            setTimeout(() => {
                updateTreeConnections();
                // If the node was just expanded and children were added, focus on the new children container.
                // Otherwise, just re-center the clicked node.
                if (!isExpanded && currentChildrenContainer.hasChildNodes()) {
                    focusNodeInView(currentChildrenContainer, false);
                } else {
                    focusNodeInView(clickedNode, true);
                }
            }, 100);
        }
    };

    const diagramClickHandler = (e: MouseEvent) => {
        if (e.ctrlKey && allVoicings && allVoicings.length > 0) {
            e.stopPropagation(); 
            openFretboardVisualizer(chordName);
        }
    };

    button.addEventListener('click', mainClickHandler);
    diagramContainer.addEventListener('click', diagramClickHandler);
     // Add context menu listener for substitutions
    button.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const currentKeyTonic = chordSelect.value;
        const isMinor = keyQualityToggle.checked;
        const currentKey = isMinor ? `${currentKeyTonic}m` : currentKeyTonic;
        openSubstitutionModal(button, currentKey);
    });
    
    return nodeWrapper;
}

/**
 * Replaces a chord node with a new chord.
 * Updates data, visuals, and clears children to encourage re-exploration.
 * @param nodeToReplace The chord node element to modify.
 * @param newChordName The name of the new chord.
 */
export function replaceChordNode(nodeToReplace: HTMLElement, newChordName: string) {
    if (!nodeToReplace) return;

    const instrument = getSavedInstrument();
    if (!instrument) return;

    // 1. Update data attributes
    nodeToReplace.dataset.chord = newChordName;
    nodeToReplace.dataset.voicingIndex = '0';

    // 2. Update name
    const nameEl = nodeToReplace.querySelector('.font-bold') as HTMLElement;
    if (nameEl) nameEl.textContent = newChordName;

    // 3. Update diagram
    const diagramContainer = nodeToReplace.querySelector('.diagram-container') as HTMLElement;
    const chordDB = instrument === 'guitar' ? GUITAR_CHORDS : UKULELE_CHORDS;
    const voicings = chordDB[newChordName];
    if (diagramContainer && voicings && voicings.length > 0) {
        diagramContainer.innerHTML = generateMiniDiagram(voicings[0], instrument);
    } else if (diagramContainer) {
        diagramContainer.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>`;
    }

    // 4. Update function color
    nodeToReplace.className = nodeToReplace.className.replace(/function-\w+/g, '');
    const keyTonic = chordSelect.value;
    const isMinor = keyQualityToggle.checked;
    const key = isMinor ? `${keyTonic}m` : keyTonic;

    const functionGroup = getChordFunctionGroup(newChordName, key);
    if (functionGroup) {
        nodeToReplace.classList.add(`function-${functionGroup}`);
    }

    // 5. Update tooltip
    const tooltip = nodeToReplace.querySelector('.chord-tooltip') as HTMLElement;
    const intervalDescription = getChordIntervalsDescription(newChordName);
    if (tooltip && intervalDescription) {
        tooltip.innerHTML = `
            <div class="font-bold text-base">${newChordName}</div>
            <div class="text-xs text-gray-300 mt-1">${intervalDescription}</div>
            <div class="pattern-info text-xs text-blue-400 font-semibold mt-1"></div>
        `;
        // Re-run the visual update for the pattern info part of the tooltip
        updateChordNodeVisuals(nodeToReplace);
    }

    // 6. Clear children and collapse node
    const childrenContainer = nodeToReplace.parentElement?.querySelector('.children-container') as HTMLElement;
    if (childrenContainer) {
        childrenContainer.innerHTML = '';
        childrenContainer.style.transform = 'translateX(-50%)'; // Reset alignment
    }
    nodeToReplace.dataset.expanded = 'false';

    // 7. Update the highlighting path
    // The clicked node is the one being replaced, so the path up to it remains.
    // We just need to remove highlighting from any children it might have had.
    const highlightedNodes = document.querySelectorAll('.chord-node.highlighted');
    const showProgressionToolbar = highlightedNodes.length > 1;
    treeRootEl.classList.toggle('path-highlighted', showProgressionToolbar);
}

/**
 * Creates a suggestion node for the "Free Explore" start screen.
 * @param chordName The name of the chord to suggest.
 * @param romanNumeral The Roman numeral function of the chord.
 * @returns An HTMLElement representing the suggestion button.
 */
function createSuggestionNode(chordName: string, romanNumeral: string): HTMLElement {
    const button = document.createElement('button');
    button.className = 'placeholder-node';
    button.title = `Start progression with ${chordName} (${romanNumeral})`;

    const nameEl = document.createElement('span');
    nameEl.className = 'text-xl pointer-events-none';
    nameEl.textContent = chordName;

    const romanEl = document.createElement('span');
    romanEl.className = 'text-sm text-gray-500 mt-1 pointer-events-none';
    romanEl.textContent = `(${romanNumeral})`;

    button.appendChild(nameEl);
    button.appendChild(romanEl);

    return button;
}

/**
 * Renders the initial state of the interactive tree with guided starting chord suggestions.
 */
export function renderInteractiveTree(key: string) {
    treeRootEl.innerHTML = '';
    treeRootEl.classList.remove('path-highlighted');

    // Hide buttons that require a progression path
    clearProgressionBtn.classList.add('hidden');

    // Manage UI state for explorer mode
    backToExploreBtn.classList.add('hidden');

    const isMinor = key.endsWith('m');
    const suggestionNumerals = isMinor ? ['i', 'III', 'iv'] : ['I', 'vi', 'IV']; // Common starting points

    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'flex gap-6 items-center justify-center py-4';

    suggestionNumerals.forEach(roman => {
        const chordName = realizeRomanNumeral(roman, key);
        if (chordName) {
            const suggestionNode = createSuggestionNode(chordName, roman);
            suggestionNode.addEventListener('click', () => {
                treeRootEl.innerHTML = ''; // Clear suggestions
                
                // When a suggestion is clicked, it becomes the new root node.
                const rootWrapper = createChordNode(chordName, 0, true, key);
                treeRootEl.appendChild(rootWrapper);

                // Programmatically click it to expand its children, creating a seamless flow.
                const rootNode = rootWrapper.querySelector('.chord-node') as HTMLElement;
                if (rootNode) {
                    rootNode.click();
                }
            });
            suggestionsContainer.appendChild(suggestionNode);
        }
    });

    const openLibrary = () => {
        const keyTonic = parseChordName(key)?.root || key;
        openLibraryForSelection((selectedChordName) => {
            treeRootEl.innerHTML = '';
            const newRootWrapper = createChordNode(selectedChordName, 0, true, selectedChordName);
            treeRootEl.appendChild(newRootWrapper);
            
            // Update key if necessary
            const parsed = parseChordName(selectedChordName);
            if (parsed) {
                const keyOption = Array.from(chordSelect.options).find(opt => opt.value === parsed.root);
                if (keyOption) chordSelect.value = parsed.root;
                keyQualityToggle.checked = parsed.quality.includes('m');
            }
            
            closeChordLibraryModal();
            const newRootNode = newRootWrapper.querySelector('.chord-node') as HTMLElement;
            if (newRootNode) newRootNode.click();
        }, keyTonic);
    };

    // Fallback to the original button if no suggestions can be generated
    if (suggestionsContainer.children.length > 0) {
        treeRootEl.appendChild(suggestionsContainer);
        // Also add an option to choose a different chord
        const customChoiceContainer = document.createElement('div');
        customChoiceContainer.className = 'text-center mt-6';
        const customChoiceButton = document.createElement('button');
        customChoiceButton.className = 'text-gray-400 hover:text-blue-400 text-sm font-semibold transition-colors';
        customChoiceButton.innerHTML = `... or choose a different starting chord`;
        customChoiceButton.addEventListener('click', openLibrary);
        
        customChoiceContainer.appendChild(customChoiceButton);
        treeRootEl.appendChild(customChoiceContainer);

    } else {
        // Original placeholder logic as a fallback.
        const placeholderWrapper = document.createElement('div');
        placeholderWrapper.className = 'node-wrapper flex flex-col items-center py-1 relative';
        const placeholderBtn = document.createElement('button');
        placeholderBtn.className = 'placeholder-node';
        placeholderBtn.innerHTML = `[ + ] Add Starting Chord`;
        placeholderWrapper.appendChild(placeholderBtn);
        treeRootEl.appendChild(placeholderWrapper);
        
        placeholderBtn.addEventListener('click', openLibrary);
        setTimeout(() => focusNodeInView(placeholderBtn, true), 100);
    }
}


/**
 * Renders a saved progression as a linear, interactive tree.
 */
export function renderProgressionAsInteractive(chords: string[], key: string, voicings?: number[], patterns?: {strum: (string|undefined)[], arpeggio: (string|undefined)[]}) {
    if (!chords || chords.length === 0) {
        renderInteractiveTree(key); // Fallback
        return;
    }

    treeRootEl.innerHTML = '';
    
    const rootWrapper = createChordNode(chords[0], 0, true, key, voicings ? voicings[0] : 0);
    const rootNode = rootWrapper.querySelector('.chord-node') as HTMLElement;
    if (patterns && patterns.strum[0]) rootNode.dataset.strumPatternId = patterns.strum[0];
    if (patterns && patterns.arpeggio[0]) rootNode.dataset.arpeggioPatternId = patterns.arpeggio[0];

    let parentWrapper = rootWrapper;
    let parentNode = rootWrapper.querySelector('.chord-node') as HTMLElement;
    parentNode.dataset.parentId = ''; 
    treeRootEl.appendChild(rootWrapper);

    for (let i = 1; i < chords.length; i++) {
        const chordName = chords[i];
        const childrenContainer = parentWrapper.querySelector('.children-container') as HTMLElement;
        const nodeWrapper = createChordNode(chordName, i, true, key, voicings ? voicings[i] : 0);
        const node = nodeWrapper.querySelector('.chord-node') as HTMLElement;
        if (patterns) {
            if (patterns.strum[i]) node.dataset.strumPatternId = patterns.strum[i];
            if (patterns.arpeggio[i]) node.dataset.arpeggioPatternId = patterns.arpeggio[i];
        }
        node.dataset.parentId = parentNode.id;
        childrenContainer.appendChild(nodeWrapper);
        
        parentNode.dataset.expanded = 'true';

        parentWrapper = nodeWrapper;
        parentNode = node;
    }

    const nodesToHighlight = Array.from(treeRootEl.querySelectorAll('.chord-node')) as HTMLElement[];
    nodesToHighlight.forEach(node => {
        node.classList.add('highlighted');
        updateChordNodeVisuals(node); // Update visuals to show any inherited patterns
    });
    
    const showProgressionToolbar = nodesToHighlight.length > 1;
    if (showProgressionToolbar) {
        progressionToolbarContainer.classList.remove('hidden');
    }
    clearProgressionBtn.classList.toggle('hidden', nodesToHighlight.length < 1);
    treeRootEl.classList.toggle('path-highlighted', showProgressionToolbar);

    setTimeout(() => {
        updateTreeConnections();
        focusNodeInView(parentNode, true); 
    }, 100);
}

/**
 * Renders a full saved song into the main tree view.
 * @param song The saved song object.
 */
export function renderSongInTree(song: SavedSong) {
    treeRootEl.innerHTML = '';
    connectionsSVG.innerHTML = '';
    treeRootEl.classList.add('path-highlighted');

    // Manage UI visibility for "Song Mode"
    backToExploreBtn.classList.remove('hidden');

    progressionToolbarContainer.classList.add('hidden');
    clearProgressionBtn.classList.add('hidden');

    const key = chordSelect.value; // Not crucial, as we render specific chords

    song.structure.forEach(section => {
        const sectionWrapper = document.createElement('div');
        sectionWrapper.className = 'w-full mb-8';

        const header = document.createElement('h2');
        header.className = 'text-2xl font-bold text-indigo-400 border-b-2 border-indigo-400/50 pb-2 mb-4';
        header.textContent = section.label;
        sectionWrapper.appendChild(header);

        const chordsContainer = document.createElement('div');
        chordsContainer.className = 'flex flex-row flex-wrap items-start gap-4';
        sectionWrapper.appendChild(chordsContainer);

        section.chords.forEach((chordName, i) => {
            const voicingIndex = section.voicingIndices[i];
            const nodeWrapper = createChordNode(chordName, i, false, key, voicingIndex);
            const node = nodeWrapper.querySelector('.chord-node') as HTMLElement;
            
            // Add identifiers for song playback tracking
            node.dataset.songSectionId = section.id;
            node.dataset.songChordIndex = String(i);

            if (section.strumPatternIds[i]) {
                node.dataset.strumPatternId = section.strumPatternIds[i];
            }
            if (section.arpeggioPatternIds[i]) {
                node.dataset.arpeggioPatternId = section.arpeggioPatternIds[i];
            }
            
            node.classList.add('highlighted');
            chordsContainer.appendChild(nodeWrapper);
            updateChordNodeVisuals(node);
        });

        treeRootEl.appendChild(sectionWrapper);
    });

    setTimeout(() => {
        updateTreeConnections();
        const firstNode = treeRootEl.querySelector('.chord-node');
        if (firstNode) {
            focusNodeInView(firstNode as HTMLElement, true);
        }
    }, 100);
}


/**
 * Generates the chord sequence for a given predefined progression ID and key.
 * @param progressionId The ID from PROGRESSION_FORMULAS.
 * @param key The musical key (e.g., 'C', 'Am').
 * @returns An array of chord name strings.
 */
export function getChordSequenceForProgression(progressionId: string, key: string): string[] {
    const formula = PROGRESSION_FORMULAS[progressionId];
    if (!formula) {
        console.warn(`No formula found for progression ID: ${progressionId}`);
        return [];
    }
    
    let chordSequence: (string | null | undefined)[];

    if (progressionId === 'jazz-turnaround') {
        const isMinor = key.endsWith('m');
        if (isMinor) {
            const minorSevenths = MINOR_KEYS_DIATONIC_SEVENTHS[key];
            const minorJazzFormula = ['iim7b5', 'V7', 'im7'];
            chordSequence = minorSevenths ? minorJazzFormula.map(func => minorSevenths[func as keyof typeof minorSevenths]) : [];
        } else {
            const majorKey = getKeyForTonic(key);
            if (!majorKey) {
                 console.error(`Could not determine the major key for tonic: ${key}`);
                 return [];
            }
            const majorSevenths = MAJOR_KEYS_DIATONIC_SEVENTHS[majorKey];
            chordSequence = majorSevenths ? formula.map(func => majorSevenths[func as keyof typeof majorSevenths]) : [];
        }
    } else { // Handle major and minor progressions
        chordSequence = formula.map(func => realizeRomanNumeral(func, key));
    }

    // Filter out any null/undefined chords that couldn't be realized
    const validChordSequence = chordSequence.filter((c): c is string => !!c);

    if (validChordSequence.length !== formula.length) {
        console.warn(`Could not realize all chords for progression '${progressionId}' in key ${key}.`, {
            formula,
            realized: chordSequence
        });
    }

    return validChordSequence;
}