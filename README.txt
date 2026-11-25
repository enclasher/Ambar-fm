AMBAR.FM PREMIUM UI UPGRADE

This package updates the visual interface while preserving the existing IndexedDB database:
  database: ambar-fm-clean
  object store: plays

Included:
- Premium dark editorial UI
- Artwork-first track, artist and album cards
- Spotify artwork lookup and local artwork cache (requires connected Spotify)
- Six-month listening recap shortcut in the persistent header and mobile navigation
- Six-month recap mode in Ambar Wrapped
- Existing Spotify PKCE connection and sync flow retained
- Existing Data Vault export/restore retained

INSTALL
1. Open Ambar.fm and export a Data Vault backup first.
2. Extract this ZIP.
3. In the GitHub repository root, replace index.html and sw.js. Keep manifest.json and icon.svg as included, replacing those too if GitHub asks.
4. Commit changes and wait for GitHub Pages deployment.
5. Open the app and refresh. If the installed PWA shows the old design, close and reopen it after deployment.

IMPORTANT
Do not clear site data, browser storage, or uninstall the PWA. The upgrade keeps the same IndexedDB database and store. The six-month recap covers the six calendar-month lookback from the current date based on records currently saved on this device.

Artwork availability depends on Spotify API search results and network access. Imported records without artwork use designed fallback tiles until artwork can be looked up.
