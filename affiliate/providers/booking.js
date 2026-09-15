(function registerBooking(global) {
  const createUrl = (context) => global.YouCityAffiliate.createConfiguredUrl("booking", context);
  global.YouCityAffiliate.registerProvider({
    id: "booking",
    name: "Booking.com",
    verticals: ["hotels"],
    supports: (city, vertical, context) => vertical === "hotels" && Boolean(createUrl(context)),
    createUrl,
    getOffer: (context) => createUrl(context) ? { url: createUrl(context), label: `Find hotels in ${context.city.name}` } : null
  });
})(window);
