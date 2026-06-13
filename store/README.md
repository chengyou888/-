# Codex++ Tweak Store

The in-app Tweak Store reads the live reviewed registry from the mirrored
GitHub raw index:

`https://raw.githubusercontent.com/chengyou888/-/main/codex-plusplus-store/index.json`

Released Codex++ builds fetch this URL whenever the store page is opened or
refreshed. The registry can change without a Codex++ app update.

Registry entries must pin installs to `approvedCommitSha`. Codex++ downloads
from the mirrored `archiveUrl` when present, and only falls back to GitHub's
commit archive URL for that SHA. It validates the downloaded `manifest.json`
before replacing an installed tweak.

Publishing flow:

The in-app publishing entry is disabled in this fork. New store items should be
reviewed and mirrored manually before updating the registry.

Admin acceptance:

1. Open the submitted commit URL.
2. Review source and `manifest.json` at that exact commit.
3. Confirm the manifest includes a usable `iconUrl`.
4. Add a `store/index.json` entry with `approvedCommitSha` set to the reviewed
   full SHA.
5. Commit the registry change to `gh-pages`; GitHub Pages publishes it.
