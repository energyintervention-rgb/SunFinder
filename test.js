/* =========================================================
   Unit tests for solar calculation logic.
   Run with: node test.js

   IMPORTANT — what these tests actually verify:
   These tests check that SunCalc returns internally consistent,
   sane results (sunrise before solar noon before sunset, azimuth
   in valid range, equator/pole edge cases behave as expected) and
   that our azimuth-conversion math is correct.

   They do NOT compare against a second independent authority
   (e.g. NOAA's published tables) because I don't have verified
   reference numbers for specific dates/locations available to me
   right now. If you want a true accuracy check, the standard way
   is to compare a handful of these outputs against
   https://www.esrl.noaa.gov/gmd/grad/solcalc/ for the same
   date/lat/lon and confirm thes are within a minute or two.
   ========================================================= */

const SunCalc = require('suncalc');
const assert = require('assert');

let passed = 0, failed = 0;

function test(name, fn){
  try {
    fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`FAIL: ${name}`);
    console.log(`      ${e.message}`);
    failed++;
  }
}

// Same conversion used in app.js — duplicated here so the test
// doesn't depend on loading browser-only code.
function azToCompassBearing(azimuthRadians){
  const deg = azimuthRadians * 180 / Math.PI;
  return (deg + 180 + 360) % 360;
}

// ---------- Test locations ----------
const LOCATIONS = {
  equator:        { lat: 0,      lon: 0,      name: 'Equator / Prime Meridian' },
  kualaLumpur:    { lat: 3.139,  lon: 101.687, name: 'Kuala Lumpur, MY' },
  sydney:         { lat: -33.868, lon: 151.209, name: 'Sydney, AU' },
  london:         { lat: 51.507, lon: -0.128,  name: 'London, UK' },
  reykjavik:      { lat: 64.146, lon: -21.942, name: 'Reykjavik, IS (high latitude)' },
};

const TEST_DATE = new Date('2026-06-17T12:00:00Z'); // matches "today" in this conversation
const WINTER_DATE = new Date('2026-12-21T12:00:00Z');

// ---------- Structural sanity tests ----------
for (const [key, loc] of Object.entries(LOCATIONS)){
  test(`${loc.name}: sunrise occurs before sunset (June)`, ()=>{
    const t = SunCalc.getTimes(TEST_DATE, loc.lat, loc.lon);
    assert.ok(t.sunrise instanceof Date && !isNaN(t.sunrise.getTime()), 'sunrise should be a valid Date');
    assert.ok(t.sunset instanceof Date && !isNaN(t.sunset.getTime()), 'sunset should be a valid Date');
    assert.ok(t.sunrise.getTime() < t.sunset.getTime(), 'sunrise must be before sunset');
  });

  test(`${loc.name}: solar noon falls between sunrise and sunset`, ()=>{
    const t = SunCalc.getTimes(TEST_DATE, loc.lat, loc.lon);
    assert.ok(t.solarNoon.getTime() > t.sunrise.getTime());
    assert.ok(t.solarNoon.getTime() < t.sunset.getTime());
  });

  test(`${loc.name}: sunrise/sunset azimuth within [0,360)`, ()=>{
    const t = SunCalc.getTimes(TEST_DATE, loc.lat, loc.lon);
    const riseAz = azToCompassBearing(SunCalc.getPosition(t.sunrise, loc.lat, loc.lon).azimuth);
    const setAz  = azToCompassBearing(SunCalc.getPosition(t.sunset, loc.lat, loc.lon).azimuth);
    assert.ok(riseAz >= 0 && riseAz < 360, `sunrise azimuth out of range: ${riseAz}`);
    assert.ok(setAz >= 0 && setAz < 360, `sunset azimuth out of range: ${setAz}`);
  });
}

// ---------- Direction sanity (sunrise should be in the eastern
// half of the compass, sunset in the western half, for locations
// without extreme polar day/night) ----------
test('Kuala Lumpur: sunrise azimuth is in the eastern half (0-180°)', ()=>{
  const loc = LOCATIONS.kualaLumpur;
  const t = SunCalc.getTimes(TEST_DATE, loc.lat, loc.lon);
  const riseAz = azToCompassBearing(SunCalc.getPosition(t.sunrise, loc.lat, loc.lon).azimuth);
  assert.ok(riseAz > 0 && riseAz < 180, `expected eastern sunrise, got ${riseAz}°`);
});

test('Kuala Lumpur: sunset azimuth is in the western half (180-360°)', ()=>{
  const loc = LOCATIONS.kualaLumpur;
  const t = SunCalc.getTimes(TEST_DATE, loc.lat, loc.lon);
  const setAz = azToCompassBearing(SunCalc.getPosition(t.sunset, loc.lat, loc.lon).azimuth);
  assert.ok(setAz > 180 && setAz < 360, `expected western sunset, got ${setAz}°`);
});

// ---------- Equator check: day length should be close to 12h year-round ----------
test('Equator: day length is close to 12 hours in June', ()=>{
  const loc = LOCATIONS.equator;
  const t = SunCalc.getTimes(TEST_DATE, loc.lat, loc.lon);
  const hours = (t.sunset - t.sunrise) / (1000*60*60);
  assert.ok(Math.abs(hours - 12) < 0.5, `expected ~12h day length at equator, got ${hours.toFixed(2)}h`);
});

// ---------- Seasonal sanity: Sydney (southern hemisphere) should have
// LONGER days in December (southern summer) than in June (southern winter) ----------
test('Sydney: December day length exceeds June day length (southern hemisphere seasons)', ()=>{
  const loc = LOCATIONS.sydney;
  const juneTimes = SunCalc.getTimes(TEST_DATE, loc.lat, loc.lon);
  const decTimes = SunCalc.getTimes(WINTER_DATE, loc.lat, loc.lon);
  const juneHours = (juneTimes.sunset - juneTimes.sunrise) / (1000*60*60);
  const decHours = (decTimes.sunset - decTimes.sunrise) / (1000*60*60);
  assert.ok(decHours > juneHours, `expected longer Dec days in Sydney, got June=${juneHours.toFixed(2)}h Dec=${decHours.toFixed(2)}h`);
});

test('London: June day length exceeds December day length (northern hemisphere seasons)', ()=>{
  const loc = LOCATIONS.london;
  const juneTimes = SunCalc.getTimes(TEST_DATE, loc.lat, loc.lon);
  const decTimes = SunCalc.getTimes(WINTER_DATE, loc.lat, loc.lon);
  const juneHours = (juneTimes.sunset - juneTimes.sunrise) / (1000*60*60);
  const decHours = (decTimes.sunset - decTimes.sunrise) / (1000*60*60);
  assert.ok(juneHours > decHours, `expected longer June days in London, got June=${juneHours.toFixed(2)}h Dec=${decHours.toFixed(2)}h`);
});

// ---------- Azimuth conversion unit test (pure math, no SunCalc needed) ----------
test('azToCompassBearing: 0 rad (south in SunCalc convention) maps to 180°', ()=>{
  assert.strictEqual(azToCompassBearing(0), 180);
});
test('azToCompassBearing: -PI/2 rad maps to 90° (east)', ()=>{
  const result = azToCompassBearing(-Math.PI/2);
  assert.ok(Math.abs(result - 90) < 0.001, `expected 90, got ${result}`);
});
test('azToCompassBearing: PI/2 rad maps to 270° (west)', ()=>{
  const result = azToCompassBearing(Math.PI/2);
  assert.ok(Math.abs(result - 270) < 0.001, `expected 270, got ${result}`);
});

// ---------- Reykjavik high-latitude edge case ----------
test('Reykjavik: getTimes does not throw for high-latitude location', ()=>{
  const loc = LOCATIONS.reykjavik;
  assert.doesNotThrow(()=>{
    SunCalc.getTimes(TEST_DATE, loc.lat, loc.lon);
  });
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
