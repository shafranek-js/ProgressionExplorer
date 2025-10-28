/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { chordSelect, progressionSelect, keyQualityToggle, borrowedChordsToggle, treeContainer, settingsBackgroundColorInput, colorPrimaryInput, colorSecondaryInput, colorBorrowedInput, colorTenseInput, colorSecondaryDominantInput, leftSidebar, commandCenter, progressionToolbarContainer, songArrangerPanel, appContent } from './dom';
import { populateProgressionSelector } from './ui-helpers';
import { renderApp } from './app';
import { initializeSongArranger } from './song-arranger';
import { renderProgressionAsInteractive } from './tree';
import { getSavedInstrument, saveInstrument, getWorkspaceState, WorkspaceState, ColorSettings, saveColorSettings, resetColorSettings, getColorSettings, getBackgroundColor, saveBackgroundColor, resetBackgroundColor, saveWorkspaceState, UILayoutState, saveUILayoutState, getUILayoutState } from './storage';
import { getActiveBpm, setBpm, populateStrummingPatterns } from './strumming';
import { logger } from './logger';
import { validateCatalog } from './chord-validator';
import { GUITAR_CHORDS, UKULELE_CHORDS } from './data/chords';
import { closeColorSettingsModal } from './ui/modals';


export let isInitializing = { value: false };

const DEFAULT_GUITAR_BG = '#143629'; // dark green
const DEFAULT_UKULELE_BG = '#1c2b4d'; // dark blue

export function setInstrument(instrument: 'guitar' | 'ukulele') {
    saveInstrument(instrument);
}

/**
 * Applies the correct background color based on custom settings or instrument.
 */
export function applyBackgroundColor() {
    const instrument = getSavedInstrument();
    if (!instrument) return;
    const customColor = getBackgroundColor(instrument);
    let colorToApply = '';

    if (customColor) {
        colorToApply = customColor;
    } else {
        if (instrument === 'guitar') {
            colorToApply = DEFAULT_GUITAR_BG;
        } else if (instrument === 'ukulele') {
            colorToApply = DEFAULT_UKULELE_BG;
        }
    }
    
    if (colorToApply) {
        if (treeContainer) {
            treeContainer.style.backgroundColor = colorToApply;
        }
        if (settingsBackgroundColorInput) {
            settingsBackgroundColorInput.value = colorToApply;
        }
    }
}

/** Handles live changes to the background color input. */
export function handleBackgroundColorChange(color: string) {
    const instrument = getSavedInstrument();
    if (!instrument) return;
    if (treeContainer) {
        treeContainer.style.backgroundColor = color;
    }
    saveBackgroundColor(color, instrument);
}

/** Handles resetting the background color to the instrument default. */
export function handleResetBackgroundColor() {
    const instrument = getSavedInstrument();
    if (!instrument) return;
    resetBackgroundColor(instrument);
    applyBackgroundColor();
}


/**
 * Runs the validation logic for all chord voicings and logs results.
 */
export function runChordVoicingValidator() {
    logger.info("Running chord voicing validation...");
    const guitarIssues = validateCatalog('guitar', GUITAR_CHORDS);
    if (guitarIssues.length > 0) {
        logger.warn(`Guitar chord voicing issues found: ${guitarIssues.length}`);
        guitarIssues.forEach(issue => {
            logger.warn(`- ${issue.symbol} (voicing ${issue.index}): ${issue.problems.join('; ')}`);
        });
    } else {
        logger.info("✅ All guitar chord voicings are valid.");
    }
    const ukuleleIssues = validateCatalog('ukulele', UKULELE_CHORDS);
    if (ukuleleIssues.length > 0) {
        logger.warn(`Ukulele chord voicing issues found: ${ukuleleIssues.length}`);
        ukuleleIssues.forEach(issue => {
            logger.warn(`- ${issue.symbol} (voicing ${issue.index}): ${issue.problems.join('; ')}`);
        });
    } else {
        logger.info("✅ All ukulele chord voicings are valid.");
    }
}

/**
 * Captures the current state of the workspace.
 * @returns A WorkspaceState object.
 */
export function getCurrentWorkspaceState(): WorkspaceState {
    const highlightedNodes = Array.from(document.querySelectorAll('.chord-node.highlighted')) as HTMLElement[];
    highlightedNodes.sort((a, b) => parseInt(a.dataset.level!) - parseInt(b.dataset.level!));
    
    let currentProgressionState: WorkspaceState['currentProgression'] = null;
    if (highlightedNodes.length > 0) {
        currentProgressionState = {
            chords: highlightedNodes.map(n => n.dataset.chord!),
            voicingIndices: highlightedNodes.map(n => parseInt(n.dataset.voicingIndex || '0', 10)),
            strumPatternIds: highlightedNodes.map(n => n.dataset.strumPatternId),
            arpeggioPatternIds: highlightedNodes.map(n => n.dataset.arpeggioPatternId)
        };
    }
    
    const state: WorkspaceState = {
        currentProgression: currentProgressionState,
        key: chordSelect.value,
        isMinor: keyQualityToggle.checked,
        borrowedChords: borrowedChordsToggle.checked,
        bpm: getActiveBpm(),
        selectedProgressionId: progressionSelect.value
    };
    return state;
}

/**
 * Loads the complete state for a given instrument by retrieving its own saved state.
 * @param instrument The instrument to load ('guitar' or 'ukulele').
 */
export function loadStateForInstrument(instrument: 'guitar' | 'ukulele') {
    isInitializing.value = true;
    
    setInstrument(instrument);

    // Repopulate selectors for the new instrument.
    populateProgressionSelector();
    populateStrummingPatterns();
    initializeSongArranger();

    const savedWorkspaceState = getWorkspaceState(instrument);

    if (savedWorkspaceState) {
        // Restore saved state for this instrument, with fallbacks for safety
        chordSelect.value = savedWorkspaceState.key ?? 'C';
        keyQualityToggle.checked = savedWorkspaceState.isMinor ?? false;
        borrowedChordsToggle.checked = savedWorkspaceState.borrowedChords ?? false;
        if(savedWorkspaceState.bpm) setBpm(savedWorkspaceState.bpm);

        if (savedWorkspaceState.currentProgression && savedWorkspaceState.currentProgression.chords) {
            // Restore a "free explore" path
            const p = savedWorkspaceState.currentProgression;
            const key = savedWorkspaceState.isMinor ? `${savedWorkspaceState.key}m` : savedWorkspaceState.key;
            
            // Defensively construct the patterns object to prevent errors from older state files.
            const patterns = {
                strum: p.strumPatternIds ?? [],
                arpeggio: p.arpeggioPatternIds ?? [],
            };

            renderProgressionAsInteractive(
                p.chords,
                key,
                p.voicingIndices,
                patterns
            );
            progressionSelect.value = 'free-explore';
        } else {
            // Restore a selected saved progression
            const savedProgId = savedWorkspaceState.selectedProgressionId;
            if (savedProgId && Array.from(progressionSelect.options).some(opt => opt.value === savedProgId)) {
                progressionSelect.value = savedProgId;
            } else {
                progressionSelect.value = 'free-explore';
            }
            renderApp(); // This will read the dropdowns we just set.
        }
    } else {
        // No saved state, reset to defaults
        chordSelect.value = 'C';
        keyQualityToggle.checked = false;
        borrowedChordsToggle.checked = false;
        progressionSelect.value = 'free-explore';
        setBpm(75);
        renderApp();
    }

    // Apply visual themes last.
    applyColorSettings();
    applyBackgroundColor();
    applyUILayoutState();
    
    isInitializing.value = false;
}


/**
 * Saves the chosen colors and applies them to the UI.
 */
export function handleSaveColors() {
    const instrument = getSavedInstrument();
    if (!instrument) return;
    const newSettings: ColorSettings = {
        primary: colorPrimaryInput.value,
        secondary: colorSecondaryInput.value,
        borrowed: colorBorrowedInput.value,
        tense: colorTenseInput.value,
        secondaryDominant: colorSecondaryDominantInput.value,
    };
    saveColorSettings(newSettings, instrument);
    applyColorSettings();
    closeColorSettingsModal();
}

/**
 * Resets colors to their default values and applies the change.
 */
export function handleResetColors() {
    const instrument = getSavedInstrument();
    if (!instrument) return;
    resetColorSettings(instrument);
    applyColorSettings(); // Re-apply to get the defaults
    closeColorSettingsModal();
}

/**
 * Applies the current color settings to the document's root styles.
 */
export function applyColorSettings() {
    const instrument = getSavedInstrument();
    if (!instrument) return;
    const settings = getColorSettings(instrument);
    const root = document.documentElement;
    root.style.setProperty('--chord-color-primary', settings.primary);
    root.style.setProperty('--chord-color-secondary', settings.secondary);
    root.style.setProperty('--chord-color-borrowed', settings.borrowed);
    root.style.setProperty('--chord-color-tense', settings.tense);
    root.style.setProperty('--chord-color-secondary-dominant', settings.secondaryDominant);
}

/**
 * Captures the current visibility of all panels and saves it to storage.
 */
export function saveCurrentUILayout() {
    const instrument = getSavedInstrument();
    if (!instrument) return;

    const layoutState: UILayoutState = {
        leftSidebarCollapsed: leftSidebar.classList.contains('collapsed'),
        commandCenterCollapsed: commandCenter.classList.contains('collapsed'),
        progressionToolbarCollapsed: progressionToolbarContainer.classList.contains('collapsed'),
        songArrangerOpen: songArrangerPanel.classList.contains('open'),
    };

    saveUILayoutState(layoutState, instrument);
}

/**
 * Applies the saved UI layout state to the DOM.
 */
export function applyUILayoutState() {
    const instrument = getSavedInstrument();
    if (!instrument) return;

    const layoutState = getUILayoutState(instrument);

    leftSidebar.classList.toggle('collapsed', layoutState.leftSidebarCollapsed);
    commandCenter.classList.toggle('collapsed', layoutState.commandCenterCollapsed);
    progressionToolbarContainer.classList.toggle('collapsed', layoutState.progressionToolbarCollapsed);
    songArrangerPanel.classList.toggle('open', layoutState.songArrangerOpen);
    appContent.classList.toggle('song-arranger-open', layoutState.songArrangerOpen);
}