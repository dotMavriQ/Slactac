# Slactac

![Slactac Logo](https://raw.githubusercontent.com/dotMavriQ/Slactac/refs/heads/master/icons/icon128.png)

**Slactac** is a browser extension for Chromium-based browsers (Chrome, Microsoft Edge, Brave, etc.) that lets you persistently override and customize Slack channel names. Personalize your workspace by renaming channels to something more meaningful or easier to recognize. *(Note: user renaming is not supported yet.)*

---

## ✅ Now Available on the Chrome Web Store!

You can install **Slactac** directly from the Chrome Web Store:

[https://chromewebstore.google.com/detail/slactac/gnjiocbockjlkpnlonimgihcbhpdephe](https://chromewebstore.google.com/detail/slactac/gnjiocbockjlkpnlonimgihcbhpdephe)

If you find **Slactac** useful, please consider leaving a rating or short review. Any feedback helps support development and improves the extension for everyone. Obrigado!

---

## Features

- Override Slack channel names.
- Use the channel picker to grab channel names directly from the Slack UI.
- Save, view, and manage custom channel names via a polished popup interface.
- Real-time updates on the Slack web app with persistent overrides across sessions.

## Installation (Manual)

1. Clone or download this repository.
2. Open Chrome or Microsoft Edge and browse to the extensions page (`chrome://extensions/` or `edge://extensions/`).
3. Enable **Developer Mode** in the top-right corner.
4. Click **Load unpacked** and select the `slactac` folder.

### Microsoft Edge notes

- Edge may ask you to review the requested permissions (`tabs`, `activeTab`, and `storage`). These are required for the channel picker and for updating the active Slack tab reliably.
- If you do not see your Slack workspace update immediately, ensure the Slack tab is focused and refreshed once after installing the extension.

## Releases

When a GitHub release is published, an automated workflow bundles the extension into a zip archive named `slactac-v<version>.zip` and attaches it to the release assets. Download that file to sideload the exact payload that is uploaded to the Chrome Web Store or Microsoft Edge Add-ons catalogue.

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
