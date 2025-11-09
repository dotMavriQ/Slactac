# SlacTac Firefox Setup

## Installation

### Temporary (Testing)
1. Firefox → `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select `manifest.json`

### Permanent
```bash
zip -r slactac-firefox.zip . -x ".git/*" ".github/*"
```
1. Firefox → `about:addons`
2. Gear icon → "Install Add-on From File"
3. Select the ZIP

## Permissions
- **storage** - Save custom channel names
- **activeTab** - Access Slack tab for channel picker
- **tabs** - Communicate with Slack page
- **https://app.slack.com/*** - Run on Slack

## Troubleshooting

**Extension won't load?**
- Check Firefox 121.0+ (console: Ctrl+Shift+K)
- Verify manifest.json path is correct

**Channel picker not working?**
- Ensure you're on app.slack.com
- Refresh the Slack page
- Check console for errors

**Changes not saving?**
- Verify storage permission is granted
- Check `about:preferences#privacy`

## Usage
1. Click SlacTac icon in toolbar
2. Click "Pick Channel" or type channel name
3. Enter custom name
4. Click "Save Tack"
5. Changes appear instantly in Slack

## Notes
- Firefox 121.0+ required
- Works on Windows, macOS, Linux
- Data stored locally in Firefox profile
