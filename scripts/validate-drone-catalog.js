#!/usr/bin/env node

/**
 * Validates the audited Drone catalog without contacting YouTube.
 * Network metadata validation is performed before an ID is added to
 * drone-videos.js; this check protects the catalog from structural regressions.
 */
const { resolve } = require("node:path");
const { loadCatalogContext } = require("./load-catalog");

const ROOT_DIR = resolve(__dirname, "..");
const context = loadCatalogContext(ROOT_DIR);

const cities = context.window.YOUCITY_CATALOG || context.window.CITY_CATALOG || [];
const catalog = context.window.DRONE_CATALOG || {};
const cityNames = new Set(cities.map((city) => city.name));
const failures = [];
const ids = new Map();

for (const [city, rides] of Object.entries(catalog)) {
  if (!cityNames.has(city)) failures.push(`${city}: not present in the city catalog`);
  if (!Array.isArray(rides) || !rides.length) {
    failures.push(`${city}: expected at least one ride`);
    continue;
  }

  for (const ride of rides) {
    if (!ride || !/^[A-Za-z0-9_-]{11}$/.test(ride.id || "")) failures.push(`${city}: invalid YouTube ID`);
    if (!/^[AB]$/.test(ride.confidence || "")) failures.push(`${city}: missing confidence A/B`);
    if (ids.has(ride.id)) failures.push(`${city}: duplicate ID already used by ${ids.get(ride.id)}`);
    else ids.set(ride.id, city);
  }
}

if (failures.length) {
  console.error(`Drone catalog validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Drone catalog validation passed: ${Object.keys(catalog).length} cities, ${ids.size} unique videos.`);
}
