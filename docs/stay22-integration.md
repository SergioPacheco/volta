# Stay22 integration

YouCity uses Stay22 AID `youcity` through the existing Affiliate Engine. The
integration is dynamic: it builds URLs from `context.city.name`,
`context.city.country` and the existing country code/coordinates when a
feature needs them. No Stay22 city catalog is maintained.

## Live capabilities

| Capability | Status | Implementation |
| --- | --- | --- |
| Hotels / Roam | READY | `/allez/roam` |
| Vacation rentals | READY | `/allez/roam?provider=vrbo` |
| Activities / GetYourGuide | READY | `/allez/getyourguide` |
| Accommodation Search | READY | `/allez/searchbar` with validated dates |
| Accommodation Map | READY | Lazy `/embed/gm` iframe, opened on demand |
| Cars | NEEDS_EXTERNAL_CONFIGURATION | DiscoverCars remains the active car link |
| Flights | NEEDS_EXTERNAL_CONFIGURATION | No documented origin/destination construction is used |
| Roam experiments | READY | Validated `provider` and `excludeproviders`, opt-in only |
| Stay22 Script | READY | Domain-specific Hub snippet is installed in `index.html` |
| Nova | READY_VIA_SCRIPT | Managed by the official Stay22 Script |
| Spark | READY_VIA_SCRIPT | Managed by the official Stay22 Script |
| LinkSwap | READY_VIA_SCRIPT | Managed by the official Stay22 Script |
| Connected Trips | SUPPORTED_AUTOMATICALLY | Session-based Stay22/Booking behavior |
| Retail | ACCOUNT_NOT_ENABLED | Script is active, but the Retail confirmation is absent |
| YouTube monetization | OUT_OF_SCOPE | Not implemented |

## URLs and campaign tracking

The provider preserves the real destination text, including accents:

```text
https://www.stay22.com/allez/roam?aid=youcity&address=Granada%2C+Spain&campaign=yc_granada_es_hotels_travelplanner
https://www.stay22.com/allez/getyourguide?aid=youcity&address=S%C3%A3o+Paulo%2C+Brazil&campaign=yc_sao-paulo_br_activities_travelplanner
https://www.stay22.com/allez/searchbar?aid=youcity&address=Tokyo%2C+Japan&checkin=2099-06-10&checkout=2099-06-15&campaign=yc_tokyo_jp_hotel-search_travelplanner
https://www.stay22.com/embed/gm?aid=youcity&address=Tokyo%2C+Japan&campaign=yc_tokyo_jp_hotels_map
```

Only campaign values are ASCII-normalized. The standard shape is
`yc_<citySlug>_<countryCode>_<vertical>_<placement>`.

Roam is the default for accommodation. Vacation rentals use the same
Stay22 monetization path with the validated `vrbo` provider. `provider` is
otherwise only emitted for a validated provider in the explicit configuration
or an enabled experiment.
The supported configuration shape is:

```js
stay22: {
  roam: {
    forceProvider: null,
    excludeProviders: []
  }
}
```

The current experiment definitions are `stay22_roam`, `stay22_booking` and
`stay22_expedia`. Both the global experiment switch and the Stay22 experiment
switch must be enabled; the default is disabled.

## Search and map

The Travel Planner keeps the regular “Hotels in <city>” Roam link, adds a
separate vacation-rental link routed to VRBO, and adds an optional
accommodation search form. Search only produces a URL when both dates
are valid, are in `YYYY-MM-DD`, are not in the past, and checkout is after
check-in. Adults and children are optional and are passed only when valid.

“View stays on map” creates the iframe only after the user clicks. It uses
`loading="lazy"`, is responsive, and is destroyed when the city changes or the
panel closes. Map-open and search-submit events use the existing analytics
adapter as `affiliate_map_open` and `affiliate_search_submit`; no second
analytics system was added and complete dates are not recorded.

## Cars and flights

Stay22’s current provider documentation lists Booking.com for accommodation,
activities and cars, and Expedia for accommodation, cars and flights. It does
not provide enough of a destination-search contract for YouCity’s requested
car category selection or flight origin/destination/date search. The code does
not turn `/allez/booking` or `/allez/expedia` into an arbitrary car/flight link.

Consequently the Stay22 car and flight flags are `false` and their status is
`NEEDS_EXTERNAL_CONFIGURATION`. DiscoverCars remains available and is not
replaced. Expedia and other existing providers remain registered and are still
resolved when their own approved configuration is supplied.

## Script, Nova, Spark and LinkSwap

The Hub-generated Stay22 Script is installed in `index.html` immediately before
`</head>`. It must remain the exact unmodified snippet generated in Stay22 Hub
→ Script Builder for the YouCity domain. Do not replace it with a guessed URL
or snippet.

Nova, Spark and LinkSwap are represented as `managed-by-stay22` metadata in
`providers.stay22.stay22Automation`. They are not reimplemented by YouCity. Before enabling the
official script in production, test staging links for DiscoverCars, direct
Expedia, Viator, Travelpayouts and other Affiliate Engine links; keep the
original provider in YouCity’s click payload before navigation and document any
LinkSwap impact.

Connected Trips is not a provider module. A Stay22 accommodation session may
produce additional supported Booking.com category revenue. It is an internal
mechanism and is not shown as a user-facing product. Airport Taxi is not added
because it is not available as an Allez Generator product; any eligible session
revenue is automatic.

Retail is not added to the Travel Planner. It is account-controlled through
Nova/Stay22 rollout. The current production Console confirms the script is
active but does not show Stay22’s Retail-enabled indication, so YouCity reports
`ACCOUNT_NOT_ENABLED`. This is not treated as a YouCity error.

## Feature flags

Individual public flags live at `config.features.stay22`:

```js
{
  hotels: true,
  activities: true,
  searchbar: true,
  map: true,
  cars: false,
  flights: false,
  script: true
}
```

The provider-level `features` object is also retained as a local override for
safe staged rollout. No flag removal is required to disable a capability.

## Reporting preparation

`npm run stay22:report` is a local/CI-only optional helper. It requires
`STAY22_API_KEY` and an explicitly supplied `STAY22_REPORTING_BASE_URL`; it
sends the key only in the `X-API-KEY` header. Without the key it exits
successfully with a friendly message. It prints only aggregate metrics by
provider, category, campaign and currency, never booking IDs, personal data or
raw transactions. The key must be supplied by a secret manager or CI secret,
never by frontend JavaScript or `affiliate-config.js`.

Stay22 Hub remains the source of truth for transactions, status, commission and
conversion reporting. The official reporting contract is the protected
`GET /v1/reporting/transactions` endpoint.

## External setup still required

1. Validate LinkSwap against the existing affiliate providers in staging.
2. Confirm Retail eligibility with Stay22 if the exact Console indication is absent.
3. If Stay22 provides a documented Cars/Flights Generator contract suitable for
   this UI, add the approved construction details and enable those flags.
4. If reporting is desired, configure the API key and reporting base URL only
   in local/CI secret storage.
