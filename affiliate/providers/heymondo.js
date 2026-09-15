(function registerHeymondo(global) {
  const createUrl = (context) => global.YouCityAffiliate.createConfiguredUrl("heymondo", context);
  global.YouCityAffiliate.registerProvider({
    id: "heymondo",
    name: "Heymondo",
    verticals: ["insurance"],
    supports: (city, vertical, context) => vertical === "insurance" && Boolean(createUrl(context)),
    createUrl,
    getOffer: (context) => createUrl(context) ? { url: createUrl(context), label: `Travel insurance for ${context.city.name}` } : null
  });
})(window);
