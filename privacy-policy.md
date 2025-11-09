```markdown
# Privacy Policy for SLACTAC

SLACTAC is a browser extension for Chrome, Edge, Brave, and Firefox that allows users to override Slack channel names in their browser.

## What data we collect

SLACTAC does **not collect**, transmit, or process any personal or sensitive user data.
All data is stored locally using the browser's storage API (`browser.storage` / `chrome.storage`) and is only accessible to the extension itself.

## Permissions

SLACTAC requests access to:
- `https://app.slack.com/*` – in order to display and override channel names inside the Slack web UI.
- `storage` – to persist user-defined overrides across sessions.
- `activeTab` and `tabs` – to communicate between the extension popup and Slack page for the channel picker feature.

These permissions are used **solely for functionality** and never for tracking or external data collection.

## Data Storage

- **Chrome/Edge/Brave**: Data is stored using `chrome.storage.sync` with fallback to local storage
- **Firefox**: Data is stored using `browser.storage` with automatic fallback between sync and local storage

All stored data remains on your device and is never sent to external servers.

## Third-party sharing

SLACTAC does not share any information with third parties.

## Contact

If you have any concerns, please open an issue at:
[https://github.com/dotMavriQ/Slactac/issues](https://github.com/dotMavriQ/Slactac/issues)

```
