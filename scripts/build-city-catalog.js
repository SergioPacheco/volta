const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Provide the path to the source bundle.");

const source = fs.readFileSync(inputPath, "utf8");
const starts = [...source.matchAll(/\{\"city\":\"/g)].map((match) => match.index);
const parsed = [];

for (const start of starts) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === "\"") inString = false;
      continue;
    }
    if (character === "\"") inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      end = index + 1;
      break;
    }
  }

  if (end < 0) continue;
  const json = source
    .slice(start, end)
    .replace(/\\x([0-9a-fA-F]{2})/g, "\\u00$1")
    .replace(/\\'/g, "'");

  try {
    const item = JSON.parse(json);
    if (Array.isArray(item.video_id)) parsed.push(item);
  } catch {
    // The bundle also contains unrelated city-shaped objects; ignore them.
  }
}

const modeVideos = (item, mode) => {
  const sourceItem = mode === "drive" ? item : item.experiences?.[mode];
  const ids = mode === "drive" ? item.video_id : sourceItem?.video_id;
  if (!Array.isArray(ids)) return [];
  return ids.map((id, index) => ({
    id,
    start: sourceItem?.start_times?.[index] ?? item.start_times?.[index] ?? 20
  }));
};

const catalog = [...new Map(parsed.map((item) => [item.city, item])).values()]
  .map((item) => ({
    name: item.city,
    country: item.country,
    videos: {
      drive: modeVideos(item, "drive"),
      bike: modeVideos(item, "bike"),
      walk: modeVideos(item, "walk")
    },
    radios: (item.radio_url || []).slice(0, 5).map((url, index) => ({
      name: item.name?.[index] || `Local radio ${index + 1}`,
      url
    }))
  }))
  .sort((left, right) => {
    if (left.name === "Sao Paulo") return -1;
    if (right.name === "Sao Paulo") return 1;
    return left.name.localeCompare(right.name, "en");
  });

if (catalog.length !== 179) {
  throw new Error(`Incomplete catalog: ${catalog.length} of 179 cities.`);
}

const output = `// Static catalog of rides and radio stations. Generated on 2026-08-27.\nwindow.CITY_CATALOG = ${JSON.stringify(catalog)};\n`;
const outputPath = path.resolve(__dirname, "..", "cities-data.js");
fs.writeFileSync(outputPath, output);

const counts = {
  cities: catalog.length,
  drive: catalog.filter((city) => city.videos.drive.length).length,
  bike: catalog.filter((city) => city.videos.bike.length).length,
  walk: catalog.filter((city) => city.videos.walk.length).length
};
console.log(JSON.stringify(counts));
