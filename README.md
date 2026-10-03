# Global Ecommerce Toolkit

Open-source tools for global ecommerce operators: profitability, ROAS, product validation, paid traffic, store operations, currencies, market research and international expansion.

## Live app

https://global-ecommerce-toolkit.vercel.app

## Why this project exists

Global ecommerce decisions often live across spreadsheets, ad platforms, currency converters and disconnected dashboards. This project brings common operating calculations and workflows into one free, transparent toolkit.

## Current tools

- Profitability calculator
- Break-even ROAS and CPA
- Contribution margin
- Product validation workspace
- Private operator accounts
- Persistent ecommerce workspaces
- Product status tracking
- Portfolio KPI dashboard
- Saved pricing and CPA scenarios
- Scenario comparison
- Product comparison
- Store-level daily operating dashboard
- Shopify order/revenue/refund sync with daily background refresh
- Revenue, profit, margin, ROAS, CPA and AOV reporting
- Daily operating history
- Store-operations CSV export
- Paid traffic calculator for CTR, CPC, CPM, CVR, CPA and ROAS
- UTM builder
- USD/EUR/GBP FX reference converter with manual override
- Calculator CSV export
- Public profitability API
- Market comparison for the United States, United Kingdom and Germany
- Multi-currency store support for USD, EUR, GBP and BRL

## Public API

The calculation engine is available at:

`/api/calculate`

See [docs/API.md](./docs/API.md) for GET and POST examples.

The app also exposes a lightweight FX proxy at `/api/fx` for USD, EUR, GBP and BRL reference rates.

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Vercel
- GitHub Actions

## Getting started

```bash
git clone https://github.com/Rangel0309/global-ecommerce-toolkit.git
cd global-ecommerce-toolkit
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and provide your Supabase project values before using authentication or persistence.

## Data model

The current persistence layer includes:

- profiles
- workspaces
- stores
- products
- product scenarios
- daily store metrics

Store financial reporting remains separated by original store currency, including BRL. The FX tool provides reference conversion for analysis, while accounting-grade cross-currency rollups should preserve the specific rate and date used.

## Security model

User-owned tables use Supabase Row Level Security. Products, workspaces, stores, scenarios and daily metrics are scoped to the authenticated user. Do not expose service-role keys or third-party OAuth secrets in client-side environments.

See [SECURITY.md](./SECURITY.md) for the security policy, [docs/SHOPIFY.md](./docs/SHOPIFY.md) for Shopify setup, and [docs/INTEGRATIONS.md](./docs/INTEGRATIONS.md) for the broader integration architecture.

## Project principles

1. Useful for real ecommerce operators
2. Calculations are transparent and documented
3. No vendor lock-in
4. Community contributions are welcome
5. Financial outputs are estimates, not tax or accounting advice

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## Contributing

Issues, feature requests and pull requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before contributing.

## License

MIT. See [LICENSE](./LICENSE).
