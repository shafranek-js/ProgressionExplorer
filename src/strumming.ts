/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
    strummingModal, arpeggioModal, 
    strummingPatternsContainer, arpeggioPatternsContainer, 
    strumBpmSlider, strumBpmValue,
    arpeggioBpmSlider, arpeggioBpmValue,
    rhythmEditorModal, rhythmPatternNameInput, rhythmPatternTypeSelect, rhythmTimeSignatureSelect, rhythmEditorGridContainer, rhythmEditorPreviewBtn, rhythmEditorSaveBtn, rhythmEditorCancelBtn,
    applyStrumToAllBtn, applyStrumToChordBtn, applyArpeggioToAllBtn, applyArpeggioToChordBtn, rhythmEditorSaveAsBtn, timeSignatureSelect, patternPopover
} from './dom';
import { STRUMMING_PATTERNS, ARPEGGIO_PATTERNS } from './data/rhythms';
import { GUITAR_TUNING, UKULELE_TUNING } from './data/tunings';
import { getCustomPatterns, saveCustomPattern, StrumGridEvent, ArpeggioGrid, CustomPattern, CustomArpeggioPattern, CustomStrumPattern, deleteCustomPattern, getSavedInstrument } from './storage';
import { audio } from './audio';
import { getVoicingForChord, parseChordName } from './harmonics';
import { StrummingPattern, ArpeggioPattern, StrumBeat } from './types';
import { TIME_SIGNATURES } from './data/theory';


let currentBpm: number = 75;
let targetNodeForPattern: HTMLElement | null = null;
let editingPatternId: string | null = null;
let allSliders: HTMLInputElement[] = [];
let allValues: HTMLSpanElement[] = [];
let activePopoverType: 'strum' | 'arpeggio' | null = null;

// --- Rhythm Editor State ---
let editorStrumGrid: StrumGridEvent[] = [];
let editorArpeggioGrid: ArpeggioGrid = [];

const ICONS = {
    D: `<svg class="text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 17l-4 4m0 0l-4-4m4 4V3"></path></svg>`,
    U: `<svg class="text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7l4-4m0 0l4 4m-4-4v14"></path></svg>`,
    x: `<svg class="text-gray-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"></path></svg>`
};

/**
 * Creates a new arpeggio pattern object with a note order dynamically adjusted
 * for the selected instrument, specifically for scalable patterns.
 * @param pattern The base arpeggio pattern.
 * @param instrument The currently selected instrument.
 * @returns An arpeggio pattern with a note order appropriate for the instrument.
 */
function getEffectiveArpeggioPattern(pattern: ArpeggioPattern, instrument: 'guitar' | 'ukulele'): ArpeggioPattern {
    const numStrings = instrument === 'guitar' ? 6 : 4;
    // A pattern is "scalable" if its `noteOrder` is defined as an empty array in the base data.
    const isScalablePattern = pattern.noteOrder.length === 0;

    if (isScalablePattern) {
        const newPattern = { ...pattern }; // Clone the pattern to avoid modifying the original

        if (pattern.name.includes('Ascending')) {
            // ASCENDING PITCH = from low pitch string to high pitch string (e.g., index 5 to 0 for guitar)
            newPattern.noteOrder = Array.from({ length: numStrings }, (_, i) => (numStrings - 1) - i);
        } else if (pattern.name.includes('Descending')) {
            // DESCENDING PITCH = from high to low (e.g., index 0 to 5 for guitar)
            newPattern.noteOrder = Array.from({ length: numStrings }, (_, i) => i);
        }
        return newPattern;
    }
    return pattern; // Return original for non-scalable patterns
}

/** Generates an SVG fretboard diagram to visualize an arpeggio pattern. */
function generateArpeggioVisualizerSVG(pattern: ArpeggioPattern, instrument: 'guitar' | 'ukulele', voicing?: {note: string, stringIndex: number}[]): string {
    // Start with the pattern's default order, but allow it to be overridden for scalable patterns.
    let effectiveNoteOrder = pattern.noteOrder;
    // A pattern is scalable if its base definition has an empty noteOrder.
    const isScalablePattern = pattern.noteOrder.length === 0;

    // For scalable patterns, the note order MUST be generated dynamically based on the chord's actual voicing.
    // This ensures we only visualize notes that are actually played.
    if (isScalablePattern && voicing && voicing.length > 0) {
        const voicedStringIndexes = voicing.map(v => v.stringIndex);
        if (pattern.name.includes('Ascending')) {
            // Ascending pitch = from low-pitched string to high (e.g., index 5 down to 0 for guitar)
            effectiveNoteOrder = [...voicedStringIndexes].sort((a, b) => b - a);
        } else { // Descending
            // Descending pitch = from high-pitched string to low (e.g., index 0 up to 5 for guitar)
            effectiveNoteOrder = [...voicedStringIndexes].sort((a, b) => a - b);
        }
    }
    
    const tuning = instrument === 'guitar' ? GUITAR_TUNING : UKULELE_TUNING;
    // Create a default display voicing from the instrument's open strings if no specific chord voicing is provided.
    // This ensures that scalable patterns have something to render in the general library view.
    const displayVoicing = voicing || tuning.map((note, index) => ({ note, stringIndex: index }));
    const voicedStringIndexes = new Set(displayVoicing.map(v => v.stringIndex));
    const numStringsToRender = instrument === 'guitar' ? 6 : 4;

    const MAX_VISUAL_NOTES = 8;
    const notesToShow = effectiveNoteOrder.length > MAX_VISUAL_NOTES ? effectiveNoteOrder.slice(0, MAX_VISUAL_NOTES) : effectiveNoteOrder;

    const width = 180;
    const stringSpacing = 10;
    const startY = 15;
    const endY = startY + (numStringsToRender - 1) * stringSpacing;
    const height = endY + 15;
    const startX = 50;
    const endX = width - 20;
    const stepSpacing = notesToShow.length > 1 ? (endX - startX) / (notesToShow.length - 1) : 0;

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="arpeggio-visualizer w-full h-full">`;

    // Draw strings, labels, and nut
    for (let i = 0; i < numStringsToRender; i++) {
        const y = startY + i * stringSpacing;
        const stringNote = parseChordName(tuning[i])!.root;
        // String number and name label
        svg += `<text x="${startX - 25}" y="${y}" font-size="8" fill="#9ca3af" text-anchor="middle" dominant-baseline="central">${i + 1}: ${stringNote}</text>`;
        // String line
        svg += `<line x1="${startX - 10}" y1="${y}" x2="${endX + 10}" y2="${y}" stroke="#4b5563" stroke-width="1" />`;
    }
    // Nut line
    svg += `<line x1="${startX - 10}" y1="${startY}" x2="${startX - 10}" y2="${endY}" stroke="#9ca3af" stroke-width="2.5" />`;

    // Draw note names in blue circles
    notesToShow.forEach((stringIndex, i) => {
        // For any pattern, if a string is specified that is muted in the current chord, skip drawing it.
        if (!voicedStringIndexes.has(stringIndex)) {
            return;
        }
        if (stringIndex >= numStringsToRender) return;

        const x = startX + (notesToShow.length === 1 ? (endX - startX) / 2 : i * stepSpacing);
        const y = startY + stringIndex * stringSpacing;

        const noteInfo = displayVoicing.find(v => v.stringIndex === stringIndex);
        
        // We must have the note info to draw a dot.
        if (noteInfo) {
            const labelContent = parseChordName(noteInfo.note)!.root;
            svg += `<g class="arpeggio-dot" data-step-index="${i}">
                <circle cx="${x}" cy="${y}" r="8" fill="#3b82f6" />
                <text x="${x}" y="${y}" font-size="9" fill="white" font-weight="bold" text-anchor="middle" dominant-baseline="central" pointer-events="none">${labelContent}</text>
            </g>`;
        }
    });

    if (effectiveNoteOrder.length > MAX_VISUAL_NOTES) {
         svg += `<text x="${endX + 10}" y="${height / 2}" font-size="16" fill="#9ca3af" text-anchor="middle" dominant-baseline="central">...</text>`;
    }

    svg += `</svg>`;
    return svg;
}


/** Programmatically sets the BPM for all sliders and value displays. */
export function setBpm(newBpm: number) {
    currentBpm = newBpm;
    allSliders.forEach(s => s.value = String(newBpm));
    allValues.forEach(v => v.textContent = String(newBpm));
}


/** Sets up event listeners for multiple BPM sliders to keep them in sync. */
export function setupBpmControl(sliders: (HTMLInputElement | null)[], values: (HTMLSpanElement | null)[]) {
    allSliders = sliders.filter(s => s) as HTMLInputElement[];
    allValues = values.filter(v => v) as HTMLSpanElement[];

    allSliders.forEach((slider) => {
        slider.addEventListener('input', (e) => {
            const newBpm = (e.target as HTMLInputElement).value;
            setBpm(parseInt(newBpm, 10)); // Use the new setter
        });
    });
    setBpm(currentBpm); // Set initial values
}

/** Renders a category of patterns (presets or custom) into a container. */
function renderPatternCategory(title: string, patterns: (StrummingPattern | ArpeggioPattern)[], container: HTMLElement, type: 'strum' | 'arpeggio') {
    if (patterns.length === 0) return;

    const categoryEl = document.createElement('div');
    const titleEl = document.createElement('h3');
    titleEl.className = 'text-lg font-semibold text-gray-300 mb-2 border-b border-gray-600 pb-1';
    titleEl.textContent = title;
    categoryEl.appendChild(titleEl);

    const patternsContainer = document.createElement('div');
    patternsContainer.className = 'space-y-3';

    patterns.forEach((pattern) => {
        const patternEl = document.createElement('div');
        patternEl.className = 'playback-pattern bg-gray-900 p-3 rounded-lg flex flex-col items-center';
        patternEl.dataset.patternId = (pattern as any).id;
        patternEl.dataset.patternType = type;

        const nameEl = document.createElement('div');
        nameEl.className = 'font-semibold text-gray-200';
        nameEl.textContent = pattern.name;
        patternEl.appendChild(nameEl);

        const isCustom = title === 'Custom';

        if (isCustom && pattern.id) {
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'absolute top-1 right-1 flex items-center gap-1';

            const editBtn = document.createElement('button');
            editBtn.className = 'bg-gray-600 hover:bg-blue-600 text-white p-1 rounded-full transition-colors';
            editBtn.title = 'Edit Pattern';
            editBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg>`;
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (type === 'strum') closeStrummingModal();
                else closeArpeggioModal();
                
                openRhythmEditor(type, pattern.id);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'bg-gray-600 hover:bg-red-600 text-white p-1 rounded-full transition-colors';
            deleteBtn.title = 'Delete Pattern';
            deleteBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the pattern "${pattern.name}"?`)) {
                    const instrument = getSavedInstrument();
                    if (!instrument) return;
                    deleteCustomPattern(pattern.id!, instrument);
                    populateStrummingPatterns(); // Re-populates both modals
                    // Re-open the modal to maintain user context
                    if (type === 'strum') openStrummingModal(targetNodeForPattern ?? undefined);
                    else openArpeggioModal(targetNodeForPattern ?? undefined);
                }
            });

            controlsContainer.appendChild(editBtn);
            controlsContainer.appendChild(deleteBtn);
            patternEl.appendChild(controlsContainer);
            patternEl.classList.add('relative'); // For positioning controls
        }

        if ('beats' in pattern) { // Strumming pattern
            const visualContainer = document.createElement('div');
            visualContainer.className = 'flex items-stretch gap-1 mt-2 w-full h-10'; // Use items-stretch
            (pattern as StrummingPattern).beats.forEach(beat => {
                const blockEl = document.createElement('div');
                blockEl.className = 'flex items-center justify-center rounded';
                blockEl.style.flexGrow = `${beat.duration}`;
                blockEl.style.flexBasis = '0';
                
                const icon = beat.type === 'rest' ? 'x' : beat.type === 'down' ? 'D' : 'U';
                
                if (beat.type !== 'rest') {
                    blockEl.classList.add('bg-gray-800');
                } else {
                    blockEl.classList.add('bg-gray-700');
                }

                const iconEl = document.createElement('div');
                iconEl.className = 'strum-icon';
                iconEl.innerHTML = ICONS[icon];
                blockEl.appendChild(iconEl);
                visualContainer.appendChild(blockEl);
            });
            patternEl.appendChild(visualContainer);
        } else if ('noteOrder' in pattern) { // Arpeggio pattern
            const visualContainer = document.createElement('div');
            visualContainer.className = 'w-full px-4 mt-2'; // Remove fixed height to allow SVG to size naturally
            
            const instrument = getSavedInstrument();
            if (instrument) {
                const effectivePattern = getEffectiveArpeggioPattern(pattern as ArpeggioPattern, instrument);
                visualContainer.innerHTML = generateArpeggioVisualizerSVG(effectivePattern, instrument);
            }
            
            patternEl.appendChild(visualContainer);
        }

        patternsContainer.appendChild(patternEl);

        patternEl.addEventListener('click', async () => {
            // New behavior: single click selects the pattern AND plays a preview.
            const parentContainer = patternEl.closest('.modal-content');
            if (!parentContainer) return;

            parentContainer.querySelectorAll('.playback-pattern.active').forEach(p => p.classList.remove('active'));
            patternEl.classList.add('active');

            // --- AUDIO PREVIEW LOGIC ---
            if (!targetNodeForPattern) return; // Can't preview without a target chord
            
            await audio.init();
            const instrument = getSavedInstrument();
            if (!instrument) return;
            const chordName = targetNodeForPattern.dataset.chord!;
            const voicingIndex = parseInt(targetNodeForPattern.dataset.voicingIndex || '0', 10);
            const voicing = getVoicingForChord(chordName, instrument, voicingIndex);
            
            if (voicing.length === 0) return; // No notes to play

            const patternId = patternEl.dataset.patternId!;

            if (type === 'strum') {
                applyStrumToChordBtn.disabled = false;
                applyStrumToAllBtn.disabled = false;
                
                const pattern = getPatternById(patternId) as StrummingPattern | null;
                if (pattern && 'beats' in pattern) {
                    const activeBpm = getActiveBpm() || pattern.bpm;
                    const duration = (60 / activeBpm) * pattern.beatsPerMeasure;
                    await audio.playStrummedChord(voicing.map(v => v.note), instrument, duration, pattern.beats, patternEl);
                }

            } else { // type === 'arpeggio'
                applyArpeggioToChordBtn.disabled = false;
                applyArpeggioToAllBtn.disabled = false;

                const pattern = getPatternById(patternId) as ArpeggioPattern | null;
                if (pattern && 'noteOrder' in pattern) {
                    const activeBpm = getActiveBpm() || pattern.bpm;
                    const duration = (60 / activeBpm) * pattern.beatsPerMeasure;
                    const dummyNode = document.createElement('div'); // No visual highlight needed for preview
                    await audio.playArpeggiatedChord(voicing, instrument, duration, pattern, dummyNode, patternEl);
                }
            }
        });
    });

    categoryEl.appendChild(patternsContainer);
    container.appendChild(categoryEl);
}


/** Populates the strumming pattern modal with options. */
function populateStrummingSection(filterByTimeSignature: boolean = true) {
    if (!strummingPatternsContainer) return;
    strummingPatternsContainer.innerHTML = '';
    
    // Create and add the "Clear Pattern" / "Block Chord" button
    const clearStrumPatternEl = document.createElement('div');
    clearStrumPatternEl.className = 'playback-pattern bg-gray-900 p-3 rounded-lg flex flex-col items-center';
    clearStrumPatternEl.dataset.patternId = 'clear-strum';
    clearStrumPatternEl.innerHTML = `
        <div class="font-semibold text-gray-200">Block Chord (Default)</div>
        <p class="text-xs text-gray-400 mt-1">Play all notes together on the beat.</p>
    `;
     clearStrumPatternEl.addEventListener('click', async () => {
        const parentContainer = clearStrumPatternEl.closest('.modal-content');
        if (!parentContainer) return;

        parentContainer.querySelectorAll('.playback-pattern.active').forEach(p => p.classList.remove('active'));
        clearStrumPatternEl.classList.add('active');
        applyStrumToChordBtn.disabled = false;
        applyStrumToAllBtn.disabled = false;

        // Preview logic
        if (!targetNodeForPattern) return;
        await audio.init();
        const instrument = getSavedInstrument();
        if (!instrument) return;
        const chordName = targetNodeForPattern.dataset.chord!;
        const voicingIndex = parseInt(targetNodeForPattern.dataset.voicingIndex || '0', 10);
        const voicing = getVoicingForChord(chordName, instrument, voicingIndex);
        if (voicing.length > 0) {
            audio.playChord(voicing.map(v => v.note), instrument);
        }
    });
    strummingPatternsContainer.appendChild(clearStrumPatternEl);

    const instrument = getSavedInstrument();
    if (!instrument) return;

    if (filterByTimeSignature) {
        const selectedTimeSignature = timeSignatureSelect.value;
        const presets = Object.entries(STRUMMING_PATTERNS)
            .map(([id, pattern]) => ({ ...pattern, id }))
            .filter(p => p.timeSignature === selectedTimeSignature);

        const custom = getCustomPatterns(instrument)
            .filter(p => p.type === 'strum' && p.timeSignature === selectedTimeSignature)
            .map(p => convertGridToStrumPattern(p as CustomStrumPattern));

        renderPatternCategory('Presets', presets, strummingPatternsContainer, 'strum');
        renderPatternCategory('Custom', custom, strummingPatternsContainer, 'strum');
    } else {
        // Library mode: Show all, grouped by time signature
        const allTimeSignatures = [...Object.keys(TIME_SIGNATURES.simple), ...Object.keys(TIME_SIGNATURES.compound)];
        
        allTimeSignatures.forEach(sig => {
            const presets = Object.entries(STRUMMING_PATTERNS)
                .map(([id, pattern]) => ({ ...pattern, id }))
                .filter(p => p.timeSignature === sig);
            const custom = getCustomPatterns(instrument)
                .filter(p => p.type === 'strum' && p.timeSignature === sig)
                .map(p => convertGridToStrumPattern(p as CustomStrumPattern));
            
            if (presets.length > 0 || custom.length > 0) {
                const sigTitle = document.createElement('h2');
                const sigInfo = TIME_SIGNATURES.simple[sig as keyof typeof TIME_SIGNATURES.simple] || TIME_SIGNATURES.compound[sig as keyof typeof TIME_SIGNATURES.compound];
                sigTitle.className = 'text-xl font-bold text-indigo-400 mt-4 border-b border-indigo-400/50 pb-1 mb-2';
                sigTitle.textContent = sigInfo ? sigInfo.name : sig;
                strummingPatternsContainer.appendChild(sigTitle);

                renderPatternCategory('Presets', presets, strummingPatternsContainer, 'strum');
                renderPatternCategory('Custom', custom, strummingPatternsContainer, 'strum');
            }
        });
    }
}

/** Populates the arpeggio pattern section in the modal. */
function populateArpeggioSection(filterByTimeSignature: boolean = true) {
    if (!arpeggioPatternsContainer) return;
    arpeggioPatternsContainer.innerHTML = '';
    
    // Create and add the "Clear Pattern" / "Block Chord" button
    const clearArpeggioPatternEl = document.createElement('div');
    clearArpeggioPatternEl.className = 'playback-pattern bg-gray-900 p-3 rounded-lg flex flex-col items-center';
    clearArpeggioPatternEl.dataset.patternId = 'clear-arpeggio';
    clearArpeggioPatternEl.innerHTML = `
        <div class="font-semibold text-gray-200">Block Chord (Default)</div>
        <p class="text-xs text-gray-400 mt-1">Play all notes together on the beat.</p>
    `;
    clearArpeggioPatternEl.addEventListener('click', async () => {
        const parentContainer = clearArpeggioPatternEl.closest('.modal-content');
        if (!parentContainer) return;
        parentContainer.querySelectorAll('.playback-pattern.active').forEach(p => p.classList.remove('active'));
        clearArpeggioPatternEl.classList.add('active');
        applyArpeggioToChordBtn.disabled = false;
        applyArpeggioToAllBtn.disabled = false;

        // Preview logic
        if (!targetNodeForPattern) return;
        await audio.init();
        const instrument = getSavedInstrument();
        if (!instrument) return;
        const chordName = targetNodeForPattern.dataset.chord!;
        const voicingIndex = parseInt(targetNodeForPattern.dataset.voicingIndex || '0', 10);
        const voicing = getVoicingForChord(chordName, instrument, voicingIndex);
        if (voicing.length > 0) {
            audio.playChord(voicing.map(v => v.note), instrument);
        }
    });
    arpeggioPatternsContainer.appendChild(clearArpeggioPatternEl);

    const instrument = getSavedInstrument();
    if (!instrument) return;

    if (filterByTimeSignature) {
        const selectedTimeSignature = timeSignatureSelect.value;
        const presets = Object.entries(ARPEGGIO_PATTERNS)
            .map(([id, pattern]) => ({ ...pattern, id }))
            .filter(p => p.timeSignature === selectedTimeSignature);

        const custom = getCustomPatterns(instrument)
            .filter(p => p.type === 'arpeggio' && p.timeSignature === selectedTimeSignature)
            .map(p => convertGridToArpeggioPattern(p as CustomArpeggioPattern));
            
        const instrumentSpecificCustom = custom.filter(p => p.instrument === instrument);

        renderPatternCategory('Presets', presets, arpeggioPatternsContainer, 'arpeggio');
        renderPatternCategory('Custom', instrumentSpecificCustom, arpeggioPatternsContainer, 'arpeggio');
    } else {
        const allTimeSignatures = [...Object.keys(TIME_SIGNATURES.simple), ...Object.keys(TIME_SIGNATURES.compound)];

        allTimeSignatures.forEach(sig => {
            const presets = Object.entries(ARPEGGIO_PATTERNS)
                .map(([id, pattern]) => ({ ...pattern, id }))
                .filter(p => p.timeSignature === sig);

            const custom = getCustomPatterns(instrument)
                .filter(p => p.type === 'arpeggio' && p.timeSignature === sig)
                .map(p => convertGridToArpeggioPattern(p as CustomArpeggioPattern));

            const instrumentSpecificCustom = custom.filter(p => p.instrument === instrument);
            
            if (presets.length > 0 || instrumentSpecificCustom.length > 0) {
                const sigTitle = document.createElement('h2');
                const sigInfo = TIME_SIGNATURES.simple[sig as keyof typeof TIME_SIGNATURES.simple] || TIME_SIGNATURES.compound[sig as keyof typeof TIME_SIGNATURES.compound];
                sigTitle.className = 'text-xl font-bold text-indigo-400 mt-4 border-b border-indigo-400/50 pb-1 mb-2';
                sigTitle.textContent = sigInfo ? sigInfo.name : sig;
                arpeggioPatternsContainer.appendChild(sigTitle);

                renderPatternCategory('Presets', presets, arpeggioPatternsContainer, 'arpeggio');
                renderPatternCategory('Custom', instrumentSpecificCustom, arpeggioPatternsContainer, 'arpeggio');
            }
        });
    }
}


/** Populates the entire playback style modal. */
export function populateStrummingPatterns(filterByTimeSignature: boolean = true) {
    populateStrummingSection(filterByTimeSignature);
    populateArpeggioSection(filterByTimeSignature);
}

/** Retrieves a pattern object by its ID from presets or custom storage. */
export function getPatternById(id: string): StrummingPattern | ArpeggioPattern | null {
    if (!id) return null;
    const instrument = getSavedInstrument();
    if (!instrument) return null;
    if (id.startsWith('custom_pattern_')) {
        const custom = getCustomPatterns(instrument).find(p => p.id === id);
        if (!custom) return null;
        return custom.type === 'strum'
            ? convertGridToStrumPattern(custom as CustomStrumPattern)
            : convertGridToArpeggioPattern(custom as CustomArpeggioPattern);
    }

    if (STRUMMING_PATTERNS[id]) {
        return { ...STRUMMING_PATTERNS[id], id };
    }
    if (ARPEGGIO_PATTERNS[id]) {
        return { ...ARPEGGIO_PATTERNS[id], id };
    }

    return null;
}


/** Returns the currently active BPM, which may have been modified by the user. */
export function getActiveBpm(): number | null {
    return currentBpm;
}

/** Opens the strumming pattern modal, supporting a "library mode" if no node is passed. */
export function openStrummingModal(node?: HTMLElement) {
    if (!strummingModal) return;

    const isLibraryMode = !node;
    populateStrummingPatterns(!isLibraryMode);

    const applyButtonsContainer = applyStrumToChordBtn.parentElement as HTMLElement;

    if (isLibraryMode) {
        const dummyNode = document.createElement('div');
        dummyNode.dataset.chord = 'C'; // Use a common, simple chord for previews
        dummyNode.dataset.voicingIndex = '0';
        targetNodeForPattern = dummyNode;
        applyButtonsContainer.style.display = 'none';
    } else {
        targetNodeForPattern = node;
        applyButtonsContainer.style.display = 'flex'; // Use flex to match the container
    }
    
    applyStrumToChordBtn.disabled = true;
    applyStrumToAllBtn.disabled = true;

    // Highlight the active pattern or the default block chord option
    const allPatterns = strummingPatternsContainer.querySelectorAll('.playback-pattern');
    allPatterns.forEach(p => p.classList.remove('active'));

    if (!isLibraryMode) {
        const currentStrumId = node.dataset.strumPatternId;
        if (currentStrumId) {
            const activePatternEl = strummingPatternsContainer.querySelector(`[data-pattern-id="${currentStrumId}"]`);
            if(activePatternEl) {
                activePatternEl.classList.add('active');
                applyStrumToChordBtn.disabled = false;
                applyStrumToAllBtn.disabled = false;
            }
        } else {
            const clearPatternEl = strummingPatternsContainer.querySelector(`[data-pattern-id="clear-strum"]`);
            if (clearPatternEl) {
                clearPatternEl.classList.add('active');
                applyStrumToChordBtn.disabled = false;
                applyStrumToAllBtn.disabled = false;
            }
        }
    }

    strummingModal.classList.remove('hidden');
    setTimeout(() => {
        strummingModal.classList.add('active');
    }, 10);
}


/** Closes the strumming pattern modal. */
export function closeStrummingModal() {
    if (!strummingModal) return;
    targetNodeForPattern = null;
    strummingModal.classList.remove('active');
    setTimeout(() => {
        strummingModal.classList.add('hidden');
    }, 300);
}

/** Opens the arpeggio pattern modal, supporting a "library mode" if no node is passed. */
export function openArpeggioModal(node?: HTMLElement) {
    if (!arpeggioModal) return;
    
    const isLibraryMode = !node;
    populateStrummingPatterns(!isLibraryMode);

    const applyButtonsContainer = applyArpeggioToChordBtn.parentElement as HTMLElement;

    if (isLibraryMode) {
        const dummyNode = document.createElement('div');
        dummyNode.dataset.chord = 'C';
        dummyNode.dataset.voicingIndex = '0';
        targetNodeForPattern = dummyNode;
        applyButtonsContainer.style.display = 'none';
    } else {
        targetNodeForPattern = node;
        applyButtonsContainer.style.display = 'flex';
    }

    applyArpeggioToChordBtn.disabled = true;
    applyArpeggioToAllBtn.disabled = true;

    // Highlight the active pattern or the default block chord option
    const allPatterns = arpeggioPatternsContainer.querySelectorAll('.playback-pattern');
    allPatterns.forEach(p => p.classList.remove('active'));

    if (!isLibraryMode) {
        const currentArpeggioId = node.dataset.arpeggioPatternId;
        if (currentArpeggioId) {
            const activePatternEl = arpeggioPatternsContainer.querySelector(`[data-pattern-id="${currentArpeggioId}"]`);
             if(activePatternEl) {
                activePatternEl.classList.add('active');
                applyArpeggioToChordBtn.disabled = false;
                applyArpeggioToAllBtn.disabled = false;
            }
        } else {
            const clearPatternEl = arpeggioPatternsContainer.querySelector(`[data-pattern-id="clear-arpeggio"]`);
            if (clearPatternEl) {
                clearPatternEl.classList.add('active');
                applyArpeggioToChordBtn.disabled = false;
                applyArpeggioToAllBtn.disabled = false;
            }
        }
    }

    // Update visualizations to be chord-aware
    const chordName = targetNodeForPattern!.dataset.chord!;
    const voicingIndex = parseInt(targetNodeForPattern!.dataset.voicingIndex || '0', 10);
    const instrument = getSavedInstrument();
    if (!instrument) return;

    if (chordName) {
        const voicing = getVoicingForChord(chordName, instrument, voicingIndex);

        const patternElements = arpeggioPatternsContainer.querySelectorAll('.playback-pattern');
        patternElements.forEach(patternEl => {
            const patternId = (patternEl as HTMLElement).dataset.patternId;
            if (patternId && !patternId.startsWith('clear-')) {
                const pattern = getPatternById(patternId) as ArpeggioPattern | null;
                if (pattern && 'noteOrder' in pattern) {
                    const visualContainer = patternEl.querySelector('.w-full.px-4.mt-2');
                    if (visualContainer) {
                        const effectivePattern = getEffectiveArpeggioPattern(pattern, instrument);
                        // Pass voicing to the generator to re-render the SVG
                        visualContainer.innerHTML = generateArpeggioVisualizerSVG(effectivePattern, instrument, voicing);
                    }
                }
            }
        });
    }

    arpeggioModal.classList.remove('hidden');
    setTimeout(() => {
        arpeggioModal.classList.add('active');
    }, 10);
}


/** Closes the arpeggio pattern modal. */
export function closeArpeggioModal() {
    if (!arpeggioModal) return;
    targetNodeForPattern = null;
    arpeggioModal.classList.remove('active');
    setTimeout(() => {
        arpeggioModal.classList.add('hidden');
    }, 300);
}

// --- Pattern Popover Logic ---

/**
 * Returns the type (`strum` or `arpeggio`) for which the pattern creation popover is active.
 * This state is not currently set anywhere, implying the feature to open the popover is incomplete.
 */
export function getActivePopoverType(): 'strum' | 'arpeggio' | null {
    return activePopoverType;
}

/**
 * Closes the pattern creation popover.
 */
export function closePatternPopover() {
    if (!patternPopover) return;
    activePopoverType = null; // Reset state
    patternPopover.classList.remove('active');
    setTimeout(() => {
        patternPopover.classList.add('hidden');
    }, 300);
}


// --- RHYTHM EDITOR LOGIC ---

function renderRhythmGrid() {
    const type = rhythmPatternTypeSelect.value;
    const timeSignature = rhythmTimeSignatureSelect.value;
    let steps, beats;

    switch (timeSignature) {
        case '2/2': steps = 4; beats = 2; break;
        case '2/4': steps = 4; beats = 2; break;
        case '3/4': steps = 6; beats = 3; break;
        case '3/8': steps = 3; beats = 3; break;
        case '6/8': steps = 6; beats = 2; break;
        case '9/8': steps = 9; beats = 3; break;
        case '12/8': steps = 12; beats = 4; break;
        case '4/4': default: steps = 8; beats = 4; break;
    }
    const stepsPerBeat = steps / beats;

    if (type === 'strum') {
        if (editorStrumGrid.length !== steps) {
            editorStrumGrid = Array(steps).fill('rest');
        }
        
        let gridHtml = '<div class="rhythm-grid">';
        for (let i = 0; i < steps; i++) {
            const isBeatStart = i % stepsPerBeat === 0 && i > 0;
            const event = editorStrumGrid[i];
            let icon = '';
            if (event === 'down') icon = ICONS.D;
            if (event === 'up') icon = ICONS.U;

            gridHtml += `<div class="rhythm-grid-cell ${isBeatStart ? 'beat-marker' : ''}" data-index="${i}">
                ${icon ? `<div class="strum-icon">${icon}</div>` : ''}
            </div>`;
        }
        gridHtml += '</div>';
        rhythmEditorGridContainer.innerHTML = gridHtml;

    } else { // Arpeggio
        const instrument = getSavedInstrument();
        if (!instrument) return;
        const tuning = instrument === 'guitar' ? GUITAR_TUNING : UKULELE_TUNING;
        const numStrings = tuning.length;
        if (editorArpeggioGrid.length !== numStrings || (editorArpeggioGrid[0] && editorArpeggioGrid[0].length !== steps)) {
            editorArpeggioGrid = Array(numStrings).fill(0).map(() => Array(steps).fill(false));
        }

        let gridHtml = '<div class="rhythm-arpeggio-grid">';
        for (let s = 0; s < numStrings; s++) {
            gridHtml += `<div class="rhythm-arpeggio-row">
                <div class="rhythm-arpeggio-row-header">String ${s + 1}</div>
                <div class="rhythm-grid">`;
            for (let i = 0; i < steps; i++) {
                const isBeatStart = i % stepsPerBeat === 0 && i > 0;
                const isActive = editorArpeggioGrid[s][i];
                gridHtml += `<div class="rhythm-grid-cell ${isActive ? 'active' : ''} ${isBeatStart ? 'beat-marker' : ''}" data-string="${s}" data-index="${i}"></div>`;
            }
            gridHtml += `</div></div>`;
        }
        gridHtml += '</div>';
        rhythmEditorGridContainer.innerHTML = gridHtml;
    }
}

function handleGridClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('rhythm-grid-cell')) return;

    const type = rhythmPatternTypeSelect.value;
    const index = parseInt(target.dataset.index!);

    if (type === 'strum') {
        const states: StrumGridEvent[] = ['rest', 'down', 'up'];
        const currentState = editorStrumGrid[index];
        const nextStateIndex = (states.indexOf(currentState) + 1) % states.length;
        editorStrumGrid[index] = states[nextStateIndex];
    } else {
        const string = parseInt(target.dataset.string!);
        const isAddingNote = !editorArpeggioGrid[string][index];
        editorArpeggioGrid[string][index] = isAddingNote;

        if (isAddingNote) {
            const instrument = getSavedInstrument();
            if (!instrument) return;
            // Play audio feedback
            // Using C as a default preview chord to get the note for the open string
            const voicing = getVoicingForChord('C', instrument); 
            const noteInfo = voicing.find(v => v.stringIndex === string);
            if (noteInfo) {
                audio.playSingleNote(noteInfo.note, instrument);
            }
        }
    }
    renderRhythmGrid(); // Re-render to show changes
}


function applyPatternToNode(node: HTMLElement, patternId: string, patternType: 'strum' | 'arpeggio') {
    const strumAttr = 'strumPatternId';
    const arpeggioAttr = 'arpeggioPatternId';

    // Clear all pattern attributes first
    delete node.dataset[strumAttr];
    delete node.dataset[arpeggioAttr];
    delete node.dataset.playbackStyle;

    if (patternId.startsWith('clear-')) {
        // This is the block chord / default option
        node.dataset.playbackStyle = 'block';
    } else if (patternType === 'strum') {
        node.dataset[strumAttr] = patternId;
    } else {
        node.dataset[arpeggioAttr] = patternId;
    }

    node.dispatchEvent(new CustomEvent('patternchange', { bubbles: true }));
}

function handleApplyToSingle(type: 'strum' | 'arpeggio') {
    const container = type === 'strum' ? strummingPatternsContainer : arpeggioPatternsContainer;
    const activePattern = container.querySelector('.playback-pattern.active') as HTMLElement;
    
    if (activePattern && targetNodeForPattern) {
        const patternId = activePattern.dataset.patternId!;
        const patternType = activePattern.dataset.patternType as 'strum' | 'arpeggio';
        applyPatternToNode(targetNodeForPattern, patternId, patternType);
    }
    
    if (type === 'strum') closeStrummingModal(); else closeArpeggioModal();
}

function handleApplyToAll(type: 'strum' | 'arpeggio') {
    const container = type === 'strum' ? strummingPatternsContainer : arpeggioPatternsContainer;
    const activePattern = container.querySelector('.playback-pattern.active') as HTMLElement;
    if (!activePattern) return;

    const patternId = activePattern.dataset.patternId!;
    const patternType = activePattern.dataset.patternType as 'strum' | 'arpeggio';
    
    const highlightedNodes = document.querySelectorAll('.chord-node.highlighted') as NodeListOf<HTMLElement>;
    highlightedNodes.forEach(node => {
        applyPatternToNode(node, patternId, patternType);
    });

    if (type === 'strum') closeStrummingModal(); else closeArpeggioModal();
}


export function initializeRhythmEditor() {
    rhythmPatternTypeSelect.addEventListener('change', renderRhythmGrid);
    rhythmTimeSignatureSelect.addEventListener('change', renderRhythmGrid);
    rhythmEditorGridContainer.addEventListener('click', handleGridClick);
    rhythmEditorSaveBtn.addEventListener('click', () => handleSavePattern(false));
    rhythmEditorSaveAsBtn.addEventListener('click', () => handleSavePattern(true));
    rhythmEditorCancelBtn.addEventListener('click', closeRhythmEditor);
    rhythmEditorPreviewBtn.addEventListener('click', handlePreviewPattern);
    
    // Add listeners for the new apply buttons
    applyStrumToChordBtn.addEventListener('click', () => handleApplyToSingle('strum'));
    applyStrumToAllBtn.addEventListener('click', () => handleApplyToAll('strum'));
    applyArpeggioToChordBtn.addEventListener('click', () => handleApplyToSingle('arpeggio'));
    applyArpeggioToAllBtn.addEventListener('click', () => handleApplyToAll('arpeggio'));
}

export function openRhythmEditor(type: 'strum' | 'arpeggio', patternIdToEdit?: string) {
    audio.init(); // Ensure audio engine is ready for feedback
    editingPatternId = patternIdToEdit || null;
    
    const instrument = getSavedInstrument();
    if (!instrument) return;

    if (editingPatternId) {
        // Edit mode
        rhythmEditorSaveBtn.textContent = 'Update Pattern';
        rhythmEditorSaveAsBtn.classList.remove('hidden');

        const customPatterns = getCustomPatterns(instrument);
        const patternToEdit = customPatterns.find(p => p.id === editingPatternId);
        
        if (patternToEdit) {
            rhythmPatternNameInput.value = patternToEdit.name;
            rhythmPatternTypeSelect.value = patternToEdit.type;
            rhythmTimeSignatureSelect.value = patternToEdit.timeSignature;

            if (patternToEdit.type === 'strum') {
                editorStrumGrid = [...patternToEdit.grid];
                editorArpeggioGrid = [];
            } else {
                editorArpeggioGrid = patternToEdit.grid.map(row => [...row]); // Deep copy
                editorStrumGrid = [];
            }
        } else {
            // Pattern not found, reset to new pattern mode
            editingPatternId = null;
            rhythmPatternNameInput.value = '';
            rhythmPatternTypeSelect.value = type;
            rhythmTimeSignatureSelect.value = '4/4';
            editorStrumGrid = [];
            editorArpeggioGrid = [];
        }
    } else {
        // New pattern mode
        rhythmEditorSaveBtn.textContent = 'Save Pattern';
        rhythmEditorSaveAsBtn.classList.add('hidden');
        rhythmPatternNameInput.value = '';
        rhythmPatternTypeSelect.value = type;
        rhythmTimeSignatureSelect.value = '4/4';
        editorStrumGrid = [];
        editorArpeggioGrid = [];
    }

    renderRhythmGrid();
    rhythmEditorModal.classList.remove('hidden');
    setTimeout(() => rhythmEditorModal.classList.add('active'), 10);
}

export function closeRhythmEditor() {
    editingPatternId = null; // Reset on close
    rhythmEditorModal.classList.remove('active');
    setTimeout(() => {
        rhythmEditorModal.classList.add('hidden');
    }, 300);
}

function convertGridToStrumPattern(patternData: CustomStrumPattern): StrummingPattern {
    const { id, name, timeSignature, grid } = patternData;
    const steps = grid.length;
    const durationPerStep = 1 / steps;
    
    return {
        id,
        name,
        bpm: 120, // Default BPM for custom patterns
        beatsPerMeasure: timeSignature === '3/4' ? 3 : (timeSignature === '6/8' ? 6 : 4),
        timeSignature,
        visual: grid.map((g: StrumGridEvent) => g === 'down' ? 'D' : g === 'up' ? 'U' : 'x'),
        beats: grid.map((type: StrumGridEvent) => ({ type, duration: durationPerStep }))
    };
}

function convertGridToArpeggioPattern(patternData: CustomArpeggioPattern): ArpeggioPattern {
    const { id, name, timeSignature, grid, instrument } = patternData;
    const noteOrder: number[] = [];
    const steps = grid[0]?.length || 0;
    for (let i = 0; i < steps; i++) {
        for (let s = 0; s < grid.length; s++) {
            if (grid[s][i]) {
                noteOrder.push(s);
            }
        }
    }
    return { id, name, instrument, bpm: 120, beatsPerMeasure: timeSignature === '3/4' ? 3 : (timeSignature === '6/8' ? 6 : 4), timeSignature, noteOrder };
}

async function handlePreviewPattern() {
    const type = rhythmPatternTypeSelect.value;
    const name = rhythmPatternNameInput.value.trim() || 'Preview';
    const timeSignature = rhythmTimeSignatureSelect.value as '4/4' | '3/4' | '6/8';
    const instrument = getSavedInstrument();
    if (!instrument) return;

    const voicing = getVoicingForChord('C', instrument);
    if (voicing.length === 0) return;

    await audio.init();

    if (type === 'strum') {
        const tempPatternData: CustomStrumPattern = { id: 'preview', name, timeSignature, type, grid: editorStrumGrid };
        const pattern = convertGridToStrumPattern(tempPatternData);
        const duration = (60 / 120) * pattern.beatsPerMeasure;
        await audio.playStrummedChord(voicing.map(v => v.note), instrument, duration, pattern.beats);
    } else {
        const tempPatternData: CustomArpeggioPattern = { id: 'preview', name, timeSignature, type: 'arpeggio', instrument, grid: editorArpeggioGrid };
        const pattern = convertGridToArpeggioPattern(tempPatternData);
        const duration = (60 / 120) * pattern.beatsPerMeasure;

        // Build a map of step index to grid cell for quick lookup
        const stepToCellMap = new Map<number, HTMLElement>();
        const steps = editorArpeggioGrid[0]?.length || 0;
        let currentStep = 0;
        for (let i = 0; i < steps; i++) {
            for (let s = 0; s < editorArpeggioGrid.length; s++) {
                if (editorArpeggioGrid[s][i]) {
                    const cell = rhythmEditorGridContainer.querySelector(`.rhythm-grid-cell[data-string="${s}"][data-index="${i}"]`) as HTMLElement;
                    if (cell) {
                        stepToCellMap.set(currentStep, cell);
                    }
                    currentStep++;
                }
            }
        }

        const onNotePlay = (stringIndex: number, stepIndex: number, noteDurationMs: number) => {
            const cell = stepToCellMap.get(stepIndex);
            if (cell) {
                // Temporarily override background color to a highlight blue and zoom
                cell.style.backgroundColor = '#60a5fa'; // blue-400 for better contrast
                cell.style.transform = 'scale(1.15)';
                cell.style.transition = 'background-color 0.05s ease, transform 0.05s ease';
                setTimeout(() => {
                    cell.style.backgroundColor = ''; // Revert to CSS-defined color
                    cell.style.transform = '';
                }, noteDurationMs * 0.9);
            }
        };

        await audio.playArpeggioWithCallback(voicing, instrument, duration, pattern, onNotePlay);
    }
}

function handleSavePattern(isSaveAs: boolean) {
    const name = rhythmPatternNameInput.value.trim();
    if (!name) {
        alert('Please enter a name for the pattern.');
        return;
    }
    const type = rhythmPatternTypeSelect.value as 'strum' | 'arpeggio';
    const timeSignature = rhythmTimeSignatureSelect.value as '4/4' | '3/4' | '6/8';
    const instrument = getSavedInstrument();
    if (!instrument) return;
    
    let patternData: Omit<CustomPattern, 'id'> | CustomPattern;

    if (type === 'strum') {
        patternData = { name, type, timeSignature, grid: editorStrumGrid };
    } else {
        const arpeggioToSave: Omit<CustomArpeggioPattern, 'id'> = { name, type: 'arpeggio', timeSignature, instrument, grid: editorArpeggioGrid };
        patternData = arpeggioToSave;
    }

    // If it's an update (not "Save As") and we're in edit mode, attach the ID to overwrite.
    if (!isSaveAs && editingPatternId) {
        (patternData as CustomPattern).id = editingPatternId;
    }
    // Otherwise, the ID is omitted, and storage will create a new one.

    saveCustomPattern(patternData, instrument);

    populateStrummingPatterns(); // Refresh the lists in the other modals
    closeRhythmEditor();
}