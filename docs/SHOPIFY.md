# Shopify integration

The production app supports connecting a Shopify store and importing the last 60 days of order totals, order counts and refunds into the existing store operations dashboard.

## What the sync imports

For each order date:

- gross order revenue from `totalPriceSet`
- number of orders
- refunded amount from `totalRefundedSet`

The sync intentionally preserves manually entered:

- ad spend
- COGS
- payment/platform fees
- other operating costs
- notes

This lets Shopify own sales/refund data while paid-media and supplier data can be integrated separately.

## Shopify app setup

This project runs outside Shopify admin, so the implemented connection uses Shopify's authorization code grant.

1. Open the Shopify Dev Dashboard.
2. Create an app for the integration.
3. Create/release an app version with these scopes:
   - `read_orders`
   - `read_products`
4. Configure the production app URL:
   - `https://global-ecommerce-toolkit.vercel.app`
5. Configure this exact allowed redirect URL:
   - `https://global-ecommerce-toolkit.vercel.app/api/shopify/callback`
6. For a single live store, Custom distribution is appropriate. Generate the install link for the target store.
7. In the app Settings page, copy the Client ID and Client secret.

## Vercel environment variables

Add these server-side variables to the Vercel project:

```
APP_URL=https://global-ecommerce-toolkit.vercel.app
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
SHOPIFY_TOKEN_ENCRYPTION_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

The existing public Supabase variables must remain configured:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### Generate the encryption key

Generate a random 32-byte key and store only the base64 value in Vercel.

macOS/Linux:

```bash
openssl rand -base64 32
```

PowerShell with Node.js installed:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Do not commit the generated value to GitHub.

## User flow

After the environment variables are deployed:

1. Sign in to Global Ecommerce Toolkit.
2. Create/select a store in Operations.
3. Enter its permanent `.myshopify.com` domain.
4. Click **Connect Shopify**.
5. Approve the requested Shopify scopes.
6. Shopify redirects back to the toolkit.
7. Click **Sync Shopify now**.

## Token security

- Shopify access and refresh tokens never go to browser JavaScript.
- Tokens are encrypted with AES-256-GCM before they are stored.
- Token-bearing database tables have Row Level Security enabled without client policies, so browser clients cannot query them.
- Public apps request expiring offline tokens and rotate refresh tokens before expiry.
- The Shopify Client secret, encryption key and Supabase service-role key are server-only environment variables.

## API version

The integration targets Shopify GraphQL Admin API `2026-10`.

## Current sync horizon

The integration imports the most recent 60 days because Shopify makes the last 60 days of orders available through the normal `read_orders` scope. Importing older orders requires the additional `read_all_orders` permission and Shopify approval.

## Background synchronization

A Vercel Cron job is already configured in `vercel.json` to run once per day at 10:00 UTC. Vercel sends the request to `/api/shopify/cron`, which requires `CRON_SECRET`.

The cron processes connected stores sequentially and reuses the same sync engine as the manual **Sync Shopify now** button.

## Future work

- Shopify webhooks for order/refund changes
- product catalog import
- per-product sales attribution
- COGS mapping from products/suppliers
- Google Ads and Meta Ads spend sync
