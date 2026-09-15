(function registerTravelpayouts(global) {
  const createUrl = (context) => global.YouCityAffiliate.createConfiguredUrl("travelpayouts", context);
  global.YouCityAffiliate.registerProvider({
    id: "travelpayouts",
    name: "Travelpayouts",
    verticals: ["flights", "hotels"],
    supports: (city, vertical, context) => ["flights", "hotels"].includes(vertical) && Boolean(createUrl(context)),
    createUrl,
    getOffer: (context) => createUrl(context) ? { url: createUrl(context), label: `Compare ${context.vertical} for ${context.city.name}` } : null
  });
})(window);
