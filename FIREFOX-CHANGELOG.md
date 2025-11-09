# Firefox Compatibility Changes

## Summary
SlacTac now uses WebExtension `browser.*` API across all browsers (Firefox, Chrome, Edge, Brave).

## Changes Made

### manifest.json
- Added `host_permissions: ["https://app.slack.com/*"]`
- Added Firefox config: `browser_specific_settings.gecko`
- Reordered content scripts: `compat.js` loads first

### compat.js
- Creates `browser` global from `chrome` (polyfill for Chromium)
- Firefox uses native `browser` API directly

### storage.js
- Changed from callbacks to Promises
- All `chrome.storage.*` → `browser.storage.*`
- Maintains sync → local storage fallback

### content.js
- `chrome.runtime.onMessage` → `browser.runtime.onMessage`
- `chrome.storage.local.*` → `browser.storage.local.*` (Promises)

### popup.js
- `chrome.tabs.query()` → `browser.tabs.query()` (Promises)
- `chrome.tabs.sendMessage()` → `browser.tabs.sendMessage()` (Promises)
- `chrome.storage.*` → `browser.storage.*` (Promises)

### popup.html
- Added `<script src="compat.js" defer></script>` before other scripts

## Browser Support

| Browser | Min Version | Status |
|---------|---|--------|
| Firefox | 121.0 | ✅ Full |
| Chrome | 88+ | ✅ Full |
| Edge | 88+ | ✅ Full |
| Brave | 1.44+ | ✅ Full |

## API Migration

**Before (Chrome only):**
```javascript
chrome.storage.sync.get(key, callback)
chrome.tabs.query(options, callback)
```

**After (All browsers):**
```javascript
browser.storage.sync.get(key).then(success, error)
browser.tabs.query(options).then(tabs, error)
```

## Backwards Compatibility
✅ 100% - Chrome/Edge/Brave users experience zero changes.
