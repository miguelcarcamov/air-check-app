# Air Check

A lightweight web app that compares outdoor and indoor air quality using [WHO 2021 guidelines](https://www.who.int/news-room/feature-stories/detail/what-are-the-who-air-quality-guidelines), with practical recommendations for outdoor exercise and air purifier use.

Built with **Vite** (vanilla JS modules) — fast local dev, optimized production build for GitHub Pages.

## Features

- Outdoor PM2.5 from Chile's SINCA monitoring network when a station is within 30 km, otherwise Open-Meteo/CAMS model
- Indoor PM2.5 via manual entry or an optional local sensor bridge
- Exercise and purifier verdicts based on WHO thresholds
- Saved settings (location override, bridge URL, indoor readings) in `localStorage`

## Project structure

```
air_check_app/
├── index.html              # App shell + HTML templates
├── src/
│   ├── main.js             # Entry point — events & init
│   ├── types.js            # JSDoc shared types
│   ├── config.js           # Constants & API endpoints
│   ├── storage.js          # localStorage adapter
│   ├── quality.js          # WHO tiers, verdicts, data parsing
│   ├── api.js              # Geolocation, geocoding, air quality APIs
│   ├── state.js            # App state & persistence
│   ├── css/main.css
│   └── ui/
│       ├── index.js        # Composes render modules
│       ├── dom.js          # DOM helpers
│       ├── templates.js    # `<template>` cloning
│       ├── render-cards.js
│       ├── render-verdicts.js
│       └── render-settings.js
├── tests/
│   └── quality.test.js     # Vitest unit tests
├── vite.config.js
└── .github/workflows/pages.yml
```

## Local development

```bash
npm install
npm run dev      # http://localhost:5173 — hot reload
npm test         # run unit tests
npm run build    # output to dist/
npm run preview  # preview production build locally
```

Geolocation and fetches require the dev server (not `file://`).

## Deploy to GitHub Pages

You **do not** commit or pick a `dist/` folder in Settings — that folder is built by CI and is correctly gitignored.

**One-time setup:**

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source → GitHub Actions**  
   (not “Deploy from a branch” — there is no `dist/` in the repo on purpose).
3. Push to `main`, or re-run **Actions → Deploy to GitHub Pages**.

CI runs `npm ci` → `npm test` → `npm run build` → uploads the `dist/` artifact to Pages.

Live URL: `https://miguelcarcamov.github.io/air-check-app/`

If you rename the repo, set `VITE_BASE_PATH` in `.github/workflows/pages.yml` to match (`/<repo-name>/`).

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Get Pages site failed` / `Not Found` | Enable Pages; set Source to **GitHub Actions**. |
| Styled but buttons dead / no location | Branch deploy is serving raw source; switch to **GitHub Actions** and re-run the workflow. |
| App looks unstyled (plain HTML) | Same — need the Vite build from Actions, not repo root. |
| Assets 404 on Pages | `VITE_BASE_PATH` must match the repo name (e.g. `/air-check-app/`). |
| `Node 20 is being deprecated` | Informational — workflow uses Node 22. |

## Configuration

All tunables live in `src/config.js`:

| Constant | Purpose |
|----------|---------|
| `WHO_PM25_GUIDELINE` | 24-hour PM2.5 reference (15 µg/m³) |
| `SINCA_MAX_DISTANCE_KM` | Max distance to prefer a ground station |
| `STORAGE_KEYS` | `localStorage` key names |

## Data sources

- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) — modeled PM2.5, ozone
- [SINCA](https://sinca.mma.gob.cl/) — Chile government monitoring stations
- [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) — location search

## License

MIT
