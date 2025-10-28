/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file centralizes all DOM element selections.
// Elements are declared here but initialized later to avoid race conditions.

export let chordSelect: HTMLSelectElement;
export let progressionSelect: HTMLSelectElement;
export let timeSignatureSelect: HTMLSelectElement;
export let errorMessage: HTMLDivElement;
export let treeRootEl: HTMLDivElement;
export let audioLoader: HTMLDivElement;
export let connectionsSVG: SVGElement;
export let treeContainer: HTMLDivElement;
export let treeCanvas: HTMLDivElement;
export let borrowedChordsToggle: HTMLInputElement;
export let keyQualityToggle: HTMLInputElement;

// Main control buttons
export let backToWelcomeBtn: HTMLButtonElement;

// Welcome Modal
export let welcomeModal: HTMLDivElement;
export let welcomeSelectGuitarBtn: HTMLButtonElement;
export let welcomeSelectUkuleleBtn: HTMLButtonElement;

// App content wrapper
export let appContent: HTMLDivElement;

// Left Sidebar
export let leftSidebar: HTMLDivElement;
export let leftSidebarToggle: HTMLButtonElement;

// Command Center Sidebar
export let commandCenter: HTMLDivElement;
export let commandCenterToggle: HTMLButtonElement;
export let accordionHeaders: NodeListOf<HTMLButtonElement>;


// Playback Controls (now in progression bar)
export let playbackControlsContainer: HTMLDivElement;
export let playBtn: HTMLButtonElement;
export let stopBtn: HTMLButtonElement;
export let loopBtn: HTMLButtonElement;
export let globalBpmControl: HTMLDivElement;
export let globalBpmSlider: HTMLInputElement;
export let globalBpmValue: HTMLSpanElement;
export let zoomInBtn: HTMLButtonElement;
export let zoomOutBtn: HTMLButtonElement;
export let resetZoomBtn: HTMLButtonElement;

// Sidebar Buttons
export let clearProgressionBtn: HTMLButtonElement;
export let backToExploreBtn: HTMLButtonElement;

// Progression Toolbar (Top)
export let progressionToolbarContainer: HTMLDivElement;
export let progressionBarToggle: HTMLButtonElement;
export let progressionPreviewChords: HTMLDivElement;
export let progBarSaveBtn: HTMLButtonElement;
export let progBarAddToSongBtn: HTMLButtonElement;
export let progBarExportMidiBtn: HTMLButtonElement;
export let progBarClearBtn: HTMLButtonElement;


// Key Explorer Modal Elements
export let circleOfFifthsBtn: HTMLButtonElement;
export let chordAtlasBtn: HTMLButtonElement;
export let keyExplorerModal: HTMLDivElement;
export let closeModalBtn: HTMLButtonElement;
export let circleOfFifthsContainer: HTMLDivElement;

// Fretboard Visualizer Modal Elements
export let fretboardModal: HTMLDivElement;
export let closeFretboardModalBtn: HTMLButtonElement;
export let fretboardModalTitle: HTMLHeadingElement;
export let fretboardVisualizerContainer: HTMLDivElement;
export let fretboardPrevVoicingBtn: HTMLButtonElement;
export let fretboardNextVoicingBtn: HTMLButtonElement;
export let fretboardVoicingIndicator: HTMLSpanElement;

// Strumming Modal Elements
export let strummingModal: HTMLDivElement;
export let closeStrummingModalBtn: HTMLButtonElement;
export let strummingPatternsContainer: HTMLDivElement;
export let strumBpmControlContainer: HTMLDivElement;
export let strumBpmSlider: HTMLInputElement;
export let strumBpmValue: HTMLSpanElement;
export let applyStrumToChordBtn: HTMLButtonElement;
export let applyStrumToAllBtn: HTMLButtonElement;

// Arpeggio Modal Elements
export let arpeggioModal: HTMLDivElement;
export let closeArpeggioModalBtn: HTMLButtonElement;
export let arpeggioPatternsContainer: HTMLDivElement;
export let arpeggioBpmControlContainer: HTMLDivElement;
export let arpeggioBpmSlider: HTMLInputElement;
export let arpeggioBpmValue: HTMLSpanElement;
export let applyArpeggioToChordBtn: HTMLButtonElement;
export let applyArpeggioToAllBtn: HTMLButtonElement;


// Save Progression Modal Elements
export let saveProgressionModal: HTMLDivElement;
export let closeSaveModalBtn: HTMLButtonElement;
export let confirmSaveBtn: HTMLButtonElement;
export let progressionNameInput: HTMLInputElement;

// Manage Progressions Modal Elements
export let savedProgressionsList: HTMLDivElement;
export let exportProgressionsBtn: HTMLButtonElement;
export let importProgressionsInput: HTMLInputElement;

// Chord Library Modal Elements
export let chordLibraryModal: HTMLDivElement;
export let closeChordLibraryModalBtn: HTMLButtonElement;
export let chordLibrarySearchInput: HTMLInputElement;
export let chordLibraryList: HTMLDivElement;

// Voicing Modal Elements
export let voicingModal: HTMLDivElement;
export let closeVoicingModalBtn: HTMLButtonElement;
export let voicingModalTitle: HTMLHeadingElement;
export let voicingOptionsContainer: HTMLDivElement;

// Substitution Modal Elements
export let substitutionModal: HTMLDivElement;
export let closeSubstitutionModalBtn: HTMLButtonElement;
export let substitutionModalTitle: HTMLHeadingElement;
export let substitutionOptionsContainer: HTMLDivElement;

// Rhythm Editor Modal Elements
export let rhythmEditorModal: HTMLDivElement;
export let closeRhythmEditorBtn: HTMLButtonElement;
export let createCustomStrumBtn: HTMLButtonElement;
export let createCustomArpeggioBtn: HTMLButtonElement;
export let rhythmPatternNameInput: HTMLInputElement;
export let rhythmPatternTypeSelect: HTMLSelectElement;
export let rhythmTimeSignatureSelect: HTMLSelectElement;
export let rhythmEditorGridContainer: HTMLDivElement;
export let rhythmEditorPreviewBtn: HTMLButtonElement;
export let rhythmEditorCancelBtn: HTMLButtonElement;
export let rhythmEditorSaveBtn: HTMLButtonElement;
export let rhythmEditorSaveAsBtn: HTMLButtonElement;

// Song Arranger Elements (Panel)
export let songArrangerPanel: HTMLDivElement;
export let songArrangerToggle: HTMLButtonElement;
export let songTimeline: HTMLDivElement;
export let playSongBtn: HTMLButtonElement;
export let clearSongBtn: HTMLButtonElement;
export let arrangerPlaceholder: HTMLParagraphElement;
export let songBpmControl: HTMLDivElement;
export let songBpmSlider: HTMLInputElement;
export let songBpmValue: HTMLSpanElement;


// Song Arranger Save/Load Elements
export let saveSongBtn: HTMLButtonElement;
export let saveSongModal: HTMLDivElement;
export let closeSaveSongModalBtn: HTMLButtonElement;
export let confirmSaveSongBtn: HTMLButtonElement;
export let songNameInput: HTMLInputElement;
export let savedSongsList: HTMLDivElement;
export let exportSongsBtn: HTMLButtonElement;
export let importSongsInput: HTMLInputElement;

// Color Settings Modal Elements
export let colorSettingsModal: HTMLDivElement;
export let closeColorSettingsModalBtn: HTMLButtonElement;
export let colorPrimaryInput: HTMLInputElement;
export let colorSecondaryInput: HTMLInputElement;
export let colorBorrowedInput: HTMLInputElement;
export let colorTenseInput: HTMLInputElement;
export let colorSecondaryDominantInput: HTMLInputElement;
export let saveColorsBtn: HTMLButtonElement;
export let resetColorsBtn: HTMLButtonElement;

// Log Modal Elements
export let logModal: HTMLDivElement;
export let closeLogModalBtn: HTMLButtonElement;
export let logContainer: HTMLDivElement;
export let clearLogBtn: HTMLButtonElement;
export let copyLogBtn: HTMLButtonElement;
export let viewLogBtn: HTMLButtonElement;

// Appearance Settings Modal Elements
export let settingsBtn: HTMLButtonElement;
export let appearanceSettingsModal: HTMLDivElement;
export let closeAppearanceSettingsModalBtn: HTMLButtonElement;
export let settingsColorBtn: HTMLButtonElement;
export let settingsBackgroundColorInput: HTMLInputElement;
export let settingsResetBackgroundColorBtn: HTMLButtonElement;

// Backup & Data Elements
export let backupSaveStatesBtn: HTMLButtonElement;
export let backupLoadStatesInput: HTMLInputElement;

// Libraries Modal Elements
export let librariesBtn: HTMLButtonElement;
export let librariesModal: HTMLDivElement;
export let closeLibrariesModalBtn: HTMLButtonElement;
export let librariesChordBtn: HTMLButtonElement;
export let librariesStrummingBtn: HTMLButtonElement;
export let librariesArpeggioBtn: HTMLButtonElement;
export let librariesSongBtn: HTMLButtonElement;
export let librariesProgressionBtn: HTMLButtonElement;

// Help Modal Elements
export let helpBtn: HTMLButtonElement;
export let helpModal: HTMLDivElement;
export let closeHelpModalBtn: HTMLButtonElement;
export let helpViewLogBtn: HTMLButtonElement;

// Pattern Popover
export let patternPopover: HTMLDivElement;
export let patternPopoverTitle: HTMLHeadingElement;
export let patternPopoverContent: HTMLDivElement;
export let patternPopoverCloseBtn: HTMLButtonElement;
export let patternPopoverCreateBtn: HTMLButtonElement;


/**
 * Initializes all DOM element variables. Must be called after DOM is loaded.
 */
export function initializeDom() {
    chordSelect = document.getElementById('chord-select') as HTMLSelectElement;
    progressionSelect = document.getElementById('progression-select') as HTMLSelectElement;
    timeSignatureSelect = document.getElementById('time-signature-select') as HTMLSelectElement;
    errorMessage = document.getElementById('error-message') as HTMLDivElement;
    treeRootEl = document.getElementById('tree-root') as HTMLDivElement;
    audioLoader = document.getElementById('audio-loader') as HTMLDivElement;
    connectionsSVG = document.getElementById('tree-connections') as unknown as SVGElement;
    treeContainer = document.getElementById('progression-tree-container') as HTMLDivElement;
    treeCanvas = document.getElementById('tree-canvas') as HTMLDivElement;
    borrowedChordsToggle = document.getElementById('borrowed-chords-toggle') as HTMLInputElement;
    keyQualityToggle = document.getElementById('key-quality-toggle') as HTMLInputElement;
    backToWelcomeBtn = document.getElementById('back-to-welcome-btn') as HTMLButtonElement;
    welcomeModal = document.getElementById('welcome-modal') as HTMLDivElement;
    welcomeSelectGuitarBtn = document.getElementById('welcome-select-guitar') as HTMLButtonElement;
    welcomeSelectUkuleleBtn = document.getElementById('welcome-select-ukulele') as HTMLButtonElement;
    appContent = document.getElementById('app-content') as HTMLDivElement;
    leftSidebar = document.getElementById('left-sidebar') as HTMLDivElement;
    leftSidebarToggle = document.getElementById('left-sidebar-toggle') as HTMLButtonElement;
    commandCenter = document.getElementById('command-center') as HTMLDivElement;
    commandCenterToggle = document.getElementById('command-center-toggle') as HTMLButtonElement;
    accordionHeaders = document.querySelectorAll('.accordion-header');
    playbackControlsContainer = document.getElementById('playback-controls-container') as HTMLDivElement;
    playBtn = document.getElementById('play-btn') as HTMLButtonElement;
    stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
    loopBtn = document.getElementById('loop-btn') as HTMLButtonElement;
    globalBpmControl = document.getElementById('global-bpm-control') as HTMLDivElement;
    globalBpmSlider = document.getElementById('global-bpm-slider') as HTMLInputElement;
    globalBpmValue = document.getElementById('global-bpm-value') as HTMLSpanElement;
    zoomInBtn = document.getElementById('zoom-in-btn') as HTMLButtonElement;
    zoomOutBtn = document.getElementById('zoom-out-btn') as HTMLButtonElement;
    resetZoomBtn = document.getElementById('reset-zoom-btn') as HTMLButtonElement;
    clearProgressionBtn = document.getElementById('clear-progression-btn') as HTMLButtonElement;
    backToExploreBtn = document.getElementById('back-to-explore-btn') as HTMLButtonElement;
    progressionToolbarContainer = document.getElementById('progression-toolbar-container') as HTMLDivElement;
    progressionBarToggle = document.getElementById('progression-bar-toggle') as HTMLButtonElement;
    progressionPreviewChords = document.getElementById('progression-preview-chords') as HTMLDivElement;
    progBarSaveBtn = document.getElementById('prog-bar-save-btn') as HTMLButtonElement;
    progBarAddToSongBtn = document.getElementById('prog-bar-add-to-song-btn') as HTMLButtonElement;
    progBarExportMidiBtn = document.getElementById('prog-bar-export-midi-btn') as HTMLButtonElement;
    progBarClearBtn = document.getElementById('prog-bar-clear-btn') as HTMLButtonElement;
    circleOfFifthsBtn = document.getElementById('circle-of-fifths-btn') as HTMLButtonElement;
    chordAtlasBtn = document.getElementById('chord-atlas-btn') as HTMLButtonElement;
    keyExplorerModal = document.getElementById('key-explorer-modal') as HTMLDivElement;
    closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement;
    circleOfFifthsContainer = document.getElementById('circle-of-fifths-container') as HTMLDivElement;
    fretboardModal = document.getElementById('fretboard-modal') as HTMLDivElement;
    closeFretboardModalBtn = document.getElementById('close-fretboard-modal-btn') as HTMLButtonElement;
    fretboardModalTitle = document.getElementById('fretboard-modal-title') as HTMLHeadingElement;
    fretboardVisualizerContainer = document.getElementById('fretboard-visualizer-container') as HTMLDivElement;
    fretboardPrevVoicingBtn = document.getElementById('fretboard-prev-voicing-btn') as HTMLButtonElement;
    fretboardNextVoicingBtn = document.getElementById('fretboard-next-voicing-btn') as HTMLButtonElement;
    fretboardVoicingIndicator = document.getElementById('fretboard-voicing-indicator') as HTMLSpanElement;
    strummingModal = document.getElementById('strumming-modal') as HTMLDivElement;
    closeStrummingModalBtn = document.getElementById('close-strumming-modal-btn') as HTMLButtonElement;
    strummingPatternsContainer = document.getElementById('strumming-patterns-container') as HTMLDivElement;
    strumBpmControlContainer = document.getElementById('strum-bpm-control-container') as HTMLDivElement;
    strumBpmSlider = document.getElementById('strum-bpm-slider') as HTMLInputElement;
    strumBpmValue = document.getElementById('strum-bpm-value') as HTMLSpanElement;
    applyStrumToChordBtn = document.getElementById('apply-strum-to-chord-btn') as HTMLButtonElement;
    applyStrumToAllBtn = document.getElementById('apply-strum-to-all-btn') as HTMLButtonElement;
    arpeggioModal = document.getElementById('arpeggio-modal') as HTMLDivElement;
    closeArpeggioModalBtn = document.getElementById('close-arpeggio-modal-btn') as HTMLButtonElement;
    arpeggioPatternsContainer = document.getElementById('arpeggio-patterns-container') as HTMLDivElement;
    arpeggioBpmControlContainer = document.getElementById('arpeggio-bpm-control-container') as HTMLDivElement;
    arpeggioBpmSlider = document.getElementById('arpeggio-bpm-slider') as HTMLInputElement;
    arpeggioBpmValue = document.getElementById('arpeggio-bpm-value') as HTMLSpanElement;
    applyArpeggioToChordBtn = document.getElementById('apply-arpeggio-to-chord-btn') as HTMLButtonElement;
    applyArpeggioToAllBtn = document.getElementById('apply-arpeggio-to-all-btn') as HTMLButtonElement;
    saveProgressionModal = document.getElementById('save-progression-modal') as HTMLDivElement;
    closeSaveModalBtn = document.getElementById('close-save-modal-btn') as HTMLButtonElement;
    confirmSaveBtn = document.getElementById('confirm-save-btn') as HTMLButtonElement;
    progressionNameInput = document.getElementById('progression-name-input') as HTMLInputElement;
    savedProgressionsList = document.getElementById('saved-progressions-list') as HTMLDivElement;
    exportProgressionsBtn = document.getElementById('export-progressions-btn') as HTMLButtonElement;
    importProgressionsInput = document.getElementById('import-progressions-input') as HTMLInputElement;
    chordLibraryModal = document.getElementById('chord-library-modal') as HTMLDivElement;
    closeChordLibraryModalBtn = document.getElementById('close-chord-library-modal-btn') as HTMLButtonElement;
    chordLibrarySearchInput = document.getElementById('chord-library-search-input') as HTMLInputElement;
    chordLibraryList = document.getElementById('chord-library-list') as HTMLDivElement;
    voicingModal = document.getElementById('voicing-modal') as HTMLDivElement;
    closeVoicingModalBtn = document.getElementById('close-voicing-modal-btn') as HTMLButtonElement;
    voicingModalTitle = document.getElementById('voicing-modal-title') as HTMLHeadingElement;
    voicingOptionsContainer = document.getElementById('voicing-options-container') as HTMLDivElement;
    substitutionModal = document.getElementById('substitution-modal') as HTMLDivElement;
    closeSubstitutionModalBtn = document.getElementById('close-substitution-modal-btn') as HTMLButtonElement;
    substitutionModalTitle = document.getElementById('substitution-modal-title') as HTMLHeadingElement;
    substitutionOptionsContainer = document.getElementById('substitution-options-container') as HTMLDivElement;
    rhythmEditorModal = document.getElementById('rhythm-editor-modal') as HTMLDivElement;
    closeRhythmEditorBtn = document.getElementById('close-rhythm-editor-btn') as HTMLButtonElement;
    createCustomStrumBtn = document.getElementById('create-custom-strum-btn') as HTMLButtonElement;
    createCustomArpeggioBtn = document.getElementById('create-custom-arpeggio-btn') as HTMLButtonElement;
    rhythmPatternNameInput = document.getElementById('rhythm-pattern-name') as HTMLInputElement;
    rhythmPatternTypeSelect = document.getElementById('rhythm-pattern-type') as HTMLSelectElement;
    rhythmTimeSignatureSelect = document.getElementById('rhythm-time-signature') as HTMLSelectElement;
    rhythmEditorGridContainer = document.getElementById('rhythm-editor-grid-container') as HTMLDivElement;
    rhythmEditorPreviewBtn = document.getElementById('rhythm-editor-preview-btn') as HTMLButtonElement;
    rhythmEditorCancelBtn = document.getElementById('rhythm-editor-cancel-btn') as HTMLButtonElement;
    rhythmEditorSaveBtn = document.getElementById('rhythm-editor-save-btn') as HTMLButtonElement;
    rhythmEditorSaveAsBtn = document.getElementById('rhythm-editor-save-as-btn') as HTMLButtonElement;
    songArrangerPanel = document.getElementById('song-arranger-panel') as HTMLDivElement;
    songArrangerToggle = document.getElementById('song-arranger-toggle') as HTMLButtonElement;
    songTimeline = document.getElementById('song-timeline') as HTMLDivElement;
    playSongBtn = document.getElementById('play-song-btn') as HTMLButtonElement;
    clearSongBtn = document.getElementById('clear-song-btn') as HTMLButtonElement;
    arrangerPlaceholder = document.getElementById('arranger-placeholder') as HTMLParagraphElement;
    songBpmControl = document.getElementById('song-bpm-control') as HTMLDivElement;
    songBpmSlider = document.getElementById('song-bpm-slider') as HTMLInputElement;
    songBpmValue = document.getElementById('song-bpm-value') as HTMLSpanElement;
    saveSongBtn = document.getElementById('save-song-btn') as HTMLButtonElement;
    saveSongModal = document.getElementById('save-song-modal') as HTMLDivElement;
    closeSaveSongModalBtn = document.getElementById('close-save-song-modal-btn') as HTMLButtonElement;
    confirmSaveSongBtn = document.getElementById('confirm-save-song-btn') as HTMLButtonElement;
    songNameInput = document.getElementById('song-name-input') as HTMLInputElement;
    savedSongsList = document.getElementById('saved-songs-list') as HTMLDivElement;
    exportSongsBtn = document.getElementById('export-songs-btn') as HTMLButtonElement;
    importSongsInput = document.getElementById('import-songs-input') as HTMLInputElement;
    colorSettingsModal = document.getElementById('color-settings-modal') as HTMLDivElement;
    closeColorSettingsModalBtn = document.getElementById('close-color-settings-modal-btn') as HTMLButtonElement;
    colorPrimaryInput = document.getElementById('color-primary') as HTMLInputElement;
    colorSecondaryInput = document.getElementById('color-secondary') as HTMLInputElement;
    colorBorrowedInput = document.getElementById('color-borrowed') as HTMLInputElement;
    colorTenseInput = document.getElementById('color-tense') as HTMLInputElement;
    colorSecondaryDominantInput = document.getElementById('color-secondary-dominant') as HTMLInputElement;
    saveColorsBtn = document.getElementById('save-colors-btn') as HTMLButtonElement;
    resetColorsBtn = document.getElementById('reset-colors-btn') as HTMLButtonElement;
    logModal = document.getElementById('log-modal') as HTMLDivElement;
    closeLogModalBtn = document.getElementById('close-log-modal-btn') as HTMLButtonElement;
    logContainer = document.getElementById('log-container') as HTMLDivElement;
    clearLogBtn = document.getElementById('clear-log-btn') as HTMLButtonElement;
    copyLogBtn = document.getElementById('copy-log-btn') as HTMLButtonElement;
    settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
    appearanceSettingsModal = document.getElementById('appearance-settings-modal') as HTMLDivElement;
    closeAppearanceSettingsModalBtn = document.getElementById('close-appearance-settings-modal-btn') as HTMLButtonElement;
    settingsColorBtn = document.getElementById('settings-color-btn') as HTMLButtonElement;
    settingsBackgroundColorInput = document.getElementById('settings-background-color') as HTMLInputElement;
    settingsResetBackgroundColorBtn = document.getElementById('settings-reset-background-color-btn') as HTMLButtonElement;
    viewLogBtn = document.getElementById('view-log-btn') as HTMLButtonElement;
    backupSaveStatesBtn = document.getElementById('backup-save-states-btn') as HTMLButtonElement;
    backupLoadStatesInput = document.getElementById('backup-load-states-input') as HTMLInputElement;
    librariesBtn = document.getElementById('libraries-btn') as HTMLButtonElement;
    librariesModal = document.getElementById('libraries-modal') as HTMLDivElement;
    closeLibrariesModalBtn = document.getElementById('close-libraries-modal-btn') as HTMLButtonElement;
    librariesChordBtn = document.getElementById('libraries-chord-btn') as HTMLButtonElement;
    librariesStrummingBtn = document.getElementById('libraries-strumming-btn') as HTMLButtonElement;
    librariesArpeggioBtn = document.getElementById('libraries-arpeggio-btn') as HTMLButtonElement;
    librariesSongBtn = document.getElementById('libraries-song-btn') as HTMLButtonElement;
    librariesProgressionBtn = document.getElementById('libraries-progression-btn') as HTMLButtonElement;
    helpBtn = document.getElementById('help-btn') as HTMLButtonElement;
    helpModal = document.getElementById('help-modal') as HTMLDivElement;
    closeHelpModalBtn = document.getElementById('close-help-modal-btn') as HTMLButtonElement;
    helpViewLogBtn = document.getElementById('help-view-log-btn') as HTMLButtonElement;
    patternPopover = document.getElementById('pattern-popover') as HTMLDivElement;
    patternPopoverTitle = document.getElementById('pattern-popover-title') as HTMLHeadingElement;
    patternPopoverContent = document.getElementById('pattern-popover-content') as HTMLDivElement;
    patternPopoverCloseBtn = document.getElementById('pattern-popover-close-btn') as HTMLButtonElement;
    patternPopoverCreateBtn = document.getElementById('pattern-popover-create-btn') as HTMLButtonElement;
}