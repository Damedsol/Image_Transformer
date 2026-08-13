import "./style.css";
import "./components/TnIcon";
import "./components/DropZone";
import "./components/ImagePreview";
import "./components/ConversionOptions";
import "./components/ImageConverter";
import "./utils/api";
import { setupOfflineDetection } from "./utils/serviceWorkerRegistration";
import { isTouchDevice, announceToScreenReader } from "./utils/a11y";

/**
 * Sets up touch event detection to improve UX
 */
function setupTouchDetection() {
	// Detect if device is touch-enabled
	function updateTouchClass() {
		if (isTouchDevice()) {
			document.body.classList.add("touch-device");
		} else {
			document.body.classList.remove("touch-device");
		}
	}

	// Update on load
	updateTouchClass();

	// Listen for changes (e.g., when connecting/disconnecting devices)
	window.addEventListener("resize", updateTouchClass);
}

/**
 * Sets up status announcements for screen readers
 */
function setupScreenReaderAnnouncer() {
	const statusAnnouncer = document.getElementById("status-announcer");

	if (statusAnnouncer) {
		// Check for errors during initial load
		window.addEventListener("error", (e) => {
			announceToScreenReader(`Application error: ${e.message}`);
		});

		// Announce when application is fully loaded
		window.addEventListener("load", () => {
			announceToScreenReader(
				"Image conversion application loaded successfully. You can start using the converter.",
			);
		});
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const app = document.getElementById("app");

	if (app) {
		app.innerHTML = `
      <image-converter></image-converter>
    `;

		// Set up UX helpers
		setupTouchDetection();
		setupScreenReaderAnnouncer();

		// Set up connection status detection
		setupOfflineDetection();
	}
});
