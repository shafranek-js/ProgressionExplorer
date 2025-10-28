/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { chordSelect, progressionSelect, errorMessage, treeRootEl, connectionsSVG, loopBtn, keyQualityToggle, playBtn, stopBtn, progressionToolbarContainer } from './dom';
import { audio } from './audio';
import { renderInteractiveTree, renderProgressionAsInteractive, getEffectivePatternForNode, getChordSequenceForProgression, focusNodeInView } from './tree';
import { syncCanvasAndCenter } from './ui-helpers';
import { getVoicingForChord, transposeChordSequence } from './harmonics';
import { getActiveBpm } from './strumming';
import { getSavedProgressions, getSavedInstrument } from './storage';
import { FIXED_PROGRESSIONS } from './data/progressions';
import { logger } from './logger';

let isPlaying = false;
let stopPlaybackRequested = false;
let currentKey: string = 'C';


interface RenderOptions {
    transposeFreeExplore?: boolean;
}

/**
 * Signals the active sequence playback loop to stop gracefully.
 */
export function stopSequence() {
    if (isPlaying) {
        stopPlaybackRequested = true;
    }
}

/**
 * The main application render function.
 * It reads the state from the UI controls and updates the progression tree.
 */
export async function renderApp(options: RenderOptions = {}) {
    const keyTonic = chordSelect.value;
    const isMinor = keyQualityToggle.checked;
    const newKey = isMinor ? `${keyTonic}m` : keyTonic;

    const progressionId = progressionSelect.value;
    let sequenceToRender: string[] | undefined;

    // Handle transposition logic if a key change happened in free explore mode
    if (options.transposeFreeExplore && (progressionId === 'free-explore' || progressionId === 'free-build')) {
        const highlightedNodes = Array.from(document.querySelectorAll('.chord-node.highlighted')) as HTMLElement[];
        if (highlightedNodes.length > 0) {
            highlightedNodes.sort((a, b) => parseInt(a.dataset.level!) - parseInt(b.dataset.level!));
            const currentSequence = highlightedNodes.map(node => node.dataset.chord!);
            // Use the full key name for accurate harmonic transposition between major and minor.
            sequenceToRender = transposeChordSequence(currentSequence, currentKey, newKey);
        }
    }
    
    errorMessage.classList.add('hidden');

    treeRootEl.innerHTML = ''; 
    connectionsSVG.innerHTML = '';
    
    // Hide the main progression toolbar on full re-render
    progressionToolbarContainer.classList.add('hidden');


    if (sequenceToRender) {
        renderProgressionAsInteractive(sequenceToRender, newKey);
    }
    else if (progressionId.startsWith('custom_')) {
        const instrument = getSavedInstrument();
        if (!instrument) {
            logger.error("Cannot load custom progression: no instrument selected.");
            return;
        }
        const saved = getSavedProgressions(instrument).find(p => p.id === progressionId);
        if (saved) {
            // Update the key selector to the saved progression's tonic before rendering
            if (chordSelect.value !== saved.tonic) {
                chordSelect.value = saved.tonic;
            }
            renderProgressionAsInteractive(saved.chords, newKey);
            // Set dropdown back to 'Free Explore' to reflect the current interactive state
            progressionSelect.value = 'free-explore';
        } else {
            // Fallback if a custom ID is selected but not found in storage
            renderInteractiveTree(newKey);
        }
    } else if (progressionId === 'free-explore' || progressionId === 'free-build') {
        renderInteractiveTree(newKey);
    } else {
        // Handle predefined progressions from the dropdown
        const fixedProg = FIXED_PROGRESSIONS[progressionId];
        if (fixedProg) {
            // It's a fixed progression. Update the key selector and render it.
            chordSelect.value = fixedProg.tonic;
            keyQualityToggle.checked = fixedProg.tonic.endsWith('m'); // Handle minor keys if any are added
            renderProgressionAsInteractive(fixedProg.chords, fixedProg.tonic, fixedProg.voicings);
            // Set dropdown to 'Free Explore' to reflect the loaded, interactive state
            progressionSelect.value = 'free-explore';
        } else {
            const chordSequence = getChordSequenceForProgression(progressionId, newKey);
            if (chordSequence.length > 0) {
                renderProgressionAsInteractive(chordSequence, newKey);
                // Set dropdown to 'Free Explore' to reflect the loaded, interactive state
                progressionSelect.value = 'free-explore';
            } else {
                // Handle case where progression could not be generated
                errorMessage.textContent = `Could not generate the selected progression in the key of ${newKey}.`;
                errorMessage.classList.remove('hidden');
                renderInteractiveTree(newKey); // Fallback to a clean slate
            }
        }
    }

    // Update the current key state after every render
    currentKey = newKey;
    requestAnimationFrame(syncCanvasAndCenter);
}


/**
 * Plays the sequence of highlighted chords in the tree.
 * Handles play, stop, and loop logic, using per-chord playback styles.
 */
export async function playSequence() {
    if (isPlaying) {
        // If called while playing, it's a request to stop.
        stopSequence();
        return;
    }

    const instrument = getSavedInstrument();
    if (!instrument) {
        logger.error("Cannot play sequence: no instrument selected.");
        return;
    }

    isPlaying = true;
    stopPlaybackRequested = false;

    // --- UI Setup for Playback ---
    playBtn.disabled = true;
    stopBtn.disabled = false;
    loopBtn.disabled = true;
    
    try {
        const isLoopingActive = loopBtn.classList.contains('active');
        
        // Main playback loop that can be repeated if looping is enabled
        do {
            const highlightedNodes = Array.from(document.querySelectorAll('.chord-node.highlighted')) as HTMLElement[];
            highlightedNodes.sort((a, b) => parseInt(a.dataset.level!) - parseInt(b.dataset.level!));

            const activeBpm = getActiveBpm() || 120; // Global BPM for the sequence

            // Iterate through each chord in the sequence
            for (const node of highlightedNodes) {
                if (stopPlaybackRequested) break; // Check for stop signal before each chord

                // Center the playing node in the view.
                focusNodeInView(node, true);

                // --- Get effective playback style, respecting inheritance ---
                const { pattern: effectivePattern } = getEffectivePatternForNode(node);
                const activeStrum = effectivePattern && 'beats' in effectivePattern ? effectivePattern : null;
                const activeArpeggio = effectivePattern && 'noteOrder' in effectivePattern ? effectivePattern : null;

                node.classList.add('playing');
                const chordName = node.dataset.chord;
                const voicingIndex = parseInt(node.dataset.voicingIndex || '0', 10);

                if (chordName) {
                    const voicing = getVoicingForChord(chordName, instrument, voicingIndex);
                    if (voicing.length > 0) {
                         const notes = voicing.map(v => v.note);
                        if (activeArpeggio) {
                            const beatsPerMeasure = activeArpeggio.beatsPerMeasure || 4;
                            const durationPerChord = (60 / activeBpm) * beatsPerMeasure;
                            await audio.playArpeggiatedChord(voicing, instrument, durationPerChord, activeArpeggio, node);
                        } else if (activeStrum) {
                            const beatsPerMeasure = activeStrum.beatsPerMeasure || 4;
                            const durationPerChord = (60 / activeBpm) * beatsPerMeasure;
                            await audio.playStrummedChord(notes, instrument, durationPerChord, activeStrum.beats);
                        } else {
                            // Default: Play as a simple block chord, one chord per beat.
                            audio.playChord(notes, instrument);
                            const durationPerChord = (60 / activeBpm);
                            await new Promise(resolve => setTimeout(resolve, durationPerChord * 1000));
                        }
                    }
                }
                
                node.classList.remove('playing');
            }
            
            if (stopPlaybackRequested) break; // Exit loop if stopped during the last chord

        } while (isLoopingActive && !stopPlaybackRequested);

    } finally {
        // --- UI Teardown / Reset ---
        isPlaying = false;
        playBtn.disabled = false;
        stopBtn.disabled = true;
        loopBtn.disabled = false;
    }
}