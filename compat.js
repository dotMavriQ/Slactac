// Normalize browser APIs for cross-browser compatibility
// Firefox: uses browser.* (WebExtension native API)
// Chrome/Edge: uses chrome.* (needs normalization)

if (typeof globalThis.browser === "undefined") {
  if (typeof globalThis.chrome !== "undefined" && globalThis.chrome.runtime) {
    globalThis.browser = globalThis.chrome;
  }
}

// Ensure browser object exists as a fallback
if (typeof globalThis.browser === "undefined") {
  console.warn("SLACTAC: No browser or chrome API available. This extension may not work correctly.");
}
