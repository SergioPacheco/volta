# YouCity Affiliate Engine

The travel monetization layer is a browser-side, static architecture. The
application asks for offers by vertical and does not know how any provider URL
is built.

## Architecture

```text
City
  -> Travel Planner / map placement
  -> Affiliate Engine
  -> Resolver
  -> Ranking strategy
  -> Provider contract
  -> tracked affiliate URL
```

The modules are loaded in `index.html` before `app.js`:

- `affiliate/affiliate-config.js` — feature flags, provider status, public IDs,
  priorities, vertical declarations, disclosure and ranking selection.
- `affiliate/affiliate-engine.js` — provider registry, normalized context and
  public engine API.
- `affiliate/affiliate-catalog.js` — catalog lookup and manual override lookup;
  it does not contain affiliate credentials.
- `affiliate/affiliate-resolver.js` — filters enabled/configured providers,
  checks vertical and city support, validates HTTPS URLs and ranks offers.
- `affiliate/affiliate-experiments.js` — default and weighted A/B strategy
  hooks. A/B is opt-in and disabled initially.
- `affiliate/affiliate-tracking.js` — internal impressions/clicks,
  fail-safe analytics and provider query-parameter decoration.
- `affiliate/providers/*.js` — one provider contract per partner.

`app.js` only adapts city data to the common context, renders vertical cards,
observes visible offers and delegates click tracking. The map uses the same
resolver with a different placement.

## Provider contract

Each provider registers an object with `id`, `name`, `verticals`, `supports`,
`createUrl` and `getOffer`:

```js
window.YouCityAffiliate.registerProvider({
  id: "new-provider",
  name: "New Provider",
  verticals: ["hotels"],
  supports(city, vertical, context) { return vertical === "hotels"; },
  createUrl(context) { return "https://approved.example/..."; },
  getOffer(context) { return { url: this.createUrl(context) }; }
});
```

The supplied non-DiscoverCars providers have a safe configuration-driven URL
builder. They return no offer until `configured: true` and an approved
`urlTemplate` are supplied. Templates can use `{city}`, `{cityId}`,
`{country}`, `{countryCode}` and `{vertical}`. No provider ID or URL is
invented by the application.

## Verticals

The initial identifiers are `hotels`, `flights`, `cars`, `activities`, `esim`
and `insurance`. The resolver already accepts future identifiers such as
`transfers`, `trains`, `buses`, `cruises`, `restaurants`, `tickets` and
`events` without changing the UI or engine.

Current provider declarations:

| Vertical | Providers |
| --- | --- |
| hotels | Expedia, Booking.com, Travelpayouts |
| flights | Expedia, Travelpayouts |
| cars | DiscoverCars |
| activities | Expedia, Viator |
| esim | Airalo |
| insurance | Heymondo |

At the current rollout: DiscoverCars is `READY`; Expedia, Booking.com,
Viator, Travelpayouts, Airalo and Heymondo are `AWAITING_AFFILIATE_ID` and
remain unconfigured, so they produce no URL or placeholder card.

## Context and resolver

Use `YouCityAffiliate.createContext(city, vertical, options)` and then
`YouCityAffiliate.getAffiliateOffers(context)`. The normalized context
contains `city.id`, `city.name`, `city.country`, `city.countryCode`,
`vertical`, `placement`, `language`, `device`, `mode` and a `tracking` object.

The resolver returns offers with `provider`, `name`, `vertical`, `url`,
`available`, `priority`, `variant` and `placement`. A provider is omitted when
it is disabled, unconfigured, incompatible with the vertical, unavailable in
the destination catalog, or unable to produce a valid HTTPS URL.

## Configuration and feature flags

Edit `affiliate/affiliate-config.js` to change rollout and priority:

```js
providers: {
  booking: {
    enabled: true,
    configured: true,
    priority: 80,
    urlTemplate: "https://approved-booking-link.example/?city={city}"
  }
}
```

The public feature flag is `features.providers.booking`. Set it to `false`,
or set the provider's `enabled` to `false`, to hide a provider without
changing the interface. `configured: false` is the correct state while an
affiliate ID or approved URL is still pending.

## Catalog and overrides

Provider configuration and destination data are separate. DiscoverCars reads
the generated `discovercars-locations.js`, which is derived from the official
catalog and only exposes `VERIFIED` city-level matches. Ambiguous and missing
localities never fall back to the provider homepage. Its public `a_aid=youcity`
is configured in the provider configuration, not in the destination records.

Generic override source data lives in `data/affiliate-overrides.json`; the
static build generates the browser bundle `affiliate-overrides.js`. An override
can map a city key to a provider-specific destination, for example:

```json
{
  "sao-paulo-br": { "discovercars": { "path": "/brazil/sao-paulo" } }
}
```

The current city catalog does not contain Granada, so no Granada link is
generated. Adding a city later still requires both a YouCity city record and a
verified provider catalog match.

## Tracking and attribution

The common tracking layer emits `affiliate_impression` only after an offer is
visible (IntersectionObserver, with a safe fallback) and emits
`affiliate_click` before the existing anchor navigates. Payloads contain
provider, vertical, city, country, placement, variant, provider campaign and
internal campaign fields. Analytics exceptions are caught and never block a
new-tab navigation.

Provider attribution is distinct. A provider may configure a query mapping,
for example `tracking.query: { subid: "providerCampaign" }`; the URL builder
then copies only configured context values. No secret, token or private API key
belongs in this static frontend.

## Experiments and future ranking

The active strategy is `default`, which sorts by configured priority. The
registered `ab-test` strategy understands per-vertical provider weights and
can choose a weighted offer later; it is not active now and the current UI
continues to render all resolved offers.

The extension point is `YouCityAffiliate.registerRankingStrategy(id, strategy)`
where a strategy implements `rank(offers, context)`. A future statistical or
AI strategy can be registered and selected through `ranking.strategy` without
changing Travel Planner markup or provider modules. No AI, external model,
prompt or API key is present in the current frontend.

The resolver is also the seam for a future remote resolver. A later adapter
can replace `getAffiliateOffers(context)` with `/api/affiliate/recommendations`
while returning the same offer shape to the existing UI.

## Adding or disabling a provider

1. Create and register a provider module with the common contract.
2. Add its public configuration, verticals and priority.
3. Supply only the approved public affiliate URL/template and attribution
   mapping; set `configured: true`.
4. Set `features.providers.<id>` or `providers.<id>.enabled` to `false` to
   disable it later.

No change to `app.js`, city navigation or Travel Planner is required for a
normal provider addition.
