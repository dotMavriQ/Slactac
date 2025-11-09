# SlacTac Firefox - Quick Start

## Install

1. Firefox → `about:debugging`
2. "This Firefox" → "Load Temporary Add-on"
3. Select `manifest.json`

## Test It

1. Go to app.slack.com
2. Click SlacTac icon
3. Click "Pick Channel" → click a channel
4. Enter custom name → "Save Tack"
5. Channel name changes instantly in Slack

## Permanent Install

```bash
zip -r slactac-firefox.zip . -x ".git/*" ".github/*"
```
1. Firefox → `about:addons`
2. Gear → "Install Add-on From File"
3. Select the ZIP

## Troubleshooting

**Won't load?** Firefox 121.0+, check `about:debugging`
**Picker broken?** You on app.slack.com? Check console (Ctrl+Shift+K)
**Not saving?** Refresh Slack page

## More Info

- Setup: FIREFOX-SETUP.md
- Changes: FIREFOX-CHANGELOG.md
- Issues: https://github.com/dotMavriQ/Slactac/issues
