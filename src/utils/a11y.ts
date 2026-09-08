/**
 * Utilities to improve accessibility in the application
 */

/**
 * Detects if the device is touch-enabled
 */
export function isTouchDevice(): boolean {
	return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Announces a message to screen readers
 * @param message Message to announce
 * @param element Element where to announce (defaults to #status-announcer)
 */
export function announceToScreenReader(
	message: string,
	element?: HTMLElement,
): void {
	const announcer = element || document.getElementById("status-announcer");
	if (announcer) {
		announcer.textContent = message;
	}
}
