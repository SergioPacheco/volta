(function registerExpedia(global) {
  const createUrl = (context) => global.YouCityAffiliate.createConfiguredUrl("expedia", context);
  global.YouCityAffiliate.registerProvider({
    id: "expedia",
    name: "Expedia",
    verticals: ["hotels", "flights", "activities"],
    supports: (city, vertical, context) => ["hotels", "flights", "activities"].includes(vertical) && Boolean(createUrl(context)),
    createUrl,
    getOffer: (context) => createUrl(context) ? { url: createUrl(context), label: `Explore ${context.vertical} in ${context.city.name}` } : null
  });
})(window);
