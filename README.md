# 🎯 Stand-up Roulette

A zero-dependency spinning wheel that picks who runs scrum. Add names, hit **SPIN**, and **Confirm** the result when that person takes a turn. Spin again to discard an unconfirmed selection.

**[▶ Live demo](https://bryan-uipath.github.io/spinner/)**

## Features

- Configurable name list (one per line), persisted in `localStorage`
- Per-person confirmed-turn counts, persisted in `localStorage`; hover over a slice to see the person's name, turns, and current chance of landing
- Weighted slices and selection odds: each person's weight is `1 / (confirmed turns + 1)`, normalized across the eligible people. Three confirmed turns gives one-quarter the weight of zero turns; equal counts give equal slices.
- Earlier weekday winners are excluded for the rest of the week, with a fallback to everyone when all names are excluded. Only confirmed results record new winners.
- Smooth eased spin animation rendered on `<canvas>`
- Styled with the UiPath [Apollo](https://github.com/UiPath/apollo-ui) **dark** theme palette

## Usage

It's a single static file — just open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server
# then visit http://localhost:8000
```

Counts are saved per browser and matched by exact name. Removing and re-adding a name, or resetting the name list to defaults, preserves its count. Existing winner history remains available for weekly exclusions; counts start at zero because previous spins were not explicitly confirmed.

Run the behavior tests with Node.js (no installation or dependencies required):

```sh
node --test spinner.test.cjs
```

The end-to-end visual suite in `e2e/` uses Playwright and sbdiff, with desktop and mobile projects. It captures the initial wheel, selection, confirmation, reload, replacement selection, retained participants, unequal saved counts, and turn-count tooltips. Randomness and the clock are fixed so screenshots are comparable; browser errors fail the tests.

With Playwright and `@uipath/storybook-visual-diff` (a version with E2E support) installed, serve the pre-change version on port 8001 and the working tree on port 8000, then run:

```sh
sbdiff e2e --baseline http://127.0.0.1:8001 --current http://127.0.0.1:8000 -- --config=e2e/playwright.config.cjs
sbdiff view sbdiff-report
```

Reports are local and ignored by Git. A visual-change exit code is expected for this feature; inspect the captured steps along with the Playwright assertion results. `SBDIFF_FIXTURE` can point to a local checkout's E2E fixture when testing an unreleased sbdiff build.

## Deploy (GitHub Pages)

The repo serves `index.html` from the root, so no build step is needed:

1. Push to GitHub
2. **Settings → Pages → Source:** `Deploy from a branch`, branch `main`, folder `/ (root)`
3. The site publishes at `https://<user>.github.io/spinner/`
