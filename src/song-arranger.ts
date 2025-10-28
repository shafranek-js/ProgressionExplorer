/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { songArrangerPanel, songTimeline, arrangerPlaceholder, playSongBtn, clearSongBtn, saveSongBtn, songBpmSlider, treeRootEl, songArrangerToggle, appContent } from './dom';
import { audio } from './audio';
import { getVoicingForChord } from './harmonics';
import { getPatternById, getActiveBpm } from './strumming';
import { getEffectivePatternForNode, focusNodeInView } from './tree';
import { SongSection } from './types';
import { getArrangerState, saveArrangerState, getSavedInstrument } from './storage';
import { saveCurrentUILayout } from './workspace';


// --- State ---
let songStructure: SongSection[] = [];
let dragSrcEl: HTMLElement | null = null;
let selectedSectionId: string | null = null;
let isSongPlaying = false;
let stopSongRequested = false;
let listenersAttached = false;

const PLAY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>`;
const STOP_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" /></svg>`;

// --- Functions ---

/** Provides read-only access to the current song structure. */
export function getSongStructure(): SongSection[] {
    return songStructure;
}

/** Sets the song structure from an external source (e.g., loading a saved song). */
export function setSongStructure(newStructure: SongSection[]) {
    songStructure = newStructure;
    const instrument = getSavedInstrument();
    if (!instrument) return;
    saveArrangerState(songStructure, instrument);
    renderSongArranger();
}

/** Toggles the visibility of the song arranger panel. */
export function toggleSongArrangerPanel(forceOpen?: boolean) {
    if (!songArrangerPanel || !appContent) return;

    const isOpen = songArrangerPanel.classList.contains('open');
    let shouldBeOpen: boolean;

    if (typeof forceOpen === 'boolean') {
        shouldBeOpen = forceOpen;
    } else {
        shouldBeOpen = !isOpen;
    }
    
    songArrangerPanel.classList.toggle('open', shouldBeOpen);
    appContent.classList.toggle('song-arranger-open', shouldBeOpen);
    saveCurrentUILayout();
}


/** Opens the song arranger modal. */
export function openSongArrangerModal() {
    toggleSongArrangerPanel(true);
}

/** Closes the song arranger modal. */
export function closeSongArrangerModal() {
    toggleSongArrangerPanel(false);
}


/** Renders the entire song structure in the timeline. */
function renderSongArranger() {
    songTimeline.innerHTML = '';
    
    const hasContent = songStructure.length > 0;
    arrangerPlaceholder.classList.toggle('hidden', hasContent);
    playSongBtn.disabled = !hasContent;
    saveSongBtn.disabled = !hasContent;
    clearSongBtn.disabled = !hasContent;
    songBpmSlider.disabled = !hasContent;

    songStructure.forEach(section => {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'song-section-block bg-gray-700/50 p-1 rounded-lg inline-flex';
        if (section.id === selectedSectionId) {
            sectionEl.classList.add('selected');
        }
        sectionEl.draggable = true;
        sectionEl.dataset.sectionId = section.id;
        
        const chordsContainer = document.createElement('div');
        chordsContainer.className = 'section-chords-container flex gap-0.5 flex-nowrap';
        section.chords.forEach(chord => {
            const pill = document.createElement('span');
            pill.className = 'section-chord-pill bg-gray-800 px-1 py-px rounded-sm text-xs font-medium whitespace-nowrap';
            pill.textContent = chord;
            chordsContainer.appendChild(pill);
        });

        sectionEl.appendChild(chordsContainer);
        songTimeline.appendChild(sectionEl);
        
        // --- Selection Listener ---
        sectionEl.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent timeline's deselect listener from firing
            selectedSectionId = section.id;
            renderSongArranger();
        });

        // --- Drag & Drop Listeners ---
        sectionEl.addEventListener('dragstart', handleDragStart);
        sectionEl.addEventListener('dragover', handleDragOver);
        sectionEl.addEventListener('drop', handleDrop);
        sectionEl.addEventListener('dragend', handleDragEnd);
    });
}

// --- Drag & Drop Handlers ---
function handleDragStart(this: HTMLElement, e: DragEvent) {
    dragSrcEl = this;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/html', this.innerHTML); // For Firefox compatibility
    setTimeout(() => this.classList.add('dragging'), 0); // Use timeout to avoid flicker
}

function handleDragOver(e: DragEvent) {
    e.preventDefault();
    const target = (e.target as HTMLElement).closest('.song-section-block');
    if (target && target !== dragSrcEl) {
        const rect = target.getBoundingClientRect();
        const next = (e.clientX - rect.left) / rect.width > 0.5;
        
        // Remove existing placeholder
        document.querySelector('.drag-over-placeholder')?.remove();
        
        // Create a new placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'drag-over-placeholder';
        if (dragSrcEl) {
            placeholder.style.width = `${dragSrcEl.offsetWidth}px`;
        }
        
        if (next) {
            target.parentNode!.insertBefore(placeholder, target.nextSibling);
        } else {
            target.parentNode!.insertBefore(placeholder, target);
        }
    }
    return false;
}

function handleDrop(this: HTMLElement, e: DragEvent) {
    e.stopPropagation();
    if (dragSrcEl && dragSrcEl !== this) {
        const placeholder = document.querySelector('.drag-over-placeholder');
        if (!placeholder) return false;
        
        const srcId = dragSrcEl.dataset.sectionId!;
        const srcIndex = songStructure.findIndex(s => s.id === srcId);
        const [removed] = songStructure.splice(srcIndex, 1);
        
        // Find index of the placeholder in the DOM to determine new array index
        const children = Array.from(placeholder.parentNode!.children);
        let targetIndex = children.indexOf(placeholder);
        
        // Adjust index if source was before target
        if (srcIndex < targetIndex) {
            targetIndex--;
        }

        songStructure.splice(targetIndex, 0, removed);
        const instrument = getSavedInstrument();
        if (!instrument) return;
        saveArrangerState(songStructure, instrument);
        renderSongArranger(); // Re-render to reflect the new order
    }
    return false;
}

function handleDragEnd(this: HTMLElement) {
    this.classList.remove('dragging');
    document.querySelector('.drag-over-placeholder')?.remove();
}

/**
 * Adds the currently highlighted progression to the song arranger.
 */
export function handleAddToSong() {
    const highlightedNodes = Array.from(document.querySelectorAll('.chord-node.highlighted')) as HTMLElement[];
    if (highlightedNodes.length < 1) {
        alert("Please select a progression to add.");
        return;
    }
    highlightedNodes.sort((a, b) => parseInt(a.dataset.level!) - parseInt(b.dataset.level!));
    
    const chords = highlightedNodes.map(node => node.dataset.chord!);
    const voicingIndices = highlightedNodes.map(node => parseInt(node.dataset.voicingIndex || '0', 10));
    
    const strumPatternIds: (string | undefined)[] = [];
    const arpeggioPatternIds: (string | undefined)[] = [];

    // For each node, find its effective pattern (own or inherited) and save that.
    highlightedNodes.forEach(node => {
        const { pattern } = getEffectivePatternForNode(node);
        if (pattern) {
            if ('beats' in pattern) { // StrummingPattern
                strumPatternIds.push(pattern.id);
                arpeggioPatternIds.push(undefined);
            } else { // ArpeggioPattern
                strumPatternIds.push(undefined);
                arpeggioPatternIds.push(pattern.id);
            }
        } else {
            strumPatternIds.push(undefined);
            arpeggioPatternIds.push(undefined);
        }
    });

    songStructure.push({
        id: `section_${Date.now()}`,
        label: `Section ${songStructure.length + 1}`,
        chords,
        voicingIndices,
        strumPatternIds,
        arpeggioPatternIds,
    });
    
    const instrument = getSavedInstrument();
    if (!instrument) return;
    saveArrangerState(songStructure, instrument);
    renderSongArranger();
    toggleSongArrangerPanel(true); // Open panel after adding
}

/**
 * Handles a drop event from the progression bar onto the song timeline.
 */
function handleProgressionDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    const data = e.dataTransfer?.getData('application/json');
    if (!data) return;

    try {
        const newSectionData: Omit<SongSection, 'id' | 'label'> = JSON.parse(data);
        songStructure.push({
            ...newSectionData,
            id: `section_${Date.now()}`,
            label: `Section ${songStructure.length + 1}`
        });
        
        const instrument = getSavedInstrument();
        if (!instrument) return;
        saveArrangerState(songStructure, instrument);
        renderSongArranger();
        toggleSongArrangerPanel(true);
    } catch (err) {
        console.error("Failed to parse dropped progression data:", err);
    }
}


/**
 * Clears all sections from the song arranger.
 */
function handleClearSong() {
    // The confirm() dialog is blocked in the sandboxed environment, so it was removed.
    // The button is disabled when there's nothing to clear, so we just clear the array.
    if (songStructure.length > 0) {
        songStructure.length = 0;
        const instrument = getSavedInstrument();
        if (!instrument) return;
        saveArrangerState(songStructure, instrument);
        renderSongArranger();
    }
}

/**
 * Signals the active song playback loop to stop gracefully.
 */
export function stopFullSong() {
    if (isSongPlaying) {
        stopSongRequested = true;
    }
}

/**
 * Plays the full song arrangement from the arranger panel.
 */
async function playFullSong() {
    if (isSongPlaying) {
        stopFullSong();
        return;
    }
    if (songStructure.length === 0) return;
    
    const instrument = getSavedInstrument();
    if (!instrument) return;

    isSongPlaying = true;
    stopSongRequested = false;

    // --- UI Setup for Playback ---
    playSongBtn.innerHTML = STOP_ICON_SVG;
    playSongBtn.classList.replace('bg-blue-600', 'bg-red-600');
    playSongBtn.classList.replace('hover:bg-blue-700', 'hover:bg-red-700');
    
    try {
        await audio.init();
        const activeBpm = getActiveBpm() || 120;

        for (const section of songStructure) {
            if (stopSongRequested) break;
            const sectionEl = songTimeline.querySelector(`[data-section-id="${section.id}"]`);
            if (sectionEl) sectionEl.classList.add('playing');

            for (let i = 0; i < section.chords.length; i++) {
                if (stopSongRequested) break;
                const chordName = section.chords[i];
                const voicingIndex = section.voicingIndices[i];
                
                const nodeInTree = treeRootEl.querySelector(`.chord-node[data-song-section-id="${section.id}"][data-song-chord-index="${i}"]`) as HTMLElement | null;
                if (nodeInTree) {
                    focusNodeInView(nodeInTree, true);
                    nodeInTree.classList.add('playing');
                }

                const strumId = section.strumPatternIds[i];
                const arpeggioId = section.arpeggioPatternIds[i];
                const strumPattern = strumId ? getPatternById(strumId) : null;
                const arpeggioPattern = arpeggioId ? getPatternById(arpeggioId) : null;
                const activeStrum = strumPattern && 'beats' in strumPattern ? strumPattern : null;
                const activeArpeggio = arpeggioPattern && 'noteOrder' in arpeggioPattern ? arpeggioPattern : null;

                const voicing = getVoicingForChord(chordName, instrument, voicingIndex);
                if (voicing.length > 0) {
                    const notes = voicing.map(v => v.note);
                    if (activeArpeggio) {
                        const beatsPerMeasure = activeArpeggio.beatsPerMeasure || 4;
                        const durationPerChord = (60 / activeBpm) * beatsPerMeasure;
                        await audio.playArpeggiatedChord(voicing, instrument, durationPerChord, activeArpeggio, document.createElement('div'));
                    } else if (activeStrum) {
                        const beatsPerMeasure = activeStrum.beatsPerMeasure || 4;
                        const durationPerChord = (60 / activeBpm) * beatsPerMeasure;
                        await audio.playStrummedChord(notes, instrument, durationPerChord, activeStrum.beats);
                    } else { // Fallback for block chords with default timing (one chord per beat)
                        const durationPerChordMs = (60 / activeBpm) * 1000;
                        audio.playChord(notes, instrument);
                        // Wait for the duration of the chord
                        await new Promise(resolve => setTimeout(resolve, durationPerChordMs));
                    }
                }

                if (nodeInTree) {
                    nodeInTree.classList.remove('playing');
                }
            }

            if (sectionEl) sectionEl.classList.remove('playing');
        }

    } finally {
        isSongPlaying = false;
        playSongBtn.innerHTML = PLAY_ICON_SVG;
        playSongBtn.classList.replace('bg-red-600', 'bg-blue-600');
        playSongBtn.classList.replace('hover:bg-red-700', 'hover:bg-blue-700');
        // Clear any lingering highlights
        document.querySelectorAll('.song-section-block.playing, .chord-node.playing').forEach(el => {
            el.classList.remove('playing');
        });
    }
}

/** Deletes the currently selected song section. */
function handleDeleteSelectedSection() {
    if (!selectedSectionId) return;

    const index = songStructure.findIndex(s => s.id === selectedSectionId);
    if (index > -1) {
        songStructure.splice(index, 1);
        selectedSectionId = null; // Deselect after deletion
        
        const instrument = getSavedInstrument();
        if (!instrument) return;
        saveArrangerState(songStructure, instrument);
        renderSongArranger();
    }
}


/** Initializes the song arranger feature, sets up listeners, and performs the initial render. */
export function initializeSongArranger() {
    const instrument = getSavedInstrument();
    if (!instrument) {
        songStructure = [];
    } else {
        songStructure = getArrangerState(instrument);
    }
    renderSongArranger();

    if (listenersAttached) {
        return; // Don't re-attach listeners
    }

    songArrangerToggle.addEventListener('click', () => toggleSongArrangerPanel());
    playSongBtn.addEventListener('click', playFullSong);
    clearSongBtn.addEventListener('click', handleClearSong);

    // Deselection by clicking timeline background
    songTimeline.addEventListener('click', () => {
        if (selectedSectionId) {
            selectedSectionId = null;
            renderSongArranger();
        }
    });

    // Deletion via keyboard
    window.addEventListener('keydown', (e) => {
        const target = e.target as HTMLElement;
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        if (songArrangerPanel.classList.contains('open') && !isTyping && (e.key === 'Delete' || e.key === 'Backspace')) {
            e.preventDefault(); // Prevent backspace from navigating back
            handleDeleteSelectedSection();
        }
    });
    
    // Drag and drop from progression bar
    songTimeline.addEventListener('dragover', (e) => {
        e.preventDefault();
        if(e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    songTimeline.addEventListener('drop', handleProgressionDrop);

    listenersAttached = true;
}