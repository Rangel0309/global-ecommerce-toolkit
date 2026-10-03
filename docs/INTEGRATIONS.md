# Integration architecture

The toolkit is designed so manual operating entries work first, while external platforms can later replace or enrich the same data model.

## Shopify

Planned responsibilities:

- import orders and gross sales
- import refunds
- map stores to toolkit workspaces
- optionally derive product revenue and order counts
- synchronize on a schedule without exposing Admin API credentials to the browser

Recommended implementation:

1. OAuth or a custom-app token stored only in a server-side secret store.
2. A server-side sync job or Supabase Edge Function.
3. Normalize imported values into the existing `stores` and `daily_metrics` model.
4. Preserve manual overrides and an audit trail.

## Google Ads

Planned responsibilities:

- import daily ad spend
- import campaign names and status
- import clicks, conversions and conversion value
- map ad accounts to toolkit stores

Recommended implementation:

1. Google OAuth on the server.
2. Store refresh tokens encrypted and never in client-side environment variables.
3. Run scheduled synchronization.
4. Keep raw imported campaign data separate from calculated operating KPIs.

## Meta Ads

The same pattern should be used for Meta Ads: server-side OAuth, encrypted tokens, scheduled sync, and normalized daily metrics.

## Exchange rates

Cross-currency aggregation must not simply add USD, EUR and GBP together. A future exchange-rate provider should:

- store the rate and timestamp used
- keep the original store currency
- support a user-selected reporting currency
- allow manual overrides for finance reconciliation

## Security rules

- Never expose service-role keys, OAuth client secrets, refresh tokens or store admin tokens in browser code.
- Public/publishable keys may be used client-side only for services designed for that purpose.
- All user-owned database tables should retain Row Level Security.
- External webhooks must verify signatures before accepting data.
