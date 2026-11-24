# Ambar.fm v1.0

A local-first personal music analytics PWA. It runs in a browser and can be installed on Android from the browser menu.

## Included in v1
- Import Spotify Extended Streaming History JSON files (multiple files at once)
- Listening minutes and hours, event counts, unique tracks and artists
- Top artists, tracks and albums
- Listening timeline
- Date-period filters and searchable rankings/history
- IndexedDB storage in the browser
- PWA manifest and service worker for install/offline shell

## Run locally
This is a static web app. For service-worker/PWA support, serve it over localhost or HTTPS.

Using Python:
```bash
python -m http.server 8000
```
Then open http://localhost:8000

Or deploy the folder to any static HTTPS host.

## Install on Android
1. Open the deployed HTTPS address in Chrome.
2. Open the browser menu.
3. Choose "Install app" or "Add to Home screen".

## Get Spotify history
1. Visit https://www.spotify.com/account/privacy/
2. Request **Extended streaming history**.
3. Download and unzip the archive.
4. Import all `Streaming_History_Audio_*.json` files in Ambar.fm.

## Data and privacy
- Imported records are saved in IndexedDB on the current browser/device.
- No analytics server, account, or cloud sync is included.
- Clearing browser site data can remove the local database. Export/backup is not included in v1.
- This app is not affiliated with Spotify.

## Counting notes
- "Plays" in v1 means imported listening events, not Spotify's official royalty-qualified stream count.
- Listening time is the sum of `ms_played` values.
- Repeated records are deduplicated using timestamp, track identifier/name, artist and duration.
- A future version can add an export/backup function, Spotify OAuth, Last.fm sync and cross-device sync.
