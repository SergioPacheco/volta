// Public, static affiliate configuration. Never put private credentials here.
window.YOUCITY_AFFILIATE_CONFIG = {
  version: 1,
  enabled: true,
  debug: false,
  disclosure: {
    short: "Some travel links are affiliate links. YouCity may earn a commission if you make a booking, at no additional cost to you.",
    path: "/affiliate-disclosure"
  },
  countryCodes: {
    Argentina: "AR",
    Australia: "AU",
    Austria: "AT",
    Brazil: "BR",
    Bulgaria: "BG",
    Canada: "CA",
    China: "CN",
    Cuba: "CU",
    Czechia: "CZ",
    "Dominican Republic": "DO",
    Egypt: "EG",
    England: "GB",
    France: "FR",
    Germany: "DE",
    Greece: "GR",
    Guatemala: "GT",
    Hungary: "HU",
    India: "IN",
    Indonesia: "ID",
    Iran: "IR",
    Ireland: "IE",
    Israel: "IL",
    Italy: "IT",
    Japan: "JP",
    Korea: "KR",
    Malaysia: "MY",
    Mexico: "MX",
    Monaco: "MC",
    Netherlands: "NL",
    "New Zealand": "NZ",
    "Northern Ireland": "GB",
    Norway: "NO",
    Pakistan: "PK",
    Philippines: "PH",
    Poland: "PL",
    Portugal: "PT",
    Qatar: "QA",
    Russia: "RU",
    Senegal: "SN",
    Singapore: "SG",
    Slovenia: "SI",
    "South Africa": "ZA",
    Spain: "ES",
    Sweden: "SE",
    Switzerland: "CH",
    Taiwan: "TW",
    Turkey: "TR",
    UAE: "AE",
    UK: "GB",
    USA: "US",
    Ukraine: "UA",
    Uruguay: "UY",
    Uzbekistan: "UZ"
  },
  features: {
    providers: {
      expedia: true,
      booking: true,
      viator: true,
      discovercars: true,
      travelpayouts: true,
      airalo: true,
      heymondo: true,
      stay22: true
    }
  },
  providers: {
    expedia: {
      name: "Expedia",
      enabled: true,
      configured: false,
      priority: 80,
      verticals: ["hotels", "flights", "activities"]
    },
    booking: {
      name: "Booking.com",
      enabled: true,
      configured: false,
      priority: 80,
      verticals: ["hotels"]
    },
    viator: {
      name: "Viator",
      enabled: true,
      configured: false,
      priority: 100,
      verticals: ["activities"]
    },
    discovercars: {
      name: "DiscoverCars",
      enabled: true,
      configured: true,
      priority: 100,
      verticals: ["cars"],
      affiliateId: "youcity"
    },
    travelpayouts: {
      name: "Travelpayouts",
      enabled: true,
      configured: false,
      priority: 80,
      verticals: ["flights", "hotels"]
    },
    airalo: {
      name: "Airalo",
      enabled: true,
      configured: false,
      priority: 100,
      verticals: ["esim"]
    },
    heymondo: {
      name: "Heymondo",
      enabled: true,
      configured: false,
      priority: 100,
      verticals: ["insurance"]
    },
    stay22: {
      name: "Stay22",
      enabled: true,
      configured: true,
      priority: 100,
      verticals: ["hotels"],
      aid: "youcity"
    }
  },
  ranking: {
    strategy: "default"
  },
  experiments: {
    enabled: false,
    byVertical: {}
  }
};

// Temporary compatibility alias for integrations that still read the old name.
window.YOUCITY_TRAVEL = window.YOUCITY_AFFILIATE_CONFIG;
window.YOUCITY_TRAVEL_RECOMMENDATIONS = window.YOUCITY_AFFILIATE_CONFIG;
