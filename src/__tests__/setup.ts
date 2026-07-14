/**
 * Test setup — runs before each test file in jsdom environment.
 * Provides polyfills and mocks for browser APIs not implemented in JSDOM.
 */

// Polyfill for matchMedia (needed by prefersDarkMode, prefersReducedMotion)
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	}),
});

// Polyfill for getComputedStyle (needed by CSS custom properties resolution)
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (element: Element, pseudoElt?: string | null) => {
	const style = originalGetComputedStyle(element, pseudoElt ?? null);
	return style;
};

// Clean up any leftover elements between tests
afterEach(() => {
	const app = document.getElementById("app");
	if (app) {
		app.innerHTML = "";
	}
	document.body.innerHTML = "";
});
