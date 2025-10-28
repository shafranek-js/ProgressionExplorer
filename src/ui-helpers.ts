/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { chordSelect, progressionSelect, treeCanvas, connectionsSVG, treeContainer, timeSignatureSelect, treeRootEl } from './dom';
import { MAJOR_KEYS_DIATONIC, TIME_SIGNATURES } from './data/theory';
import { PROGRESSIONS } from './data/progressions';
import { getSavedInstrument, getSavedProgressions } from './storage';
import { logger } from './logger';
import { getCurrentZoom } from './panning';

/**
 * Populates the chord selector dropdown with available chords.
 */
export function populateChordSelector() {
    chordSelect.innerHTML = '';
    
    const keys = Object.keys(MAJOR_KEYS_DIATONIC);
    
    const chromaticOrder: { [key: string]: number } = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11
    };

    const sortedKeys = keys.sort((a, b) => chromaticOrder[a] - chromaticOrder[b]);

    sortedKeys.forEach(key => {
        const option = document.createElement('option');
        option.value = key; // The tonic chord is the same as the key name for major keys
        option.textContent = key;
        if (key === 'C') option.selected = true;
        chordSelect.appendChild(option);
    });
}

/**
 * Populates the progression selector dropdown with presets and saved progressions.
 */
export function populateProgressionSelector() {
    const currentVal = progressionSelect.value;
    progressionSelect.innerHTML = '';
    
    // Presets
    const presetsGroup = document.createElement('optgroup');
    presetsGroup.label = 'Presets';
    for (const id in PROGRESSIONS) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = PROGRESSIONS[id];
        presetsGroup.appendChild(option);
    }
    progressionSelect.appendChild(presetsGroup);

    // Saved
    const instrument = getSavedInstrument();
    if (!instrument) {
        logger.warn("Could not populate saved progressions: no instrument selected.");
        return;
    }
    const savedProgressions = getSavedProgressions(instrument);
    if (savedProgressions.length > 0) {
        const savedGroup = document.createElement('optgroup');
        savedGroup.label = 'Saved';
        savedProgressions.forEach(prog => {
            const option = document.createElement('option');
            option.value = prog.id;
            option.textContent = prog.name;
            savedGroup.appendChild(option);
        });
        progressionSelect.appendChild(savedGroup);
    }
    
    // Try to restore previous selection
    if (Array.from(progressionSelect.options).some(opt => opt.value === currentVal)) {
        progressionSelect.value = currentVal;
    }
}


/**
 * Ensures the SVG canvas is the same size as the tree content and centers the view on the content's origin.
 * This function is zoom-aware.
 */
export function syncCanvasAndCenter() {
  if (!treeCanvas || !connectionsSVG || !treeContainer || !treeRootEl) return;
  
  // Set SVG overlay to match the canvas dimensions. Using offsetWidth is more reliable than scrollWidth for layout dimensions.
  const canvasWidth = treeCanvas.offsetWidth;
  const canvasHeight = treeCanvas.offsetHeight;
  connectionsSVG.style.width = `${canvasWidth}px`;
  connectionsSVG.style.height = `${canvasHeight}px`;

  // Center the view on the tree's root origin (which is the center of the canvas).
  const zoom = getCurrentZoom();
  const containerRect = treeContainer.getBoundingClientRect();
  
  // The origin of our content is the center of the canvas.
  const contentOriginX = canvasWidth / 2;
  const contentOriginY = canvasHeight / 2;
  
  // We want to place the content origin at the center of the viewport.
  const viewportCenterX = containerRect.width / 2;
  const viewportCenterY = containerRect.height / 2;
  
  // Calculate the scroll position needed to align the scaled content origin with the viewport center.
  const desiredScrollLeft = (contentOriginX * zoom) - viewportCenterX;
  const desiredScrollTop = (contentOriginY * zoom) - viewportCenterY;

  treeContainer.scrollTo({
    left: Math.max(0, desiredScrollLeft),
    top: Math.max(0, desiredScrollTop),
    behavior: 'auto' // Use 'auto' for instant centering.
  });
}

/**
 * Populates the time signature selector with grouped options.
 */
export function populateTimeSignatureSelector() {
    timeSignatureSelect.innerHTML = '';

    const createOptGroup = (label: string, signatures: object) => {
        const group = document.createElement('optgroup');
        group.label = label;
        Object.entries(signatures).forEach(([value, { name }]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name;
            group.appendChild(option);
        });
        return group;
    };

    timeSignatureSelect.appendChild(createOptGroup('Simple', TIME_SIGNATURES.simple));
    timeSignatureSelect.appendChild(createOptGroup('Compound', TIME_SIGNATURES.compound));
}