(function registerAiralo(global) {
  const createUrl = (context) => global.YouCityAffiliate.createConfiguredUrl("airalo", context);
  global.YouCityAffiliate.registerProvider({
    id: "airalo",
    name: "Airalo",
    verticals: ["esim"],
    supports: (city, vertical, context) => vertical === "esim" && Boolean(createUrl(context)),
    createUrl,
    getOffer: (context) => createUrl(context) ? { url: createUrl(context), label: `Get an eSIM for ${context.city.country}` } : null
  });
})(window);
