#!/usr/bin/env node

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");

const ROOT_DIR = resolve(__dirname, "..");
const catalog = require(resolve(ROOT_DIR, "data/discovercars-locations.json"));
const context = vm.createContext({
  URL,
  console,
  setTimeout,
  clearTimeout,
  window: {
    location: { hostname: "test" },
    YOUCITY_DISCOVERCARS_LOCATIONS: catalog.locations,
    YOUCITY_ANALYTICS: { track() {} }
  }
});

function load(file) {
  vm.runInContext(readFileSync(resolve(ROOT_DIR, file), "utf8"), context, { filename: file });
}

[
  "affiliate/affiliate-config.js",
  "affiliate/affiliate-engine.js",
  "affiliate/affiliate-catalog.js",
  "affiliate/affiliate-tracking.js",
  "affiliate/affiliate-experiments.js",
  "affiliate/providers/expedia.js",
  "affiliate/providers/booking.js",
  "affiliate/providers/viator.js",
  "affiliate/providers/discovercars.js",
  "affiliate/providers/travelpayouts.js",
  "affiliate/providers/airalo.js",
  "affiliate/providers/heymondo.js",
  "affiliate/affiliate-resolver.js"
].forEach(load);

const affiliate = context.window.YouCityAffiliate;
const config = context.window.YOUCITY_AFFILIATE_CONFIG;
const availableCity = { id: "sao-paulo", name: "Sao Paulo", rawCountry: "Brazil", country: "Brazil", countryCode: "BR" };
const unavailableCity = { id: "st-petersburg", name: "St. Petersburg", rawCountry: "Russia", country: "Russia", countryCode: "RU" };
const londonCity = { id: "london", name: "London", rawCountry: "UK", country: "United Kingdom" };
const newYorkCity = { id: "new-york-city", name: "New York City", rawCountry: "USA", country: "United States" };

let offers = affiliate.getAffiliateOffers(affiliate.createContext(availableCity, "cars"));
assert.equal(JSON.stringify(offers.map((offer) => offer.provider)), JSON.stringify(["discovercars"]), "enabled provider should appear");
assert.equal(offers[0].url, "https://www.discovercars.com/brazil/sao-paulo?a_aid=youcity");
const londonContext = affiliate.createContext(londonCity, "cars");
assert.equal(londonContext.city.rawCountry, "UK");
assert.equal(londonContext.city.countryCode, "GB", "country code should be derived from raw country metadata");
assert.equal(affiliate.getAffiliateOffers(londonContext)[0].url, "https://www.discovercars.com/united-kingdom/london?a_aid=youcity");
assert.equal(affiliate.getAffiliateOffers(affiliate.createContext(newYorkCity, "cars"))[0].url, "https://www.discovercars.com/usa-new-york/new-york?a_aid=youcity");

context.window.YOUCITY_AFFILIATE_OVERRIDES = { "new-york-city-us": null };
assert.equal(affiliate.getAffiliateOffers(affiliate.createContext(newYorkCity, "cars")).length, 0, "null override should disable a provider");
context.window.YOUCITY_AFFILIATE_OVERRIDES = {};

config.providers.discovercars.enabled = false;
assert.equal(affiliate.getAffiliateOffers(affiliate.createContext(availableCity, "cars")).length, 0, "disabled provider should be hidden");
config.providers.discovercars.enabled = true;

assert.equal(affiliate.getAffiliateOffers(affiliate.createContext(availableCity, "hotels")).length, 0, "unconfigured provider must not create a URL");
config.providers.expedia.configured = true;
config.providers.expedia.urlTemplate = "https://approved.example/hotels/{cityId}";
offers = affiliate.getAffiliateOffers(affiliate.createContext(availableCity, "hotels"));
assert.equal(offers[0].provider, "expedia", "configured provider URL template should be resolved");
assert.equal(offers[0].url, "https://approved.example/hotels/sao-paulo");
config.providers.expedia.configured = false;
delete config.providers.expedia.urlTemplate;
assert.equal(affiliate.getAffiliateOffers(affiliate.createContext(unavailableCity, "cars")).length, 0, "unavailable catalog city must be hidden");
assert.equal(affiliate.getAffiliateOffers(affiliate.createContext(availableCity, "activities")).length, 0, "incompatible vertical must be hidden");

["test-expedia", "test-booking", "test-travelpayouts"].forEach((providerId, index) => {
  config.providers[providerId] = { enabled: true, configured: true, priority: index + 1 };
  affiliate.registerProvider({
    id: providerId,
    name: providerId,
    verticals: ["hotels"],
    supports: () => true,
    createUrl: () => `https://example.com/${providerId}`,
    getOffer: (decisionContext) => ({ url: `https://example.com/${providerId}?city=${decisionContext.city.id}` })
  });
});
offers = affiliate.getAffiliateOffers(affiliate.createContext(availableCity, "hotels"));
assert.equal(JSON.stringify(offers.map((offer) => offer.provider)), JSON.stringify(["test-travelpayouts", "test-booking", "test-expedia"]), "multiple providers should be ranked centrally");

const tracked = [];
context.window.YOUCITY_ANALYTICS = { track(payload) { tracked.push(payload); } };
const element = { dataset: {
  travelProvider: "booking",
  travelVertical: "hotels",
  travelCityName: "Sao Paulo",
  travelCountry: "Brazil",
  travelPlacement: "travel_planner",
  travelVariant: "A"
} };
context.window.YouCityAffiliateTracking.trackImpression(element);
context.window.YouCityAffiliateTracking.trackClick(element);
assert.equal(JSON.stringify(tracked.map((payload) => payload.event)), JSON.stringify(["affiliate_impression", "affiliate_click"]), "impression and click events should be emitted");

context.window.YOUCITY_ANALYTICS = { track() { throw new Error("analytics down"); } };
assert.doesNotThrow(() => context.window.YouCityAffiliateTracking.trackClick(element), "analytics failure must not block navigation");

console.log("Affiliate tests passed: enabled/disabled/configuration/vertical/catalog filtering, multiple providers, impressions, clicks, and analytics fail-safe.");
