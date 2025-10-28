/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { progressionSelect, saveProgressionModal, progressionNameInput, savedProgressionsList, saveSongModal, songNameInput, savedSongsList } from '../dom';
import { populateProgressionSelector } from '../ui-helpers';
import { logger } from '../logger';
import { deleteProgression, getSavedProgressions, saveProgression, importProgressions, FullStateSnapshot, createFullStateSnapshot, saveSong, getSavedSongs, deleteSong, importSongs, getSavedInstrument, saveWorkspaceState, restoreFromBackup } from '../storage';
import { exportProgressionToMidi as exportToMidi } from '../midi';
import { SongSection } from '../types';
import { getSongStructure, openSongArrangerModal, setSongStructure } from '../song-arranger';
import { renderSongInTree } from '../tree';
import { getCurrentWorkspaceState, loadStateForInstrument } from '../workspace';


let progressionToSave: { tonic: string, chords: string[] } | null = null;
let songToSave: { structure: SongSection[] } | null = null;

/**
 * Populates the list of saved progressions within the manage modal, making them loadable.
 */
export function populateSavedProgressionsList() {
    savedProgressionsList.innerHTML = '';
    const instrument = getSavedInstrument();
    if (!instrument) return;
    const progressions = getSavedProgressions(instrument);
    if (progressions.length === 0) {
        savedProgressionsList.innerHTML = `<p class="text-gray-400 text-sm">No progressions saved yet.</p>`;
        return;
    }
    
    progressions.forEach(prog => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between bg-gray-700 px-2 py-1 rounded';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-medium cursor-pointer hover:text-blue-400 transition-colors flex-grow';
        nameSpan.textContent = prog.name;
        nameSpan.title = `Load "${prog.name}"`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-red-400 hover:text-red-300 transition-colors text-sm font-semibold ml-4 flex-shrink-0';
        deleteBtn.textContent = 'Delete';
        
        item.appendChild(nameSpan);
        item.appendChild(deleteBtn);
        savedProgressionsList.appendChild(item);
        
        // Add click listener to load the progression
        nameSpan.addEventListener('click', () => {
            logger.action(`Loading progression: '${prog.name}'`);
            // Ensure the progression exists in the dropdown before trying to load it
            if (Array.from(progressionSelect.options).some(opt => opt.value === prog.id)) {
                progressionSelect.value = prog.id;
                progressionSelect.dispatchEvent(new Event('change'));
            } else {
                logger.error(`Could not find saved progression '${prog.name}' in the dropdown.`);
                alert('An error occurred while loading the progression.');
            }
        });

        // Add click listener for the delete button
        deleteBtn.addEventListener('click', () => {
            const instrument = getSavedInstrument();
            if (!instrument) return;
            logger.action(`Deleting progression: '${prog.name}'`);
            deleteProgression(prog.id, instrument);
            populateSavedProgressionsList(); // Refresh list in modal
            populateProgressionSelector(); // Refresh dropdown
        });
    });
}

/**
 * Opens the modal to save a progression, collecting the current path data.
 */
export function openSaveProgressionModal() {
    const highlightedNodes = Array.from(document.querySelectorAll('.chord-node.highlighted')) as HTMLElement[];
    if (highlightedNodes.length < 2) {
        alert("Please select a progression of at least two chords to save.");
        return;
    }
    highlightedNodes.sort((a, b) => parseInt(a.dataset.level!) - parseInt(b.dataset.level!));
    
    const chords = highlightedNodes.map(node => node.dataset.chord!);
    const tonic = highlightedNodes[0].dataset.chord!;
    progressionToSave = { tonic, chords };

    const defaultName = chords.join(' - ');
    progressionNameInput.value = defaultName; // Pre-populate with chord names
    
    logger.info('Opened save progression modal.');
    saveProgressionModal.classList.remove('hidden');
    setTimeout(() => saveProgressionModal.classList.add('active'), 10);
}

/** Closes the save progression modal. */
export function closeSaveProgressionModal() {
    saveProgressionModal.classList.remove('active');
    setTimeout(() => saveProgressionModal.classList.add('hidden'), 300);
}


/** Handles the confirmation of saving a progression. */
export function handleConfirmSave() {
    const name = progressionNameInput.value.trim();
    if (!name) {
        alert('Please enter a name for the progression.');
        return;
    }
    if (!progressionToSave) {
        alert('No progression data to save. Please select a progression first.');
        return;
    }
    
    const instrument = getSavedInstrument();
    if (!instrument) return;
    logger.action(`Saving progression: '${name}'`);
    saveProgression({
        name,
        tonic: progressionToSave.tonic,
        chords: progressionToSave.chords,
    }, instrument);
    
    populateProgressionSelector();
    closeSaveProgressionModal();
}


/** Exports all saved progressions to a JSON file. */
export function handleExportProgressions() {
    const instrument = getSavedInstrument();
    if (!instrument) return;
    const progressions = getSavedProgressions(instrument);
    if (progressions.length === 0) {
        alert("There are no progressions to export.");
        return;
    }

    // Exclude the 'id' field, as it will be regenerated on import.
    const exportableProgressions = progressions.map(({ id, ...rest }) => rest);

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportableProgressions, null, 2));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `chord_progressions_${instrument}.json`);
    document.body.appendChild(downloadAnchorNode); // Required for Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    logger.action(`Exported all ${instrument} progressions.`);
}


/** Handles the file selection for importing progressions. */
export function handleImportProgressions(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
        return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    const instrument = getSavedInstrument();
    if (!instrument) return;
    logger.action(`Attempting to import progressions from '${file.name}' for ${instrument}.`);

    reader.onload = (e) => {
        try {
            const content = e.target?.result;
            if (typeof content !== 'string') {
                 throw new Error("File content could not be read as text.");
            }
            const importedData = JSON.parse(content);
            const numAdded = importProgressions(importedData, instrument);

            if (numAdded > 0) {
                logger.info(`${numAdded} new progression(s) imported successfully!`);
                alert(`${numAdded} new progression(s) imported successfully!`);
                populateSavedProgressionsList();
                populateProgressionSelector();
            } else {
                logger.info("Import complete. No new progressions were added (duplicates).");
                alert("Import complete. No new progressions were added (they may have been duplicates of existing ones).");
            }

        } catch (error) {
            logger.error("Error importing progressions:", error);
            console.error("Error importing progressions:", error);
            alert("Import failed. Please make sure the file is a valid JSON export from this application.");
        } finally {
            // Reset the input value to allow importing the same file again if needed
            input.value = '';
        }
    };

    reader.onerror = () => {
        logger.error("An error occurred while reading the import file.");
        alert("An error occurred while reading the file.");
        input.value = '';
    };

    reader.readAsText(file);
}

/** Handles the click event for exporting the current progression to a MIDI file. */
export function handleMidiExportClick() {
    logger.action('MIDI export initiated.');
    const highlightedNodes = Array.from(document.querySelectorAll('.chord-node.highlighted')) as HTMLElement[];
    if (highlightedNodes.length < 2) {
        alert("Please select a sequence of at least two chords to export.");
        return;
    }
    highlightedNodes.sort((a, b) => parseInt(a.dataset.level!) - parseInt(b.dataset.level!));
    
    const progressionForMidi = highlightedNodes.map(node => ({
        chord: node.dataset.chord!,
        voicingIndex: parseInt(node.dataset.voicingIndex || '0', 10),
        strumPatternId: node.dataset.strumPatternId,
        arpeggioPatternId: node.dataset.arpeggioPatternId,
    }));
    
    exportToMidi(progressionForMidi);
}


/** Populates the list of saved songs within the manage modal. */
export function populateSavedSongsList() {
    savedSongsList.innerHTML = '';
    const instrument = getSavedInstrument();
    if (!instrument) return;
    const songs = getSavedSongs(instrument);
    if (songs.length === 0) {
        savedSongsList.innerHTML = `<p class="text-gray-400 text-sm">No songs saved yet.</p>`;
        return;
    }
    
    songs.forEach(song => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between bg-gray-700 px-2 py-1 rounded';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-medium cursor-pointer hover:text-blue-400 transition-colors flex-grow';
        nameSpan.textContent = song.name;
        nameSpan.title = `Load "${song.name}"`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-red-400 hover:text-red-300 transition-colors text-sm font-semibold ml-4 flex-shrink-0';
        deleteBtn.textContent = 'Delete';
        
        item.appendChild(nameSpan);
        item.appendChild(deleteBtn);
        savedSongsList.appendChild(item);
        
        // Add click listener to load the song
        nameSpan.addEventListener('click', () => {
            logger.action(`Loading song: '${song.name}'`);
            setSongStructure(song.structure);
            openSongArrangerModal();
            renderSongInTree(song);
        });

        // Add click listener for the delete button
        deleteBtn.addEventListener('click', () => {
            const instrument = getSavedInstrument();
            if (!instrument) return;
            logger.action(`Deleting song: '${song.name}'`);
            deleteSong(song.id, instrument);
            populateSavedSongsList(); // Refresh list
        });
    });
}

/** Opens the modal to save the current song arrangement. */
export function openSaveSongModal() {
    const structure = getSongStructure();
    if (structure.length === 0) {
        alert("There is nothing in the song arranger to save.");
        return;
    }
    songToSave = { structure };
    songNameInput.value = '';
    
    logger.info('Opened save song modal.');
    saveSongModal.classList.remove('hidden');
    setTimeout(() => saveSongModal.classList.add('active'), 10);
}

/** Closes the save song modal. */
export function closeSaveSongModal() {
    saveSongModal.classList.remove('active');
    setTimeout(() => saveSongModal.classList.add('hidden'), 300);
}

/** Handles the confirmation of saving a song. */
export function handleConfirmSaveSong() {
    const name = songNameInput.value.trim();
    if (!name) {
        alert('Please enter a name for the song.');
        return;
    }
    if (!songToSave) {
        alert('No song data to save.');
        return;
    }
    
    const instrument = getSavedInstrument();
    if (!instrument) return;
    logger.action(`Saving song: '${name}'`);
    saveSong({
        name,
        structure: songToSave.structure,
    }, instrument);
    
    closeSaveSongModal();
}

/** Exports all saved songs to a JSON file. */
export function handleExportSongs() {
    const instrument = getSavedInstrument();
    if (!instrument) return;
    const songs = getSavedSongs(instrument);
    if (songs.length === 0) {
        alert("There are no songs to export.");
        return;
    }

    const exportableSongs = songs.map(({ id, ...rest }) => rest);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportableSongs, null, 2));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `songs_${instrument}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    logger.action(`Exported all ${instrument} songs.`);
}

/** Handles the file selection for importing songs. */
export function handleImportSongs(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    const instrument = getSavedInstrument();
    if (!instrument) return;
    logger.action(`Attempting to import songs from '${file.name}' for ${instrument}.`);

    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const importedData = JSON.parse(content);
            const numAdded = importSongs(importedData, instrument);
            alert(`${numAdded} new song(s) imported successfully!`);
            populateSavedSongsList();
        } catch (error) {
            logger.error("Error importing songs:", error);
            alert("Import failed. Please make sure the file is a valid JSON export.");
        } finally {
            input.value = '';
        }
    };
    reader.readAsText(file);
}

/** Saves a snapshot of the entire application state to a file. */
export function handleSaveAllStates() {
    // Save the current UI state before creating the snapshot
    const instrument = getSavedInstrument();
    if (instrument) {
        const currentState = getCurrentWorkspaceState();
        saveWorkspaceState(currentState, instrument);
    }
    
    const fullState = createFullStateSnapshot();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState, null, 2));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `chord_explorer_backup.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    logger.action(`Exported all application states.`);
}

/** Loads and applies a full application state snapshot from a file without reloading the page. */
export function handleLoadAllStates(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const content = e.target?.result as string;
            const snapshot = JSON.parse(content) as FullStateSnapshot;

            // Basic validation
            if (snapshot.guitar && snapshot.ukulele) {
                // Restore the state in-memory and in the database
                await restoreFromBackup(snapshot);
                
                // Trigger a full UI re-render from the newly loaded state
                const instrumentToLoad = getSavedInstrument() || 'guitar'; // Fallback to guitar
                loadStateForInstrument(instrumentToLoad);
                
                alert('Workspace restored successfully!');
                logger.action("Workspace restored successfully from file.");

            } else {
                 throw new Error("Invalid snapshot file format.");
            }
        } catch (error) {
            logger.error("Error loading states:", error);
            alert("Load failed. Please make sure the file is a valid JSON backup from this application.");
        } finally {
            input.value = '';
        }
    };
    reader.readAsText(file);
}