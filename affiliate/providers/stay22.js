(function registerStay22(global) {
  const ENDPOINTS = {
    hotels: "https://www.stay22.com/allez/roam",
    activities: "https://www.stay22.com/allez/getyourguide"
  };
  const VERTICALS = Object.keys(ENDPOINTS);

  function providerConfig() {
    return global.YouCityAffiliate.getProviderConfig("stay22");
  }

  function isEnabled() {
    const config = global.YOUCITY_AFFILIATE_CONFIG || {};
    const provider = providerConfig();
    return config.enabled !== false
      && config.features?.providers?.stay22 !== false
      && provider.enabled !== false
      && provider.configured === true;
  }

  function supports(city, vertical) {
    return isEnabled()
      && VERTICALS.includes(vertical)
      && Boolean(city?.name)
      && Boolean(city?.country);
  }

  function createCampaign(context) {
    const citySlug = global.YouCityAffiliate.slugify(context.city.name);
    const countryCode = global.YouCityAffiliate.slugify(context.city.countryCode || context.city.country);
    return `yc_${citySlug}_${countryCode}_${context.vertical}`;
  }

  const provider = {
    id: "stay22",
    name: "Stay22",
    verticals: VERTICALS,
    supports,
    createUrl(context) {
      if (!supports(context?.city, context?.vertical)) return "";
      const config = providerConfig();
      const endpoint = ENDPOINTS[context.vertical];
      if (!config.aid || !endpoint) return "";
      const url = new URL(endpoint);
      url.searchParams.set("aid", config.aid);
      url.searchParams.set("address", `${context.city.name}, ${context.city.country}`);
      url.searchParams.set("campaign", createCampaign(context));
      return url.toString();
    },
    getOffer(context) {
      const url = provider.createUrl(context);
      if (!url) return null;
      return {
        provider: "stay22",
        vertical: context.vertical,
        url,
        available: true,
        label: context.vertical === "activities"
          ? `Things to do in ${context.city.name}`
          : `Hotels in ${context.city.name}`
      };
    }
  };

  global.YouCityAffiliate.registerProvider(provider);
})(window);
