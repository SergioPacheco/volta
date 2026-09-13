// Demo travel monetization configuration.
// Replace placeholder offers with complete, approved affiliate URLs before
// enabling production links. Placeholder actions never leave the site.
window.YOUCITY_TRAVEL = {
  version: 1,
  demo: true,
  disclosure: {
    short: "Preview only — travel affiliate links will appear here after provider approval.",
    path: "/affiliate-disclosure"
  },
  providers: {
    viator: { category: "experiences", label: "Viator", network: "direct", active: true, placeholder: true },
    travelpayouts: { category: "network", label: "Travelpayouts", network: "travelpayouts", active: true, placeholder: true },
    booking: { category: "hotels", label: "Booking.com", network: "cj", active: true, placeholder: true },
    expedia: { category: "hotels", label: "Expedia", network: "direct", active: true, placeholder: true },
    discovercars: { category: "cars", label: "DiscoverCars", network: "direct", active: true, placeholder: true },
    airalo: { category: "esim", label: "Airalo", network: "direct", active: true, placeholder: true },
    heymondo: { category: "insurance", label: "Heymondo", network: "direct", active: true, placeholder: true },
    skyscanner: { category: "flights", label: "Skyscanner", network: "direct", active: false, placeholder: true, minMonthlyUniqueVisitors: 5000 }
  },
  defaults: {
    categories: {
      experiences: [{ provider: "viator", label: "Tours & experiences", description: "Find things to do in this city", campaign: "youcity-city-plan-trip", placement: "city-plan-trip", priority: 1, active: true, placeholder: true }],
      hotels: [
        { provider: "booking", label: "Find hotels", description: "Stay in this destination", campaign: "youcity-city-plan-trip", placement: "city-plan-trip", priority: 1, active: true, placeholder: true },
        { provider: "expedia", label: "Explore Expedia stays", description: "Hotels and alternative stays", campaign: "youcity-city-plan-trip", placement: "city-plan-trip", priority: 2, active: true, placeholder: true },
        { provider: "travelpayouts", label: "Compare more hotels", description: "Travelpayouts hotel options", campaign: "youcity-city-plan-trip", placement: "city-plan-trip", priority: 3, active: true, placeholder: true }
      ],
      cars: [{ provider: "discovercars", label: "Compare car rentals", description: "Get around at your own pace", campaign: "youcity-city-plan-trip", placement: "city-plan-trip", priority: 1, active: true, placeholder: true }],
      esim: [{ provider: "airalo", label: "Get an eSIM", description: "Stay connected while traveling", campaign: "youcity-city-plan-trip", placement: "city-plan-trip", priority: 1, active: true, placeholder: true }],
      insurance: [{ provider: "heymondo", label: "Travel protected", description: "Explore travel insurance options", campaign: "youcity-more-options", placement: "more-travel-options", priority: 1, active: true, placeholder: true }],
      flights: [{ provider: "travelpayouts", label: "Search flights", description: "Compare flight options", campaign: "youcity-more-options", placement: "more-travel-options", priority: 1, active: true, placeholder: true }]
    }
  },
  byCountry: {},
  byCity: {}
};

// Temporary compatibility alias for the existing map integration.
window.YOUCITY_TRAVEL_RECOMMENDATIONS = window.YOUCITY_TRAVEL;
