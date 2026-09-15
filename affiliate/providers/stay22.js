(function registerStay22(global) {
  const ENDPOINT = "https://www.stay22.com/allez/roam";

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
      && vertical === "hotels"
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
    verticals: ["hotels"],
    supports,
    createUrl(context) {
      if (!supports(context?.city, context?.vertical)) return "";
      const config = providerConfig();
      if (!config.aid) return "";
      const url = new URL(ENDPOINT);
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
        vertical: "hotels",
        url,
        available: true,
        label: `Hotels in ${context.city.name}`
      };
    }
  };

  global.YouCityAffiliate.registerProvider(provider);
})(window);
