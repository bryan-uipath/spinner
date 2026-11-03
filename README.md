# 🎯 Stand-up Roulette

A zero-dependency spinning wheel that picks who runs scrum. Add names, hit **SPIN**, and **Confirm** the result when that person takes a turn. Spin again to discard an unconfirmed selection.

**[▶ Live demo](https://bryan-uipath.github.io/spinner/)**

## Features

- Configurable name list (one per line), persisted in `localStorage`
- Per-person confirmed-turn counts, persisted in `localStorage`; hover over a slice to see the person's name, turns, and current chance of landing
- Weighted slices and selection odds: each person's weight is `2 ** (-(confirmed turns - fewest turns) / 2)`, normalized across everyone on the wheel. Every two extra turns halves their weight; equal counts give equal slices. A four-turn gap gives two people an 80% / 20% split, regardless of their lifetime totals.
- Everyone in the name list stays eligible on every spin; there are no weekly exclusions.
- Smooth eased spin animation rendered on `<canvas>`
- Styled with the UiPath [Apollo](https://github.com/UiPath/apollo-ui) **dark** theme palette

## Usage

It's a single static file — just open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server
# then visit http://localhost:8000
```

Counts are saved per browser and matched by exact name. Removing and re-adding a name, or resetting the name list to defaults, preserves its count. Old daily winner history is ignored; only confirmed turn counts affect the odds.

## Deploy (GitHub Pages)

The repo serves `index.html` from the root, so no build step is needed:

1. Push to GitHub
2. **Settings → Pages → Source:** `Deploy from a branch`, branch `main`, folder `/ (root)`
3. The site publishes at `https://<user>.github.io/spinner/`
