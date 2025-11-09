```markdown
# Slactac

![Slactac Logo](https://raw.githubusercontent.com/dotMavriQ/Slactac/refs/heads/master/icons/icon128.png)

**Slactac** is a browser extension that lets you persistently override and customize Slack channel names. Available for Chromium-based browsers (Chrome, Microsoft Edge, Brave, etc.) and **Firefox**. Personalize your workspace by renaming channels to something more meaningful or easier to recognize. *(Note: user renaming is not supported yet.)*

---

## 🎉 Now Available on Multiple Platforms!

### Chrome Web Store
Install **Slactac** directly from the Chrome Web Store:

[https://chromewebstore.google.com/detail/slactac/gnjiocbockjlkpnlonimgihcbhpdephe](https://chromewebstore.google.com/detail/slactac/gnjiocbockjlkpnlonimgihcbhpdephe)

### Firefox
For Firefox users, see the [Firefox Setup Guide](./FIREFOX-SETUP.md) for detailed installation instructions.

---

If you find **Slactac** useful, please consider leaving a rating or short review on the Chrome Web Store. Any feedback helps support development and improves the extension for everyone. Obrigado!

---

## Features

- Override Slack channel names on any platform
- Use the channel picker to grab channel names directly from the Slack UI
- Save, view, and manage custom channel names via a polished popup interface
- Real-time updates on the Slack web app with persistent overrides across sessions
- Cross-browser support: Chrome, Edge, Brave, and Firefox

## Installation

### Chrome/Edge/Brave (Manual Installation)

1. Clone or download this repository
2. Open your browser's extensions page:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Brave**: `brave://extensions/`
3. Enable **Developer Mode** in the top-right corner
4. Click **Load unpacked** and select the `slactac` folder

### Firefox (Manual Installation)

See the [Firefox Setup Guide](./FIREFOX-SETUP.md) for detailed instructions on installing on Firefox.

### Microsoft Edge notes

- Edge may ask you to review the requested permissions (`tabs`, `activeTab`, and `storage`). These are required for the channel picker and for updating the active Slack tab reliably.
- If you do not see your Slack workspace update immediately, ensure the Slack tab is focused and refreshed once after installing the extension.

### Firefox notes

- Firefox requires Firefox 121.0 or later for full compatibility
- Data is stored securely using Firefox's WebExtension Storage API
- For detailed setup instructions, see [FIREFOX-SETUP.md](./FIREFOX-SETUP.md)

## Releases

Every push to `master` (and any release you publish) triggers a workflow that bundles the extension into `slactac-v<version>.zip`. The package is uploaded as a workflow artifact, and the same archive is attached to release assets when a GitHub release is created. Download that zip to load the extension unpacked or submit it to the Chrome Web Store / Microsoft Edge Add-ons catalogue / Firefox Add-ons store.

## Usage

1. Click the **Slactac** icon in your browser toolbar to open the popup.
2. Use the **Pick Channel** button or manually enter the **Original Slack Channel Name**.
3. Enter your desired custom channel name in the **Your Custom Channel Name** field.
4. Click **Save Tack** to apply the override—the Slack channel name will update in real time.
5. To view or delete stored overrides, click the **Stored Tacks** button.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests for new features, bug fixes, or improvements.

## License

This project is licensed under the MIT License.
```
