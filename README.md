# Slactac

![Slactac Logo](https://raw.githubusercontent.com/dotMavriQ/Slactac/refs/heads/master/icons/icon128.png)

**Slactac** is a browser extension that lets you persistently override and customize Slack channel names. Personalize your workspace by renaming channels to something more meaningful or easier to recognize. *(Note: user renaming is not supported yet.)*

**Now available for Chrome, Edge, Brave, and Firefox!**

---

## ✅ Installation

### Chrome Web Store (Chrome, Edge, Brave)

Install directly from the Chrome Web Store:

[https://chromewebstore.google.com/detail/slactac/gnjiocbockjlkpnlonimgihcbhpdephe](https://chromewebstore.google.com/detail/slactac/gnjiocbockjlkpnlonimgihcbhpdephe)

If you find **Slactac** useful, please consider leaving a rating or short review. Any feedback helps support development and improves the extension for everyone. Obrigado!

### Firefox

Download the Firefox release from [GitHub Releases](https://github.com/dotMavriQ/Slactac/releases):

1. Download `slactac_firefox-vX.X.X.zip` from the latest Firefox release
2. Extract the ZIP file
3. Open Firefox and go to `about:debugging#/runtime/this-firefox`
4. Click **Load Temporary Add-on**
5. Select the `manifest.json` from the extracted folder

---

## Features

- Override Slack channel names.
- Use the channel picker to grab channel names directly from the Slack UI.
- Save, view, and manage custom channel names via a polished popup interface.
- Real-time updates on the Slack web app with persistent overrides across sessions.

### Manual Installation (Chrome, Edge, Brave)

1. Clone or download this repository.
2. Open Chrome, Edge, or Brave and browse to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
3. Enable **Developer Mode** in the top-right corner.
4. Click **Load unpacked** and select the `slactac` folder.

**Note:** Edge and Brave may ask you to review the requested permissions (`tabs`, `activeTab`, and `storage`). These are required for the channel picker and for updating the active Slack tab reliably. If you do not see your Slack workspace update immediately, ensure the Slack tab is focused and refreshed once after installing the extension.

## Installation (Manual)

## Releases

Every push to the `master` and `firefox` branches triggers automated builds:

- **Chrome/Edge/Brave**: Tagged releases on `master` branch create `slactac_chrome-vX.X.X.zip`
- **Firefox**: Tagged releases on `firefox` branch create `slactac_firefox-vX.X.X.zip` (auto-bumped +0.0.1)

Both are available as GitHub release assets. Download the appropriate ZIP for your browser or submit to the respective store catalogues.

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
