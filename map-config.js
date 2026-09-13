// Map provider configuration. Keep the interface stable so the tile provider
// can be changed later without touching the map UI.
window.YOUCITY_MAP_CONFIG = {
  leafletCssUrl: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  leafletJsUrl: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19
};
