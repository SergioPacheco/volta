(function registerViator(global) {
  const createUrl = (context) => global.YouCityAffiliate.createConfiguredUrl("viator", context);
  global.YouCityAffiliate.registerProvider({
    id: "viator",
    name: "Viator",
    verticals: ["activities"],
    supports: (city, vertical, context) => vertical === "activities" && Boolean(createUrl(context)),
    createUrl,
    getOffer: (context) => createUrl(context) ? { url: createUrl(context), label: `Things to do in ${context.city.name}` } : null
  });
})(window);
