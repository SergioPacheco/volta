(function initializeAffiliateExperiments(global) {
  function hash(value) {
    let result = 2166136261;
    for (const character of String(value)) {
      result ^= character.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0) / 4294967296;
  }

  function weightsFor(context) {
    return global.YOUCITY_AFFILIATE_CONFIG?.experiments?.byVertical?.[context.vertical]?.providers || {};
  }

  const defaultRanking = {
    id: "default",
    rank(offers) {
      return [...offers].sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
    }
  };

  const abTestRanking = {
    id: "ab-test",
    rank(offers, context) {
      const weights = weightsFor(context);
      return [...offers]
        .map((offer) => ({ ...offer, experimentWeight: Number(weights[offer.provider]?.weight || 0) }))
        .sort((a, b) => (b.experimentWeight - a.experimentWeight) || (Number(b.priority || 0) - Number(a.priority || 0)));
    },
    choose(offers, context) {
      if (!offers.length) return null;
      const weights = weightsFor(context);
      const total = offers.reduce((sum, offer) => sum + Number(weights[offer.provider]?.weight || 0), 0);
      if (!total) return offers[0];
      let cursor = hash(`${context.city.id}:${context.vertical}`) * total;
      return offers.find((offer) => {
        cursor -= Number(weights[offer.provider]?.weight || 0);
        return cursor < 0;
      }) || offers[offers.length - 1];
    }
  };

  global.YouCityAffiliate.registerRankingStrategy("default", defaultRanking);
  global.YouCityAffiliate.registerRankingStrategy("ab-test", abTestRanking);
  global.YouCityAffiliateExperiments = { defaultRanking, abTestRanking };
})(window);
