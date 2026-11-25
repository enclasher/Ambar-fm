AMBAR.FM 4.1 - ARTWORK REPAIR

This is a patch upgrade for the existing Ambar.fm Premium UI build.

WHAT CHANGED
- More resilient Spotify artwork lookup for artists, tracks and albums.
- Searches up to five Spotify matches and prefers an exact title match.
- Retries rate-limited artwork requests and continues past individual lookup failures.
- Caches successful artwork lookups locally to reduce repeated API calls.
- Adds safe image-load fallbacks so broken thumbnail URLs do not leave blank cards.
- Bumps the service-worker cache version to force the new UI assets to load.

INSTALL
1. Open Ambar.fm and export a Data Vault backup first.
2. Extract this ZIP.
3. Replace index.html and sw.js in the root of https://github.com/enclasher/Ambar-fm
4. Commit the changes and wait for GitHub Pages to deploy.
5. Reopen or refresh Ambar.fm. If the old screen remains, fully close and reopen the PWA.

DATA SAFETY
- This patch does not delete, recreate, or migrate the IndexedDB database.
- It preserves the existing database name: ambar-fm-clean and object store: plays.
- It does not disconnect Spotify or remove listening records.
- Artwork lookup requires the Spotify connection to remain connected. Older imported plays may need time to be matched to Spotify's catalogue.

NOTE
Spotify catalogue search may not return artwork for every obscure, unavailable, local, or region-restricted item. Those cards show a designed initials fallback rather than a broken image.
