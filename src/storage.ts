/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SongSection } from './types';
import { logger } from './logger';

const DB_NAME = 'ChordExplorerDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

// --- TYPE DEFINITIONS (from original file) ---
export interface SavedProgression {
    id: string;
    name: string;
    tonic: string;
    chords: string[];
}

export interface SavedSong {
    id: string;
    name: string;
    structure: SongSection[];
}

export type StrumGridEvent = 'rest' | 'down' | 'up';
export type ArpeggioGrid = boolean[][];

export interface CustomStrumPattern {
    id: string;
    name: string;
    type: 'strum';
    timeSignature: '4/4' | '3/4' | '6/8';
    grid: StrumGridEvent[];
}

export interface CustomArpeggioPattern {
    id: string;
    name: string;
    type: 'arpeggio';
    timeSignature: '4/4' | '3/4' | '6/8';
    instrument: 'guitar' | 'ukulele';
    grid: ArpeggioGrid;
}

export type CustomPattern = CustomStrumPattern | CustomArpeggioPattern;

export interface ColorSettings {
    primary: string;
    secondary: string;
    borrowed: string;
    tense: string;
    secondaryDominant: string;
}

export const DEFAULT_COLOR_SETTINGS: ColorSettings = {
    primary: '#10b981',
    secondary: '#3b82f6',
    borrowed: '#ef4444',
    tense: '#f59e0b',
    secondaryDominant: '#a855f7',
};

export interface WorkspaceState {
    currentProgression: {
        chords: string[];
        voicingIndices: number[];
        strumPatternIds: (string | undefined)[];
        arpeggioPatternIds: (string | undefined)[];
    } | null;
    key: string;
    isMinor: boolean;
    borrowedChords: boolean;
    bpm: number | null;
    selectedProgressionId: string;
}

export interface UILayoutState {
    leftSidebarCollapsed: boolean;
    commandCenterCollapsed: boolean;
    progressionToolbarCollapsed: boolean;
    songArrangerOpen: boolean;
}

export interface InstrumentStateSnapshot {
    progressions: SavedProgression[];
    songs: SavedSong[];
    customPatterns: CustomPattern[];
    colorSettings: ColorSettings;
    backgroundColor: string | null;
    arrangerState: SongSection[];
    workspaceState: WorkspaceState | null;
    uiLayout: UILayoutState;
}

export interface FullStateSnapshot {
    guitar: InstrumentStateSnapshot;
    ukulele: InstrumentStateSnapshot;
    lastActiveInstrument?: 'guitar' | 'ukulele';
}


// --- INDEXEDDB WRAPPER ---
let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (event) => {
            logger.error('IndexedDB error', event);
            reject('Error opening DB');
        };
        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME);
            }
        };
    });
}

async function dbGet<T>(key: IDBValidKey): Promise<T | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as T | undefined);
    });
}

async function dbSet(key: IDBValidKey, value: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}


// --- STATE MANAGEMENT ---
let _inMemoryState: FullStateSnapshot | null = null;
let _saveTimeout: number | null = null;

const DEFAULT_INSTRUMENT_STATE: InstrumentStateSnapshot = {
    progressions: [],
    songs: [],
    customPatterns: [],
    colorSettings: { ...DEFAULT_COLOR_SETTINGS },
    backgroundColor: null,
    arrangerState: [],
    workspaceState: null,
    uiLayout: {
        leftSidebarCollapsed: false,
        commandCenterCollapsed: false,
        progressionToolbarCollapsed: false,
        songArrangerOpen: false,
    },
};

async function _persistState() {
    if (!_inMemoryState) return;
    if (_saveTimeout) {
        clearTimeout(_saveTimeout);
        _saveTimeout = null;
    }
    try {
        await dbSet('guitar', _inMemoryState.guitar);
        await dbSet('ukulele', _inMemoryState.ukulele);
        if (_inMemoryState.lastActiveInstrument) {
            await dbSet('lastActiveInstrument', _inMemoryState.lastActiveInstrument);
        }
        logger.info('Workspace state saved.');
    } catch (e) {
        logger.error('Failed to persist state to IndexedDB', e);
    }
}

/** Allows for immediate, non-debounced state persistence. */
export async function forceSaveState() {
    await _persistState();
}

function _debouncedPersist() {
    if (_saveTimeout) {
        clearTimeout(_saveTimeout);
    }
    _saveTimeout = window.setTimeout(() => {
        _persistState();
    }, 2000); // 2-second debounce
}

function _getState(): FullStateSnapshot {
    if (!_inMemoryState) {
        throw new Error('State not initialized. Call initializeState() first.');
    }
    return _inMemoryState;
}

function _getInstrumentState(instrument: 'guitar' | 'ukulele'): InstrumentStateSnapshot {
    return _getState()[instrument];
}

export async function initializeState(): Promise<void> {
    logger.info('Initializing application state from IndexedDB...');
    const guitarState = await dbGet<InstrumentStateSnapshot>('guitar');
    const ukuleleState = await dbGet<InstrumentStateSnapshot>('ukulele');
    const lastActiveInstrument = await dbGet<'guitar' | 'ukulele'>('lastActiveInstrument');

    _inMemoryState = {
        guitar: guitarState || JSON.parse(JSON.stringify(DEFAULT_INSTRUMENT_STATE)),
        ukulele: ukuleleState || JSON.parse(JSON.stringify(DEFAULT_INSTRUMENT_STATE)),
        lastActiveInstrument: lastActiveInstrument
    };
    logger.info('State initialized.');
}

export async function restoreFromBackup(snapshot: FullStateSnapshot): Promise<void> {
    if (snapshot.guitar && snapshot.ukulele) {
        _inMemoryState = snapshot;
        await _persistState(); // Immediate, non-debounced save
        logger.action('Restored state from backup file.');
    } else {
        throw new Error('Invalid snapshot file format.');
    }
}

// --- PUBLIC API ---

// Instrument
export function getSavedInstrument(): 'guitar' | 'ukulele' | undefined {
    return _getState().lastActiveInstrument;
}
export function saveInstrument(instrument: 'guitar' | 'ukulele') {
    _getState().lastActiveInstrument = instrument;
    _debouncedPersist();
}

// Workspace State
export function getWorkspaceState(instrument: 'guitar' | 'ukulele'): WorkspaceState | null {
    return _getInstrumentState(instrument).workspaceState;
}
export function saveWorkspaceState(state: WorkspaceState, instrument: 'guitar' | 'ukulele') {
    _getInstrumentState(instrument).workspaceState = state;
    _debouncedPersist();
}

// UI Layout State
export function getUILayoutState(instrument: 'guitar' | 'ukulele'): UILayoutState {
    const state = _getInstrumentState(instrument);
    // Provide a default if it doesn't exist for backward compatibility with older saved states.
    return state.uiLayout || {
        leftSidebarCollapsed: false,
        commandCenterCollapsed: false,
        progressionToolbarCollapsed: false,
        songArrangerOpen: false,
    };
}
export function saveUILayoutState(layout: UILayoutState, instrument: 'guitar' | 'ukulele') {
    _getInstrumentState(instrument).uiLayout = layout;
    _debouncedPersist();
}


// Progressions
export function getSavedProgressions(instrument: 'guitar' | 'ukulele'): SavedProgression[] {
    return _getInstrumentState(instrument).progressions;
}
export function saveProgression(progression: Omit<SavedProgression, 'id'>, instrument: 'guitar' | 'ukulele'): SavedProgression {
    const newProgression: SavedProgression = { ...progression, id: `custom_${Date.now()}` };
    _getInstrumentState(instrument).progressions.push(newProgression);
    _debouncedPersist();
    return newProgression;
}
export function deleteProgression(id: string, instrument: 'guitar' | 'ukulele') {
    const state = _getInstrumentState(instrument);
    state.progressions = state.progressions.filter(p => p.id !== id);
    _debouncedPersist();
}
export function importProgressions(importedProgressions: any[], instrument: 'guitar' | 'ukulele'): number {
    const state = _getInstrumentState(instrument);
    const existingProgressionKeys = new Set(state.progressions.map(p => `${p.name}|${p.tonic}|${p.chords.join(',')}`));
    let newProgressionsAdded = 0;

    importedProgressions.forEach(importedProg => {
        if (importedProg && typeof importedProg.name === 'string' && typeof importedProg.tonic === 'string' && Array.isArray(importedProg.chords)) {
            const importKey = `${importedProg.name}|${importedProg.tonic}|${importedProg.chords.join(',')}`;
            if (!existingProgressionKeys.has(importKey)) {
                state.progressions.push({
                    name: importedProg.name,
                    tonic: importedProg.tonic,
                    chords: importedProg.chords,
                    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2)}`
                });
                existingProgressionKeys.add(importKey);
                newProgressionsAdded++;
            }
        }
    });

    if (newProgressionsAdded > 0) _debouncedPersist();
    return newProgressionsAdded;
}

// Custom Patterns
export function getCustomPatterns(instrument: 'guitar' | 'ukulele'): CustomPattern[] {
    return _getInstrumentState(instrument).customPatterns;
}
export function saveCustomPattern(pattern: Omit<CustomPattern, 'id'> | CustomPattern, instrument: 'guitar' | 'ukulele'): CustomPattern {
    const state = _getInstrumentState(instrument);
    if ('id' in pattern && pattern.id) {
        const index = state.customPatterns.findIndex(p => p.id === pattern.id);
        if (index > -1) state.customPatterns[index] = pattern;
        else state.customPatterns.push(pattern);
        _debouncedPersist();
        return pattern;
    } else {
        const newPattern = { ...pattern, id: `custom_pattern_${Date.now()}` } as CustomPattern;
        state.customPatterns.push(newPattern);
        _debouncedPersist();
        return newPattern;
    }
}
export function deleteCustomPattern(id: string, instrument: 'guitar' | 'ukulele') {
    const state = _getInstrumentState(instrument);
    state.customPatterns = state.customPatterns.filter(p => p.id !== id);
    _debouncedPersist();
}

// Songs
export function getSavedSongs(instrument: 'guitar' | 'ukulele'): SavedSong[] {
    return _getInstrumentState(instrument).songs;
}
export function saveSong(song: Omit<SavedSong, 'id'>, instrument: 'guitar' | 'ukulele'): SavedSong {
    const newSong: SavedSong = { ...song, id: `song_${Date.now()}` };
    _getInstrumentState(instrument).songs.push(newSong);
    _debouncedPersist();
    return newSong;
}
export function deleteSong(id: string, instrument: 'guitar' | 'ukulele') {
    const state = _getInstrumentState(instrument);
    state.songs = state.songs.filter(s => s.id !== id);
    _debouncedPersist();
}
export function importSongs(importedSongs: any[], instrument: 'guitar' | 'ukulele'): number {
    const state = _getInstrumentState(instrument);
    const existingSongKeys = new Set(state.songs.map(s => `${s.name}|${JSON.stringify(s.structure)}`));
    let newSongsAdded = 0;

    importedSongs.forEach(importedSong => {
        if (importedSong && typeof importedSong.name === 'string' && Array.isArray(importedSong.structure)) {
            const importKey = `${importedSong.name}|${JSON.stringify(importedSong.structure)}`;
            if (!existingSongKeys.has(importKey)) {
                state.songs.push({
                    name: importedSong.name,
                    structure: importedSong.structure,
                    id: `song_${Date.now()}_${Math.random().toString(36).substring(2)}`
                });
                existingSongKeys.add(importKey);
                newSongsAdded++;
            }
        }
    });

    if (newSongsAdded > 0) _debouncedPersist();
    return newSongsAdded;
}

// Color Settings
export function getColorSettings(instrument: 'guitar' | 'ukulele'): ColorSettings {
    return { ...DEFAULT_COLOR_SETTINGS, ..._getInstrumentState(instrument).colorSettings };
}
export function saveColorSettings(settings: ColorSettings, instrument: 'guitar' | 'ukulele') {
    _getInstrumentState(instrument).colorSettings = settings;
    _debouncedPersist();
}
export function resetColorSettings(instrument: 'guitar' | 'ukulele') {
    _getInstrumentState(instrument).colorSettings = { ...DEFAULT_COLOR_SETTINGS };
    _debouncedPersist();
}

// Background Color
export function getBackgroundColor(instrument: 'guitar' | 'ukulele'): string | null {
    return _getInstrumentState(instrument).backgroundColor;
}
export function saveBackgroundColor(color: string, instrument: 'guitar' | 'ukulele') {
    _getInstrumentState(instrument).backgroundColor = color;
    _debouncedPersist();
}
export function resetBackgroundColor(instrument: 'guitar' | 'ukulele') {
    _getInstrumentState(instrument).backgroundColor = null;
    _debouncedPersist();
}

// Arranger State
export function getArrangerState(instrument: 'guitar' | 'ukulele'): SongSection[] {
    return _getInstrumentState(instrument).arrangerState;
}
export function saveArrangerState(structure: SongSection[], instrument: 'guitar' | 'ukulele') {
    _getInstrumentState(instrument).arrangerState = structure;
    _debouncedPersist();
}

// Backup/Restore
export function createFullStateSnapshot(): FullStateSnapshot {
    // Return a deep copy to prevent accidental mutation of the in-memory state
    return JSON.parse(JSON.stringify(_getState()));
}
export function applyFullStateSnapshot(snapshot: FullStateSnapshot) {
    // This is a legacy function for the initial load. Use restoreFromBackup for file-based restore.
    _inMemoryState = snapshot;
    _persistState();
}