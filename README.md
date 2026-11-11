# 🎯 Stand-up Roulette

A zero-dependency spinning wheel that randomly picks who runs scrum. Add names, hit **SPIN**, and let the wheel decide.

**[▶ Live demo](https://bryan-uipath.github.io/spinner/)**

## Features

- Configurable name list (one per line), persisted in `localStorage`
- Optional "remove winner after spin" mode for round-robin coverage
- Smooth eased spin animation rendered on `<canvas>`
- Styled with the UiPath [Apollo](https://github.com/UiPath/apollo-ui) **dark** theme palette

## Usage

It's a single static file — just open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server
# then visit http://localhost:8000
```

## Open with names

Pass a comma-separated list in the URL fragment:

```
index.html#names=Ana,Ben%20Lee,Chen
```

- Used for that visit only; never written to `localStorage`, so the saved list is untouched (Save, Reset and "remove winner" also skip storage while the link list is active).
- A fragment is not sent to the server, so names stay on the machine.
- URL-encode each name (`%20` space, `%2C` comma). Blanks and case-insensitive duplicates are dropped.

## Deploy (GitHub Pages)

The repo serves `index.html` from the root, so no build step is needed:

1. Push to GitHub
2. **Settings → Pages → Source:** `Deploy from a branch`, branch `main`, folder `/ (root)`
3. The site publishes at `https://<user>.github.io/spinner/`
