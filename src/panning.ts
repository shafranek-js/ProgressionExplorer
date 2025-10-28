/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { treeContainer, treeCanvas, connectionsSVG } from './dom';

let currentZoom = 1.0;
let targetZoom = 1.0;
let animationFrameId: number | null = null;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.0;
const ZOOM_SENSITIVITY = 0.005;
const ZOOM_STEP = 0.2;
const SMOOTHING_FACTOR = 0.25;

/**
 * Returns the current zoom level of the tree canvas.
 */
export function getCurrentZoom(): number {
    return currentZoom;
}

/** Applies the current zoom level as a transform. */
const applyTransform = () => {
    if (!treeCanvas || !connectionsSVG) return;
    const transform = `scale(${currentZoom})`;
    treeCanvas.style.transform = transform;
    connectionsSVG.style.transform = transform;
    // Set origin to top-left for predictable scroll calculations
    treeCanvas.style.transformOrigin = '0 0';
    connectionsSVG.style.transformOrigin = '0 0';
};

/** The animation loop for smoothing the zoom. */
const smoothZoomUpdate = () => {
    // Interpolate the current zoom towards the target
    currentZoom += (targetZoom - currentZoom) * SMOOTHING_FACTOR;
    
    applyTransform();

    // If we are close enough to the target, stop the animation
    if (Math.abs(targetZoom - currentZoom) < 0.001) {
        currentZoom = targetZoom; // Snap to final value
        applyTransform();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    } else {
        // Continue the animation
        animationFrameId = requestAnimationFrame(smoothZoomUpdate);
    }
};

/** Zooms in towards the center of the viewport. */
export function zoomIn() {
    if (!treeContainer) return;

    const rect = treeContainer.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const contentX = (treeContainer.scrollLeft + centerX) / currentZoom;
    const contentY = (treeContainer.scrollTop + centerY) / currentZoom;

    // Base the next zoom step on the current *target* if an animation is in progress
    const baseZoom = animationFrameId ? targetZoom : currentZoom;
    targetZoom = Math.min(MAX_ZOOM, baseZoom + ZOOM_STEP);

    const newScrollLeft = contentX * targetZoom - centerX;
    const newScrollTop = contentY * targetZoom - centerY;

    treeContainer.scrollLeft = newScrollLeft;
    treeContainer.scrollTop = newScrollTop;

    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(smoothZoomUpdate);
    }
}

/** Zooms out from the center of the viewport. */
export function zoomOut() {
    if (!treeContainer) return;

    const rect = treeContainer.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const contentX = (treeContainer.scrollLeft + centerX) / currentZoom;
    const contentY = (treeContainer.scrollTop + centerY) / currentZoom;
    
    const baseZoom = animationFrameId ? targetZoom : currentZoom;
    targetZoom = Math.max(MIN_ZOOM, baseZoom - ZOOM_STEP);

    const newScrollLeft = contentX * targetZoom - centerX;
    const newScrollTop = contentY * targetZoom - centerY;
    
    treeContainer.scrollLeft = newScrollLeft;
    treeContainer.scrollTop = newScrollTop;
    
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(smoothZoomUpdate);
    }
}

/**
 * Enables panning and zooming on the tree container.
 * Supports mouse drag, touch drag, and a smooth, animated mouse wheel zoom.
 */
export function enablePanning(): void {
    if (!treeContainer || !treeCanvas || !connectionsSVG) return;

    // --- Panning State ---
    let isPanning = false, startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0;
    
    // Apply initial transform
    applyTransform();

    // --- Panning Logic ---
    const onMouseDown = (e: MouseEvent) => {
        const isLeftClick = e.button === 0;
        if (!isLeftClick) return;
        // Don't pan if clicking on a chord node
        if (e.target instanceof Element && e.target.closest('.chord-node')) return;
        
        e.preventDefault();
        isPanning = true;
        treeContainer.classList.add('panning');
        startX = e.pageX - treeContainer.offsetLeft;
        startY = e.pageY - treeContainer.offsetTop;
        scrollLeft = treeContainer.scrollLeft;
        scrollTop = treeContainer.scrollTop;
    };

    const onMouseUp = () => {
        if (isPanning) {
            isPanning = false;
            treeContainer.classList.remove('panning');
        }
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isPanning) return;
        e.preventDefault();
        const x = e.pageX - treeContainer.offsetLeft;
        const y = e.pageY - treeContainer.offsetTop;
        const walkX = (x - startX);
        const walkY = (y - startY);
        treeContainer.scrollLeft = scrollLeft - walkX;
        treeContainer.scrollTop = scrollTop - walkY;
    };

    // --- Zooming Logic (updated for smoothness and intelligent origin) ---
    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        
        const rect = treeContainer.getBoundingClientRect();
        
        // Position of the mouse inside the container viewport
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // The point on the un-zoomed content that is under the mouse.
        // We use currentZoom here to get the correct point before changing the zoom level.
        const contentX = (treeContainer.scrollLeft + mouseX) / currentZoom;
        const contentY = (treeContainer.scrollTop + mouseY) / currentZoom;
        
        // Update the target zoom level. The deltaY gives proportional zoom speed.
        const zoomDelta = e.deltaY * -ZOOM_SENSITIVITY;
        targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom + zoomDelta));
        
        // Calculate the new scroll position to keep the content point under the mouse.
        // This scroll is applied instantly for a responsive feel as the zoom animates.
        const newScrollLeft = contentX * targetZoom - mouseX;
        const newScrollTop = contentY * targetZoom - mouseY;

        treeContainer.scrollLeft = newScrollLeft;
        treeContainer.scrollTop = newScrollTop;

        // Start the smooth zoom animation if it's not already running.
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(smoothZoomUpdate);
        }
    };


    // --- Event Listeners ---
    treeContainer.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp); // Listen on window to catch mouseup outside the container
    window.addEventListener('mousemove', onMouseMove); // Listen on window to allow dragging outside
    treeContainer.addEventListener('wheel', onWheel, { passive: false });


    // --- Touch support (panning only) ---
    let touchId: number | null = null;

    treeContainer.addEventListener('touchstart', (e: TouchEvent) => {
        if (touchId !== null) return; // Already tracking a touch
        if (e.target instanceof Element && e.target.closest('.chord-node')) return;
        
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        isPanning = true;
        startX = touch.pageX - treeContainer.offsetLeft;
        startY = touch.pageY - treeContainer.offsetTop;
        scrollLeft = treeContainer.scrollLeft;
        scrollTop = treeContainer.scrollTop;
    }, { passive: true });

    treeContainer.addEventListener('touchmove', (e: TouchEvent) => {
        if (!isPanning) return;
        // Find the touch we are tracking
        for (const touch of Array.from(e.changedTouches)) {
            if (touch.identifier === touchId) {
                const x = touch.pageX - treeContainer.offsetLeft;
                const y = touch.pageY - treeContainer.offsetTop;
                const walkX = (x - startX);
                const walkY = (y - startY);
                treeContainer.scrollLeft = scrollLeft - walkX;
                treeContainer.scrollTop = scrollTop - walkY;
                break;
            }
        }
    }, { passive: true });

    const onTouchEnd = (e: TouchEvent) => {
        for (const touch of Array.from(e.changedTouches)) {
            if (touch.identifier === touchId) {
                touchId = null;
                isPanning = false;
                break;
            }
        }
    };
    
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
}

/** Resets zoom to default and stops any animation. */
export function resetZoom() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    targetZoom = 1.0;
    currentZoom = 1.0;
    applyTransform();
}