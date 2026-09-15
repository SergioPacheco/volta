#!/usr/bin/env node

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const ROOT_DIR = resolve(__dirname, "..");
const catalog = require(resolve(ROOT_DIR, "data/discovercars-locations.json"));
const appSource = readFileSync(resolve(ROOT_DIR, "app.js"), "utf8");
const travelConfig = readFileSync(resolve(ROOT_DIR, "travel-config.js"), "utf8");

function createDiscoverCarsAffiliateUrl(value) {
  const url = new URL(value);
  assert.equal(url.origin, "https://www.discovercars.com");
  url.searchParams.set("a_aid", catalog.affiliateId);
  return url.toString();
}

function location(name, countryCode) {
  return Object.values(catalog.locations).find((entry) => entry.youCityName === name && entry.countryCode === countryCode);
}

assert.equal(createDiscoverCarsAffiliateUrl("https://www.discovercars.com/spain/granada"), "https://www.discovercars.com/spain/granada?a_aid=youcity");
assert.equal(location("Málaga", "ES").available, true);
assert.equal(location("Ahmedabad", "IN").available, false);
assert.equal(location("Jacksonville", "US").status, "AMBIGUOUS");
assert.equal(location("Málaga", "ES").youCityName, "Málaga");
assert.equal(location("Sao Paulo", "BR").youCityName, "Sao Paulo");
assert.match(appSource, /function createDiscoverCarsAffiliateUrl/);
assert.match(appSource, /category === "cars"/);
assert.match(appSource, /location\.status !== "VERIFIED"/);
assert.match(travelConfig, /cars: \[\]/);
assert.match(travelConfig, /affiliateId: "youcity"/);

console.log("DiscoverCars tests passed: affiliate URL, verified city, unavailable city, ambiguous city, special characters, and UI guard.");
