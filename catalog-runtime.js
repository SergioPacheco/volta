// Canonical runtime catalog.
// The source catalogs remain separate because they have different ownership
// and update rules; the application consumes this normalized view only.
(function initializeCanonicalCatalog(global) {
  const modes = ["drive", "bike", "walk", "drone"];
  const cityByKey = new Map();

  for (const sourceCity of global.CITY_CATALOG || []) {
    const key = `${sourceCity.name}\u0000${sourceCity.country}`;
    const current = cityByKey.get(key);
    if (!current) {
      cityByKey.set(key, {
        ...sourceCity,
        videos: Object.fromEntries(modes.map((mode) => [mode, [...(sourceCity.videos?.[mode] || [])]])),
        radios: [...(sourceCity.radios || [])]
      });
      continue;
    }

    for (const mode of modes) current.videos[mode].push(...(sourceCity.videos?.[mode] || []));
    current.radios.push(...(sourceCity.radios || []));
  }

  const droneCatalog = global.DRONE_CATALOG || {};
  const radioCatalog = global.RADIO_CATALOG || {};
  const radioExtraCatalog = global.RADIO_EXTRA_CATALOG || {};

  for (const city of cityByKey.values()) {
    city.videos.drone.push(...(droneCatalog[city.name] || []).map((ride) =>
      typeof ride === "string" ? { id: ride, start: 0 } : { ...ride }
    ));

    const radios = [
      ...city.radios,
      ...(radioCatalog[city.name] || []),
      ...(radioExtraCatalog[city.name] || [])
    ];
    const seenRadioUrls = new Set();
    city.radios = radios.filter((radio) => {
      if (!radio?.url || seenRadioUrls.has(radio.url)) return false;
      seenRadioUrls.add(radio.url);
      return true;
    }).slice(0, 5);
    city.coordinates = global.CITY_COORDINATES?.[city.name] || null;

    for (const mode of modes) {
      const seenRideIds = new Set();
      city.videos[mode] = city.videos[mode].filter((ride) => {
        if (!ride?.id || seenRideIds.has(ride.id)) return false;
        seenRideIds.add(ride.id);
        return true;
      });
    }
  }

  global.YOUCITY_CATALOG = [...cityByKey.values()];
})(window);
