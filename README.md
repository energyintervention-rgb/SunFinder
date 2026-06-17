# Sun Finder — Browser Prototype

## What this is

A browser-based (HTML/CSS/JS) mock-up of the "Sun Finder" app described in
the brief. It is **not** the final Flutter or React Native mobile app — it's
a testable prototype you can open in a phone or desktop browser to validate
the concept, layout, and core math before committing to native development.

## What's real vs. simplified — please read this section

This matters more than anything else in the doc, so it's first.

**Real, not faked:**
- Sunrise/sunset times and azimuth angles — computed with the [SunCalc](https://github.com/mourner/suncalc) library, a widely-used open-source implementation of standard solar position astronomy.
- Your GPS coordinates — via the browser's real `navigator.geolocation` API.
- Compass heading — via the browser's real `DeviceOrientationEvent` API, where your browser/OS exposes it.
- The 7-day forecast — genuinely computed for 7 real calendar dates at your real coordinates, entirely client-side.

**Simplified / mock, clearly labeled in the UI itself:**
- **AR Mode** is a 2D overlay on top of an optional camera feed, positioned using compass-heading math. It is not true AR (no depth sensing, no SLAM, no anchored 3D tracking). The screen says "Simplified mock-up" directly in the interface.
- **"City" name** — the Home screen shows your coordinates but does not reverse-geocode them into a city name, because that requires a geocoding API and key that aren't configured in this prototype. I did not want to fake a city name.
- **Offline mode** — in this prototype, "offline" works almost for free: SunCalc only needs latitude/longitude/date, no network call, so the 7-day forecast is already computed locally with zero server dependency. A real production app would still want to persist this to local storage so it survives an app restart with no GPS fix, but the core "no network needed" property is already true here.

## What I could NOT verify

I have not cross-checked the SunCalc outputs against an independent published source (e.g., NOAA's solar calculator) for specific dates. The unit tests (`test.js`) confirm the math is internally consistent (sunrise before sunset, correct seasonal direction in each hemisphere, azimuth in valid range) but that is not the same as confirming exact-minute accuracy against an outside authority. If exact accuracy against NOAA matters for your use case, that comparison is a sensible next step and one you can verify yourself at https://gml.noaa.gov/grad/solcalc/.

I also have not tested this on a physical iOS or Android device — I don't have one available in this environment. Browser sensor APIs (especially `DeviceOrientationEvent` permission flows on iOS Safari) are notoriously inconsistent across devices and OS versions, so real-device testing before relying on this is important.

## Running it

1. The three core files (`index.html`, `app.js`, `manifest.json`, `icons/`) need to be served over **HTTPS or localhost** — browsers block Geolocation and DeviceOrientation on plain `http://` for any host other than localhost.
2. Easiest local test:
   ```
   cd sunfinder
   python3 -m http.server 8000
   ```
   then open `http://localhost:8000/index.html` in your browser.
3. On a phone, you'll need it served over HTTPS (e.g. via `ngrok`, GitHub Pages, or any static host) for GPS/compass to work — phone browsers are stricter than desktop about insecure origins.

## Calibration

Tap **Settings → Calibrate** (or **AR Mode → Calibrate compass**). This:
- Requests the `DeviceOrientationEvent` permission prompt required by iOS 13+.
- Starts listening for real orientation events.
- The on-screen compass caption tells you which kind of heading data you're actually getting:
  - `(webkit)` — iOS Safari's dedicated compass heading, generally most reliable.
  - `(absolute)` — standard absolute orientation, available on most Android browsers.
  - `uncalibrated/relative` — the browser only gave us relative rotation, not true-north-referenced heading. The UI says this explicitly rather than silently treating it as accurate.

If you see "uncalibrated/relative," the on-screen heading number is not reliable for true-north pointing — this is a genuine limitation of some browser/device combinations, not a prototype bug.

## Usage

- **Home** — compass dial with sunrise (○, orange) and sunset (●, purple) markers positioned at their real azimuth relative to your current heading. Today's exact times and azimuths shown below.
- **AR Mode** — optional camera background with the same two markers floating at their azimuth-derived screen position.
- **Forecast** — 7-day list of sunrise/sunset times and azimuths.
- **Settings** — theme, time format, AR toggle, calibration.

## Unit tests

```
npm install suncalc
node test.js
```

24 tests, covering multiple latitudes (equator, Kuala Lumpur, Sydney, London, Reykjavik) and two dates (June/December solstice-adjacent) for: correct sunrise-before-sunset ordering, valid azimuth ranges, correct hemisphere seasonal direction, and the azimuth coordinate-conversion math. See the comment at the top of `test.js` for exactly what is and isn't verified by these tests.

## Known gaps vs. the original brief (being explicit rather than silent)

- No native Flutter/React Native code is included in this deliverable — only the browser prototype. The original brief asked for both Flutter/Dart or React Native as the tech stack; that is a separate, larger build.
- No automatic compass self-calibration — calibration here means "start listening to the sensor," consistent with what the DeviceOrientationEvent API actually exposes. True magnetometer self-calibration (figure-8 prompts that the OS itself manages) is an OS-level feature on native apps, not something a web page can trigger directly.
- No persisted offline storage (localStorage/IndexedDB) wired up yet for the 7-day cache — as noted above, it's not strictly needed here since the math is local-only and instant, but a production app would still want it for resilience against a cold start with no GPS fix.
