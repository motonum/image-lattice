// Vitest / Testing Library setup file
// - Adds jest-dom matchers
// - Provides small DOM polyfills (e.g. matchMedia) used by some components
import "@testing-library/jest-dom";

// Minimal matchMedia polyfill for JSDOM-based tests
if (typeof window !== "undefined" && !window.matchMedia) {
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
}

// Optional: stub window.scrollTo to avoid errors in some components
if (typeof window !== "undefined" && !window.scrollTo) {
	// @ts-ignore
	window.scrollTo = () => {};
}
