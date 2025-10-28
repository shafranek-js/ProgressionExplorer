/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// DOM Elements
import { initializeDom, chordSelect, progressionSelect, keyQualityToggle, borrowedChordsToggle, timeSignatureSelect, welcomeModal, welcomeSelectGuitarBtn, welcomeSelectUkuleleBtn, appContent, backToWelcomeBtn, commandCenter, commandCenterToggle, accordionHeaders, playBtn, stopBtn, loopBtn, zoomInBtn, zoomOutBtn, resetZoomBtn, clearProgressionBtn, progBarClearBtn, backToExploreBtn, progBarSaveBtn, progBarExportMidiBtn, progBarAddToSongBtn, circleOfFifthsBtn, chordAtlasBtn, closeModalBtn, fretboardModal, closeFretboardModalBtn, fretboardPrevVoicingBtn, fretboardNextVoicingBtn, strummingModal, closeStrummingModalBtn, createCustomStrumBtn, arpeggioModal, closeArpeggioModalBtn, createCustomArpeggioBtn, voicingModal, closeVoicingModalBtn, substitutionModal, closeSubstitutionModalBtn, rhythmEditorModal, closeRhythmEditorBtn, chordLibraryModal, closeChordLibraryModalBtn, chordLibrarySearchInput, saveProgressionModal, closeSaveModalBtn, confirmSaveBtn, exportProgressionsBtn, importProgressionsInput, saveSongBtn, saveSongModal, closeSaveSongModalBtn, confirmSaveSongBtn, exportSongsBtn, importSongsInput, settingsBtn, appearanceSettingsModal, closeAppearanceSettingsModalBtn, settingsColorBtn, colorSettingsModal, closeColorSettingsModalBtn, saveColorsBtn, resetColorsBtn, settingsBackgroundColorInput, settingsResetBackgroundColorBtn, librariesBtn, librariesModal, closeLibrariesModalBtn, librariesChordBtn, librariesStrummingBtn, librariesArpeggioBtn, librariesProgressionBtn, librariesSongBtn, helpBtn, helpModal, closeHelpModalBtn, helpViewLogBtn, viewLogBtn, closeLogModalBtn, clearLogBtn, copyLogBtn, backupSaveStatesBtn, backupLoadStatesInput, patternPopoverCloseBtn, patternPopoverCreateBtn, globalBpmSlider, globalBpmValue, strumBpmSlider, strumBpmValue, arpeggioBpmSlider, arpeggioBpmValue, songBpmSlider, songBpmValue, progressionToolbarContainer, progressionBarToggle, leftSidebar, leftSidebarToggle } from './src/dom';

// Core App Logic & Helpers
import { renderApp, playSequence, stopSequence } from './src/app';
import { populateChordSelector, populateProgressionSelector, syncCanvasAndCenter, populateTimeSignatureSelector } from './src/ui-helpers';
import { initializeState, getSavedInstrument, saveWorkspaceState, forceSaveState } from './src/storage';
import { logger } from './src/logger';
import { audio } from './src/audio';

// UI Features & Interactions
import { enablePanning, zoomIn, zoomOut, resetZoom } from './src/panning';
import { initializeTree } from './src/tree';
import { initializeRhythmEditor, openRhythmEditor, getActivePopoverType, closeRhythmEditor } from './src/strumming';
import { setupBpmControl } from './src/strumming';
import { initializeSongArranger, handleAddToSong } from './src/song-arranger';

// Modals & Popovers
import { openKeyExplorer, closeKeyExplorer, closeFretboardVisualizer, showNextFretboardVoicing, showPreviousFretboardVoicing } from './src/visualizer';
import { openStrummingModal, closeStrummingModal, openArpeggioModal, closeArpeggioModal, closePatternPopover } from './src/strumming';
import { openChordLibraryModal, closeChordLibraryModal, filterChordLibrary } from './src/library';
import { closeVoicingModal } from './src/voicing';
import { closeSubstitutionModal } from './src/substitutions';
import { openColorSettingsModal, closeColorSettingsModal, openLogModal, closeLogModal, openSettingsModal, closeSettingsModal, openLibrariesModal, closeLibrariesModal, openHelpModal, closeHelpModal } from './src/ui/modals';

// Workspace & State Management
import { isInitializing, loadStateForInstrument, runChordVoicingValidator, handleSaveColors, handleResetColors, handleBackgroundColorChange, handleResetBackgroundColor, saveCurrentUILayout, getCurrentWorkspaceState } from './src/workspace';
import { handleConfirmSave, handleExportProgressions, handleImportProgressions, handleMidiExportClick, populateSavedSongsList, openSaveProgressionModal, closeSaveProgressionModal, openSaveSongModal, closeSaveSongModal, handleConfirmSaveSong, handleExportSongs, handleImportSongs, handleSaveAllStates, handleLoadAllStates, populateSavedProgressionsList } from './src/features/data-management';
import { handleClearLog, handleCopyLog } from './src/features/logging';

/**
 * Toggles the visibility of the left sidebar.
 */
function toggleLeftSidebar() {
    leftSidebar.classList.toggle('collapsed');
    saveCurrentUILayout();
}

/**
 * Toggles the visibility of the command center sidebar.
 */
function toggleCommandCenter() {
    commandCenter.classList.toggle('collapsed');
    saveCurrentUILayout();
}

/**
 * Toggles the visibility of the top progression toolbar.
 */
function toggleProgressionToolbar() {
    progressionToolbarContainer.classList.toggle('collapsed');
    saveCurrentUILayout();
}

/**
 * Clears the current progression, resets to free explore mode, and re-renders the tree.
 */
function clearProgression() {
    progressionSelect.value = 'free-explore';
    resetZoom();
    renderApp();
}

/**
 * Main application initialization.
 */
async function initApp() {
    // Stage 1: Initialize state from DB first.
    await initializeState();

    isInitializing.value = true;

    // Stage 2: Set up the DOM and core UI elements.
    initializeDom();
    populateChordSelector();
    populateProgressionSelector();
    populateTimeSignatureSelector();
    initializeTree();
    initializeRhythmEditor();
    enablePanning();
    initializeSongArranger();

    // Run diagnostics
    runChordVoicingValidator();

    // Stage 3: Restore workspace or show welcome screen.
    const savedInstrument = getSavedInstrument();
    if (savedInstrument) {
        welcomeModal.style.display = 'none';
        appContent.classList.remove('hidden');
        loadStateForInstrument(savedInstrument);
    } else {
        welcomeModal.style.display = 'flex';
        welcomeModal.classList.add('active');
        appContent.classList.add('hidden');
    }

    // --- Event Listeners ---
    // Welcome Screen
    welcomeSelectGuitarBtn.addEventListener('click', async () => {
        await audio.init();
        welcomeModal.classList.remove('active');
        setTimeout(() => welcomeModal.style.display = 'none', 300);
        appContent.classList.remove('hidden');
        loadStateForInstrument('guitar');
    });
    welcomeSelectUkuleleBtn.addEventListener('click', async () => {
        await audio.init();
        welcomeModal.classList.remove('active');
        setTimeout(() => welcomeModal.style.display = 'none', 300);
        appContent.classList.remove('hidden');
        loadStateForInstrument('ukulele');
    });
    backToWelcomeBtn.addEventListener('click', () => {
        // Save the state of the current instrument before leaving
        const currentInstrument = getSavedInstrument();
        if (currentInstrument) {
            const currentState = getCurrentWorkspaceState();
            saveWorkspaceState(currentState, currentInstrument);
        }
        
        appContent.classList.add('hidden');
        welcomeModal.style.display = 'flex';
        setTimeout(() => welcomeModal.classList.add('active'), 10);
    });

    // Main Controls
    chordSelect.addEventListener('change', () => { if (!isInitializing.value) renderApp({ transposeFreeExplore: true }); });
    progressionSelect.addEventListener('change', () => { if (!isInitializing.value) renderApp(); });
    keyQualityToggle.addEventListener('change', () => { if (!isInitializing.value) renderApp({ transposeFreeExplore: true }); });
    borrowedChordsToggle.addEventListener('change', () => { if (!isInitializing.value && progressionSelect.value === 'free-explore') renderApp(); });

    // Playback & View
    playBtn.addEventListener('click', playSequence);
    stopBtn.addEventListener('click', stopSequence);
    loopBtn.addEventListener('click', () => loopBtn.classList.toggle('active'));
    setupBpmControl([globalBpmSlider, strumBpmSlider, arpeggioBpmSlider, songBpmSlider], [globalBpmValue, strumBpmValue, arpeggioBpmValue, songBpmValue]);
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    resetZoomBtn.addEventListener('click', () => { resetZoom(); syncCanvasAndCenter(); });

    // Sidebars & Accordion
    leftSidebarToggle.addEventListener('click', toggleLeftSidebar);
    commandCenterToggle.addEventListener('click', toggleCommandCenter);
    progressionBarToggle.addEventListener('click', toggleProgressionToolbar);
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling as HTMLElement;
            const isOpen = header.classList.contains('open');
            accordionHeaders.forEach(h => { if (h !== header) { h.classList.remove('open'); (h.nextElementSibling as HTMLElement).classList.remove('open'); } });
            if (!isOpen) {
                header.classList.add('open');
                content.classList.add('open');
                const headerText = header.querySelector('span')?.textContent?.trim();
                if (headerText === 'Progression Tools') populateSavedProgressionsList();
                else if (headerText === 'Song Tools') populateSavedSongsList();
            } else {
                header.classList.remove('open');
                content.classList.remove('open');
            }
        });
    });
    if (accordionHeaders.length > 0) accordionHeaders[0].click(); // Open first by default

    // Progression Tools
    progBarSaveBtn.addEventListener('click', openSaveProgressionModal);
    closeSaveModalBtn.addEventListener('click', closeSaveProgressionModal);
    confirmSaveBtn.addEventListener('click', handleConfirmSave);
    exportProgressionsBtn.addEventListener('click', handleExportProgressions);
    importProgressionsInput.addEventListener('change', handleImportProgressions);
    progBarExportMidiBtn.addEventListener('click', handleMidiExportClick);
    clearProgressionBtn.addEventListener('click', clearProgression);
    progBarClearBtn.addEventListener('click', clearProgression);
    backToExploreBtn.addEventListener('click', () => { progressionSelect.value = 'free-explore'; renderApp(); });

    // Song Tools
    progBarAddToSongBtn.addEventListener('click', handleAddToSong);
    saveSongBtn.addEventListener('click', openSaveSongModal);
    closeSaveSongModalBtn.addEventListener('click', closeSaveSongModal);
    confirmSaveSongBtn.addEventListener('click', handleConfirmSaveSong);
    exportSongsBtn.addEventListener('click', handleExportSongs);
    importSongsInput.addEventListener('change', handleImportSongs);

    // Modal Triggers
    circleOfFifthsBtn.addEventListener('click', openKeyExplorer);
    chordAtlasBtn.addEventListener('click', () => {
        window.open('https://ai.studio/apps/drive/1Tdt1o0M-Q3rnb3uIp_Au5jV9lxOMVj37', '_blank');
    });
    librariesBtn.addEventListener('click', openLibrariesModal);
    settingsBtn.addEventListener('click', openSettingsModal);
    helpBtn.addEventListener('click', openHelpModal);
    viewLogBtn.addEventListener('click', openLogModal);
    createCustomStrumBtn.addEventListener('click', () => { closeStrummingModal(); openRhythmEditor('strum'); });
    createCustomArpeggioBtn.addEventListener('click', () => { closeArpeggioModal(); openRhythmEditor('arpeggio'); });

    // Modal Close/Action Buttons
    closeModalBtn.addEventListener('click', closeKeyExplorer);
    closeFretboardModalBtn.addEventListener('click', closeFretboardVisualizer);
    fretboardPrevVoicingBtn.addEventListener('click', showPreviousFretboardVoicing);
    fretboardNextVoicingBtn.addEventListener('click', showNextFretboardVoicing);
    closeStrummingModalBtn.addEventListener('click', closeStrummingModal);
    closeArpeggioModalBtn.addEventListener('click', closeArpeggioModal);
    closeVoicingModalBtn.addEventListener('click', closeVoicingModal);
    closeSubstitutionModalBtn.addEventListener('click', closeSubstitutionModal);
    closeRhythmEditorBtn.addEventListener('click', closeRhythmEditor);
    closeChordLibraryModalBtn.addEventListener('click', closeChordLibraryModal);
    closeAppearanceSettingsModalBtn.addEventListener('click', closeSettingsModal);
    closeColorSettingsModalBtn.addEventListener('click', closeColorSettingsModal);
    closeLibrariesModalBtn.addEventListener('click', closeLibrariesModal);
    closeHelpModalBtn.addEventListener('click', closeHelpModal);
    closeLogModalBtn.addEventListener('click', closeLogModal);
    clearLogBtn.addEventListener('click', handleClearLog);
    copyLogBtn.addEventListener('click', handleCopyLog);
    helpViewLogBtn.addEventListener('click', () => { closeHelpModal(); openLogModal(); });
    patternPopoverCloseBtn.addEventListener('click', closePatternPopover);
    patternPopoverCreateBtn.addEventListener('click', () => { const type = getActivePopoverType(); if (type) { closePatternPopover(); openRhythmEditor(type); } });
    
    // Library Navigation
    chordLibrarySearchInput.addEventListener('input', filterChordLibrary);
    librariesChordBtn.addEventListener('click', () => { closeLibrariesModal(); openChordLibraryModal(); });
    librariesStrummingBtn.addEventListener('click', () => { closeLibrariesModal(); openStrummingModal(); });
    librariesArpeggioBtn.addEventListener('click', () => { closeLibrariesModal(); openArpeggioModal(); });
    librariesProgressionBtn.addEventListener('click', () => {
        closeLibrariesModal();
        const header = Array.from(accordionHeaders).find(h => h.textContent?.trim().startsWith('Progression Tools'));
        if (header && !header.classList.contains('open')) header.click();
    });
    librariesSongBtn.addEventListener('click', () => {
        closeLibrariesModal();
        const header = Array.from(accordionHeaders).find(h => h.textContent?.trim().startsWith('Song Tools'));
        if (header && !header.classList.contains('open')) header.click();
    });

    // Settings
    settingsColorBtn.addEventListener('click', openColorSettingsModal);
    saveColorsBtn.addEventListener('click', handleSaveColors);
    resetColorsBtn.addEventListener('click', handleResetColors);
    settingsBackgroundColorInput.addEventListener('input', (e) => handleBackgroundColorChange((e.target as HTMLInputElement).value));
    settingsResetBackgroundColorBtn.addEventListener('click', handleResetBackgroundColor);
    
    // Backup & Data
    backupSaveStatesBtn.addEventListener('click', handleSaveAllStates);
    backupLoadStatesInput.addEventListener('change', handleLoadAllStates);

    // Save state before the page is unloaded
    window.addEventListener('pagehide', () => {
        if (isInitializing.value) return; // Don't save during initialization
        
        const currentInstrument = getSavedInstrument();
        if (currentInstrument) {
            // This updates the in-memory state object
            const currentState = getCurrentWorkspaceState();
            saveWorkspaceState(currentState, currentInstrument);
            // This forces the in-memory object to be written to IndexedDB immediately, bypassing the debounce
            forceSaveState();
        }
    });

    isInitializing.value = false;
}

/**
 * Main application entry point with error handling.
 */
async function main() {
    try {
        await initApp();
    } catch (e) {
        console.error("Fatal error during application initialization:", e);
        logger.error("Fatal error during application initialization.", e);
        document.body.innerHTML = `
            <div style="color: white; font-family: Inter, sans-serif; padding: 2rem; text-align: center; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <h1 style="font-size: 2rem; font-weight: bold; color: #ef4444;">Application Error</h1>
                <p style="margin-top: 1rem; color: #d1d5db;">A critical error occurred while starting the application. This can sometimes be resolved by clearing your browser's site data (cache and cookies).</p>
                <p style="margin-top: 2rem; color: #6b7280; font-size: 0.8rem; background-color: #1f2937; padding: 1rem; border-radius: 0.5rem; max-width: 600px; text-align: left;"><strong>Details:</strong> ${e instanceof Error ? e.message : String(e)}</p>
            </div>
        `;
    }
}

main();