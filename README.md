# ☀ Sun Finder

**Solar Site Assessment PWA for Field Engineers**

A single-file Progressive Web App (PWA) for solar site surveys. All calculations run locally on the device — no server, no backend, no account required.

---

## Live Demo

**[energyintervention-rgb.github.io/sunfinder/](https://energyintervention-rgb.github.io/sunfinder/)**

Tested in Pekan, Pahang, Malaysia.

---

## Features

### 🏠 Home
- Real-time compass with sunrise/sunset azimuth markers
- Sky arc panel showing sun position across the day
- Alignment banner when facing sunrise or sunset direction
- Date/time picker to preview sun position at any time
- 7-day forecast tab

### ◐ Solar Advisor
- Monthly panel tilt (β) and facing direction (γ) recommendations
- Side-view diagram showing panel orientation, sun ray, normal vector, and optimum ray
- Correct standard installation geometry (base on opposite side from facing direction)
- Day-integrated efficiency vs flat panel
- Best fixed tilt for full year

### ◈ PSH — Peak Sun Hours
- Fetches real 22-year monthly climatology from **NASA POWER API** (`ALLSKY_SFC_SW_DWN`)
- Includes cloud cover — not a clear-sky estimate
- Monthly bar chart with colour coding (above/below average)
- Interactive energy yield estimator (panel size × system efficiency)

### ⊙ Sun Path Diagram
- Standard rectangular solar path chart (azimuth vs altitude)
- 12 monthly curves using real SunCalc calculations, sampled every 15 minutes
- June and December solstices highlighted
- Hour tick marks on June curve
- Live sun position dot, updates every 60 seconds
- Compatible with ASHRAE / PVsyst convention

### ◧ Shadow Calculator
- Input: object height (0.5–50 m) + date/time
- Output: shadow length (m), compass direction, N/E offset of shadow tip
- Top-down SVG diagram with compass rose and distance scale rings
- Uses real SunCalc.getPosition() with GPS coordinates

### ⊟ Site Report
- Generates a 2-page A4 PDF-ready HTML report
- Page 1: Site info, sun times, solar panel monthly table
- Page 2: PSH bar chart, shadow analysis, 7-day forecast, site notes
- Header with logo, generation date, reference number on every page
- Footer with page count (Page 1 of 2, Page 2 of 2)
- Open in new tab → browser Print → Save as PDF

### ◉ Lux Reader
- Reads ambient light sensor via `AmbientLightSensor` API
- Live lux value with log-scale bar and condition label
- Android Chrome only — iOS Safari blocks this API (Apple restriction)
- Clear error messages if not supported

### ⚙ Settings
- Light / dark theme
- 12h / 24h time format
- How calculations work — full explanation of every formula used

---

## Calculations — Honest Summary

| Feature | Method | Source |
|---------|--------|--------|
| Sunrise / Sunset | SunCalc library, −0.833° horizon | Vladimir Agafonkin |
| Sun azimuth / altitude | SunCalc.getPosition() | SunCalc |
| Solar panel tilt/facing | Full-day irradiance-weighted optimizer | cos(θ) incidence + airmass model |
| Panel efficiency % | Clear-sky geometric estimate | Not for yield calculations |
| Peak Sun Hours | NASA POWER 22-yr climatology | ALLSKY_SFC_SW_DWN |
| Shadow length | height ÷ tan(elevation) | Standard formula |
| Magnetic declination | NOAA WMM-2025, bundled offline | Valid 2025–2030 |
| UTC offset | Longitude ÷ 15 (geometric estimate) | ±1h accuracy |

**Honest limitations:**
- Solar efficiency % is clear-sky only — does not account for cloud, haze, shading, or degradation
- Use NASA POWER PSH data for actual yield calculations
- Compass accuracy depends on device magnetometer quality
- Lux reader not available on iOS Safari

---

## Technology

- **Single HTML file** — no build step, no dependencies to install
- **SunCalc** — astronomical calculations (bundled)
- **NASA POWER API** — real irradiance data (fetched on demand)
- **Geomagnetism / WMM-2025** — magnetic declination (bundled, offline)
- **Chart.js CDN** — PSH bar chart
- **PWA** — installable, works offline for all features except PSH fetch and report open

---

## Device Support

| Feature | Android Chrome | iOS Safari |
|---------|---------------|------------|
| GPS | ✓ | ✓ |
| Compass | ✓ | ✓ (requires tap to enable) |
| All calculations | ✓ | ✓ |
| PSH fetch | ✓ | ✓ |
| Site Report PDF | ✓ | ✓ |
| Lux Reader | ✓ | ✗ (Apple restriction) |

---

## Deployment

The app is a single `index.html` file. Deploy to any static host:

```bash
# GitHub Pages
git add index.html
git commit -m "update"
git push
```

No server, no API keys, no configuration required.

---

## File Structure

```
index.html          ← entire app (single file, ~201KB)
README.md           ← this file
```

During development, the source is split into:
```
index.html          ← HTML + CSS
app.js              ← JavaScript logic
node_modules/       ← SunCalc, geomagnetism (bundled at build time)
```

Build command (merges into single file):
```bash
python3 build.py
```

---

## Accuracy Notes

All solar position values are computed from the **SunCalc** library which implements standard astronomical algorithms. For Pekan, Pahang (3.49°N, 103.37°E) on June 20, 2026:

| Value | Computed | Verified |
|-------|----------|---------|
| Sunrise | 6:59 AM MYT | ✓ |
| Sunset | 7:18 PM MYT | ✓ |
| Rise azimuth | 66.5° (ENE) | ✓ |
| Set azimuth | 293.6° (WNW) | ✓ |
| Solar noon altitude | 70.1° | ✓ |
| Magnetic declination | +0.08° E | ✓ WMM-2025 |

Solar panel facing directions verified against full-day irradiance-weighted optimizer for all 12 months.

---

## Credits

- **SunCalc** — Vladimir Agafonkin (ISC License)
- **NASA POWER** — NASA Langley Research Center
- **NOAA WMM-2025** — National Centers for Environmental Information
- **Chart.js** — Chart.js Contributors (MIT License)
- **Geomagnetism** — Natural Atlas (MIT License)

---

## License

MIT — free to use, modify, and distribute.

---

*Built for CTS (City Technical Solutions) field engineers. Tested in Pekan, Pahang, Malaysia.*
