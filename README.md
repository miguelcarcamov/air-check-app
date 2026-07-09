# Air Check

A lightweight web app that compares outdoor and indoor air quality using [WHO 2021 guidelines](https://www.who.int/news-room/feature-stories/detail/what-are-the-who-air-quality-guidelines), with practical recommendations for outdoor exercise and air purifier use.

No build step — plain HTML, CSS, and ES modules.

## Features

- Outdoor PM2.5 from Chile's SINCA monitoring network when a station is within 30 km, otherwise Open-Meteo/CAMS model
- Indoor PM2.5 via manual entry or an optional local sensor bridge
- Exercise and purifier verdicts based on WHO thresholds
- Saved settings (location override, bridge URL, indoor readings) in `localStorage`

## Project structure

```
air_check_app/
├── index.html          # App shell
├── css/
│   └── main.css        # Styles
├── js/
│   ├── main.js         # Entry point — events & init
│   ├── config.js       # Constants & API endpoints
│   ├── storage.js      # localStorage adapter
│   ├── quality.js      # WHO tiers, verdicts, data parsing
│   ├── api.js          # Geolocation, geocoding, air quality APIs
│   ├── state.js        # App state & persistence
│   └── ui.js           # DOM rendering
└── .github/workflows/
    └── pages.yml       # GitHub Pages deployment
```

## Local development

Serve the folder over HTTP (required for ES modules and geolocation):

```bash
# Python
python -m http.server 8080

# Node (npx, no install)
npx serve .

# PHP
php -S localhost:8080
```

Open `http://localhost:8080` in your browser.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` — the included workflow deploys automatically.

Your site will be available at `https://<username>.github.io/<repo>/`.

### Manual Pages setup (alternative)

If you prefer not to use Actions: set **Source** to **Deploy from a branch**, branch `main`, folder `/ (root)`.

## Configuration

All tunables live in `js/config.js`:

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
