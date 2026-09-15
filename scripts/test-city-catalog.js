#!/usr/bin/env node

const assert = require("node:assert/strict");
const { resolve } = require("node:path");
const { loadCatalogContext } = require("./load-catalog");

const ROOT_DIR = resolve(__dirname, "..");
const context = loadCatalogContext(ROOT_DIR);
const catalog = context.window.YOUCITY_CATALOG;
const granada = catalog.find((city) => city.name === "Granada" && city.country === "Spain");
assert.ok(granada, "Granada, Spain must be in the city catalog");
assert.equal(granada.countryCode, "ES");
assert.equal(catalog.length, 196, "catalog should contain 196 cities");
assert.deepEqual(Array.from(granada.videos.drive, (video) => video.id), ["zMTHYYszb94"]);
assert.deepEqual(Array.from(granada.videos.walk, (video) => video.id), ["X1unB-eKnB4", "thvjqM6ksHI"]);
assert.deepEqual(Array.from(context.window.DRONE_CATALOG.Granada, (video) => video.id), ["c6u22gDXtYw"]);
assert.deepEqual(Array.from(context.window.CITY_COORDINATES.Granada), [37.1765, -3.5979]);
assert.ok(catalog.every((city) => city.radios.length <= 5), "canonical catalog should cap radios at five per city");
assert.ok(catalog.every((city) => Object.values(city.videos).every((videos) => new Set(videos.map((video) => video.id)).size === videos.length)), "canonical catalog should deduplicate ride IDs");
assert.equal(new Set(catalog.map((city) => `${city.name}\u0000${city.country}`)).size, catalog.length, "canonical catalog should not contain duplicate city keys");
assert.ok(catalog.every((city) => Array.isArray(city.coordinates)), "canonical catalog should provide coordinates for every city");

console.log("City catalog tests passed: Granada, Spain is available with Drive, Walk, Drone, and map data.");
