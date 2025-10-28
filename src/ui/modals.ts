/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    colorSettingsModal, logModal, appearanceSettingsModal, librariesModal, helpModal,
    colorPrimaryInput, colorSecondaryInput, colorBorrowedInput,
    colorTenseInput, colorSecondaryDominantInput,
} from '../dom';
import { getColorSettings, getSavedInstrument } from '../storage';
import { renderLog } from '../features/logging';


/** Opens the modal for changing chord color settings. */
export function openColorSettingsModal() {
    const instrument = getSavedInstrument();
    if (!instrument) return;
    const settings = getColorSettings(instrument);
    colorPrimaryInput.value = settings.primary;
    colorSecondaryInput.value = settings.secondary;
    colorBorrowedInput.value = settings.borrowed;
    colorTenseInput.value = settings.tense;
    colorSecondaryDominantInput.value = settings.secondaryDominant;
    
    colorSettingsModal.classList.remove('hidden');
    setTimeout(() => colorSettingsModal.classList.add('active'), 10);
}

/** Closes the color settings modal. */
export function closeColorSettingsModal() {
    colorSettingsModal.classList.remove('active');
    setTimeout(() => colorSettingsModal.classList.add('hidden'), 300);
}


/** Opens the application log modal. */
export function openLogModal() {
    renderLog();
    logModal.classList.remove('hidden');
    setTimeout(() => logModal.classList.add('active'), 10);
}

/** Closes the application log modal. */
export function closeLogModal() {
    logModal.classList.remove('active');
    setTimeout(() => logModal.classList.add('hidden'), 300);
}


/** Opens the main settings modal. */
export function openSettingsModal() {
    appearanceSettingsModal.classList.remove('hidden');
    setTimeout(() => appearanceSettingsModal.classList.add('active'), 10);
}

/** Closes the main settings modal. */
export function closeSettingsModal() {
    appearanceSettingsModal.classList.remove('active');
    setTimeout(() => appearanceSettingsModal.classList.add('hidden'), 300);
}


/** Opens the libraries modal. */
export function openLibrariesModal() {
    librariesModal.classList.remove('hidden');
    setTimeout(() => librariesModal.classList.add('active'), 10);
}

/** Closes the libraries modal. */
export function closeLibrariesModal() {
    librariesModal.classList.remove('active');
    setTimeout(() => librariesModal.classList.add('hidden'), 300);
}


/** Opens the help modal. */
export function openHelpModal() {
    helpModal.classList.remove('hidden');
    setTimeout(() => helpModal.classList.add('active'), 10);
}

/** Closes the help modal. */
export function closeHelpModal() {
    helpModal.classList.remove('active');
    setTimeout(() => helpModal.classList.add('hidden'), 300);
}