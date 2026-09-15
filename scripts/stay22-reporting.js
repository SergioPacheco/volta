#!/usr/bin/env node

// Optional local/CI helper. It never runs in the browser and never prints raw
// transactions. The API base URL is deliberately explicit because Stay22's
// docs expose the path and auth contract, but not a public production host.
(async function main() {
  const apiKey = process.env.STAY22_API_KEY;
  if (!apiKey) {
    console.log("Stay22 reporting skipped: STAY22_API_KEY is not configured.");
    return;
  }

  const baseUrl = process.env.STAY22_REPORTING_BASE_URL;
  if (!baseUrl) {
    console.error("Stay22 reporting needs STAY22_REPORTING_BASE_URL; no request was made.");
    process.exitCode = 1;
    return;
  }

  const endpoint = new URL("/v1/reporting/transactions", baseUrl);
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("limit", "500");
  endpoint.searchParams.set("page", "0");
  if (process.env.STAY22_REPORTING_START_DATE) endpoint.searchParams.set("startDate", process.env.STAY22_REPORTING_START_DATE);
  if (process.env.STAY22_REPORTING_END_DATE) endpoint.searchParams.set("endDate", process.env.STAY22_REPORTING_END_DATE);
  if (process.env.STAY22_REPORTING_DATE_FILTER) endpoint.searchParams.set("dateFilter", process.env.STAY22_REPORTING_DATE_FILTER);

  const response = await fetch(endpoint, { headers: { "X-API-KEY": apiKey, accept: "application/json" } });
  if (!response.ok) {
    console.error(`Stay22 reporting failed: HTTP ${response.status}.`);
    process.exitCode = 1;
    return;
  }

  const body = await response.json();
  const rows = Array.isArray(body.data) ? body.data : [];
  const totals = new Map();
  rows.forEach((row) => {
    const campaigns = Array.isArray(row.campaignIds) && row.campaignIds.length
      ? row.campaignIds
      : [row.campaignId || "unattributed"];
    campaigns.forEach((campaign) => {
      const key = [row.provider || "unknown", row.category || "unknown", campaign, row.currency || "USD"].join("\u001f");
      const current = totals.get(key) || { provider: row.provider || "unknown", category: row.category || "unknown", campaign, bookings: 0, commission: 0, currency: row.currency || "USD" };
      current.bookings += 1;
      current.commission += Number.parseFloat(row.commission) || 0;
      totals.set(key, current);
    });
  });

  console.log(JSON.stringify({ bookings: rows.length, metrics: [...totals.values()] }, null, 2));
})().catch((error) => {
  console.error(`Stay22 reporting failed: ${error.message}`);
  process.exitCode = 1;
});
