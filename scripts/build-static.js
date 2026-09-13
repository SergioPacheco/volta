#!/usr/bin/env node

/**
 * Builds the deployable Cloudflare Pages directory and prerenders one SEO page
 * for every city in the catalog. No network access or third-party dependency
 * is required during the build.
 */
const { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { join, resolve } = require("node:path");
const { runInNewContext } = require("node:vm");

const ROOT_DIR = resolve(__dirname, "..");
const OUTPUT_DIR = resolve(ROOT_DIR, "dist");
const DEFAULT_SITE_URL = "https://youcity.pages.dev";
const SITE_URL = String(process.env.SEO_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
const BASE_PATH = String(process.env.SEO_BASE_PATH || "").trim().replace(/^\/+|\/+$/g, "");
const SITE_PATH = BASE_PATH ? `/${BASE_PATH}` : "";
const CITY_SUFFIX = String(process.env.SEO_CITY_SUFFIX || "");
const SITE_NAME = "YouCity";
const SOCIAL_IMAGE = `${SITE_URL}${SITE_PATH}/assets/hero-saopaulo.webp`;
const SOCIAL_ALT = "YouCity — immersive city rides around the world";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadCatalog() {
  const context = { window: {} };
  runInNewContext(readFileSync(resolve(ROOT_DIR, "cities-data.js"), "utf8"), context);
  runInNewContext(readFileSync(resolve(ROOT_DIR, "drone-videos.js"), "utf8"), context);
  const droneCatalog = context.window.DRONE_CATALOG || {};
  return (context.window.CITY_CATALOG || []).map((city) => ({
    ...city,
    videos: {
      ...city.videos,
      drone: (droneCatalog[city.name] || []).map((ride) =>
        typeof ride === "string" ? { id: ride, start: 0 } : ride
      )
    }
  }));
}

function countryName(country) {
  return {
    USA: "United States",
    UAE: "United Arab Emirates",
    UK: "United Kingdom",
    Korea: "South Korea",
    Russia: "Russia",
    Turkey: "Türkiye"
  }[country] || country;
}

function displayCityName(city) {
  return { "Sao Paulo": "São Paulo" }[city.name] || city.name;
}

function sitePath(path) {
  return `${SITE_PATH}${path}`;
}

function cityPath(city) {
  return sitePath(`/city/${slugify(city.name)}${CITY_SUFFIX}`);
}

function cityNote(city) {
  const name = displayCityName(city);
  const modes = cityModes(city);
  const modeText = modes.length ? modes.join(", ") : "city";
  return `Explore ${name}, ${countryName(city.country)} through real streets, local radio, and immersive ${modeText} rides.`;
}

function cityModes(city) {
  return [
    city.videos?.drive?.length ? "Drive" : null,
    city.videos?.bike?.length ? "Bike" : null,
    city.videos?.walk?.length ? "Walk" : null,
    city.videos?.drone?.length ? "Drone" : null
  ].filter(Boolean);
}

function citySeo(city) {
  const name = displayCityName(city);
  const country = countryName(city.country);
  const path = cityPath(city);
  const canonical = `${SITE_URL}${path}`;
  const description = cityNote(city);
  return {
    title: `${name} — YouCity`,
    description,
    canonical,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${name} — YouCity`,
        description,
        url: canonical,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}${sitePath("/")}` }
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}${sitePath("/")}` },
          { "@type": "ListItem", position: 2, name, item: canonical }
        ]
      }
    ],
    name,
    country,
    path,
    modes: cityModes(city)
  };
}

function homeSeo(catalog) {
  const description = `Explore ${catalog.length} cities around the world through immersive Drive, Bike, Walk, and Drone rides with local radio.`;
  return {
    title: "YouCity — cities in motion",
    description,
    canonical: `${SITE_URL}${sitePath("/")}`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: `${SITE_URL}${sitePath("/")}`,
        logo: `${SITE_URL}${sitePath("/assets/favicon.svg")}`
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: `${SITE_URL}${sitePath("/")}`,
        description
      }
    ],
    name: "Cities in motion",
    country: "Around the world",
    path: "/",
    modes: ["Drive", "Bike", "Walk", "Drone"]
  };
}

function replaceMeta(html, attribute, value) {
  const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta\\b(?=[^>]*${escapedAttribute})[^>]*>`, "i");
  const tag = `<meta ${attribute} content="${escapeHtml(value)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function replaceLink(html, relation, href) {
  const pattern = new RegExp(`<link\\b(?=[^>]*rel=["']${relation}["'])[^>]*>`, "i");
  const tag = `<link rel="${relation}" href="${escapeHtml(href)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function replaceTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
}

function replaceJsonLd(html, jsonLd) {
  const tag = `<script type="application/ld+json" data-seo-jsonld>${jsonForHtml(jsonLd)}</script>`;
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*data-seo-jsonld[^>]*>[\s\S]*?<\/script>/i;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function rewriteInternalPaths(html) {
  if (!SITE_PATH) return html;
  return html.replace(/\b(href|src)=(['"])\/(?!\/)/g, `$1=$2${SITE_PATH}/`);
}

function injectRuntimeBasePath(html) {
  const script = `<script>window.YOUCITY_BASE_PATH = ${jsonForHtml(SITE_PATH)};</script>`;
  return html.replace("</head>", `    ${script}\n  </head>`);
}

function replaceElementText(html, tagName, id, value) {
  const pattern = new RegExp(`(<${tagName}\\b[^>]*id=["']${id}["'][^>]*>)[\\s\\S]*?(<\\/${tagName}>)`, "i");
  return html.replace(pattern, `$1${value}$2`);
}

function replaceStaticCity(html, seo, index, total) {
  let output = html;
  output = replaceElementText(output, "span", "city-index", String(index).padStart(String(total).length, "0"));
  output = replaceElementText(output, "span", "city-total", String(total));
  output = replaceElementText(output, "p", "city-region", `${escapeHtml(seo.country)} · Now`);
  output = replaceElementText(output, "h1", "city-name", escapeHtml(seo.name));
  output = replaceElementText(output, "p", "city-note", escapeHtml(seo.description));
  return output;
}

function replaceSeoFallback(html, body) {
  const pattern = /<noscript\b[^>]*data-seo-fallback[^>]*>[\s\S]*?<\/noscript>/i;
  const content = `<noscript data-seo-fallback>${body}</noscript>`;
  return pattern.test(html) ? html.replace(pattern, content) : html.replace("</body>", `  ${content}\n</body>`);
}

function renderPage(baseHtml, seo, fallback) {
  let html = replaceTitle(baseHtml, seo.title);
  html = replaceMeta(html, 'name="description"', seo.description);
  html = replaceMeta(html, 'name="robots"', "index,follow");
  html = replaceMeta(html, 'property="og:title"', seo.title);
  html = replaceMeta(html, 'property="og:description"', seo.description);
  html = replaceMeta(html, 'property="og:url"', seo.canonical);
  html = replaceMeta(html, 'property="og:image"', SOCIAL_IMAGE);
  html = replaceMeta(html, 'property="og:image:alt"', SOCIAL_ALT);
  html = replaceMeta(html, 'name="twitter:title"', seo.title);
  html = replaceMeta(html, 'name="twitter:description"', seo.description);
  html = replaceMeta(html, 'name="twitter:image"', SOCIAL_IMAGE);
  html = replaceMeta(html, 'name="twitter:image:alt"', SOCIAL_ALT);
  html = replaceLink(html, "canonical", seo.canonical);
  html = replaceJsonLd(html, seo.jsonLd);
  if (fallback) html = replaceSeoFallback(html, fallback);
  return html;
}

function xmlEscape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function buildSitemap(catalog) {
  const urls = [
    `${SITE_URL}${sitePath("/")}`,
    ...catalog.map((city) => `${SITE_URL}${cityPath(city)}`)
  ];
  const entries = urls.map((url) => `  <url>\n    <loc>${xmlEscape(url)}</loc>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function buildRobots() {
  return `User-agent: *\nAllow: /\n\n# Query-string variants are client-side state; city pages use stable paths.\nDisallow: /*?city=\nDisallow: /*?preview=\nDisallow: /*?*\n\nSitemap: ${SITE_URL}${sitePath("/sitemap.xml")}\n`;
}

function buildNotFound() {
  return `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found — YouCity</title><meta name="robots" content="noindex,follow"><link rel="stylesheet" href="${sitePath("/styles.css")}"></head><body><main class="seo-fallback"><h1>Page not found</h1><p>The city page you requested does not exist.</p><p><a href="${sitePath("/")}">Return to YouCity</a></p></main></body></html>\n`;
}

function cityFallback(seo, catalog) {
  const links = catalog.map((city) => {
    const name = displayCityName(city);
    return `<li><a href="${cityPath(city)}">${escapeHtml(name)}</a></li>`;
  }).join("");
  const planner = [
    ["Things to do", "Viator"],
    ["Stay", "Booking.com · Expedia · Travelpayouts"],
    ["Get around", "DiscoverCars"],
    ["Stay connected", "Airalo"],
    ["More travel options", "Heymondo · Travelpayouts flights"]
  ].map(([label, providers]) => `<li><strong>${label}</strong> — ${providers} <em>(preview)</em></li>`).join("");
  return `<section class="seo-fallback"><h2>${escapeHtml(seo.name)}, ${escapeHtml(seo.country)}</h2><p>${escapeHtml(seo.description)}</p><p>Available modes: ${escapeHtml(seo.modes.join(", "))}.</p><h2>Plan your trip to ${escapeHtml(seo.name)}</h2><ul>${planner}</ul><p>Travel options preview. Affiliate links will be added after provider approval.</p><p><a href="${sitePath("/")}">Explore all cities</a></p><h2>More destinations</h2><ul>${links}</ul></section>`;
}

function homeFallback(catalog) {
  const links = catalog.map((city) => `<li><a href="${cityPath(city)}">${escapeHtml(displayCityName(city))}, ${escapeHtml(countryName(city.country))}</a></li>`).join("");
  return `<section class="seo-fallback"><h2>Explore ${catalog.length} cities around the world</h2><p>YouCity is an interactive collection of immersive Drive, Bike, Walk, and Drone rides with local radio.</p><ul>${links}</ul></section>`;
}

function main() {
  const catalog = loadCatalog();
  if (!catalog.length) throw new Error("The city catalog is empty.");

  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(join(OUTPUT_DIR, "assets"), { recursive: true });
  mkdirSync(join(OUTPUT_DIR, "city"), { recursive: true });

  for (const file of ["styles.css", "app.js", "cities-data.js", "map-catalog.js", "map-config.js", "travel-config.js", "drone-videos.js", "radio-catalog.js"]) {
    cpSync(resolve(ROOT_DIR, file), join(OUTPUT_DIR, file));
  }
  cpSync(resolve(ROOT_DIR, "assets"), join(OUTPUT_DIR, "assets"), { recursive: true });
  for (const file of ["_headers", "_redirects"]) {
    if (existsSync(resolve(ROOT_DIR, file))) cpSync(resolve(ROOT_DIR, file), join(OUTPUT_DIR, file));
  }

  const baseHtml = injectRuntimeBasePath(rewriteInternalPaths(readFileSync(resolve(ROOT_DIR, "index.html"), "utf8")));
  writeFileSync(join(OUTPUT_DIR, "index.html"), renderPage(baseHtml, homeSeo(catalog), homeFallback(catalog)));

  catalog.forEach((city, index) => {
    const seo = citySeo(city);
    const cityHtml = replaceStaticCity(
      renderPage(baseHtml, seo, cityFallback(seo, catalog)),
      seo,
      index + 1,
      catalog.length
    );
    writeFileSync(join(OUTPUT_DIR, "city", `${slugify(city.name)}.html`), cityHtml);
  });

  writeFileSync(join(OUTPUT_DIR, "robots.txt"), buildRobots());
  writeFileSync(join(OUTPUT_DIR, "sitemap.xml"), buildSitemap(catalog));
  writeFileSync(join(OUTPUT_DIR, "404.html"), buildNotFound());
  writeFileSync(join(OUTPUT_DIR, ".nojekyll"), "");
  console.log(`Built ${catalog.length + 1} SEO pages in ${OUTPUT_DIR} using ${SITE_URL}`);
}

main();
