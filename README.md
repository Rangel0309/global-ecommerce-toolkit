# Global Ecommerce Toolkit

Open-source tools for global ecommerce operators: profitability, ROAS, product validation, store operations, market research and international expansion.

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
- Store-level daily operating dashboard
- Revenue, profit, margin, ROAS, CPA and AOV reporting
- Daily operating history
- UTM builder
- Calculator CSV export
- Market comparison for the United States, United Kingdom and Germany
- Multi-currency store support for USD, EUR and GBP

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

Financial reporting remains separated by store currency. USD, EUR and GBP are not added together until an exchange-rate provider is implemented.

## Security model

User-owned tables use Supabase Row Level Security. Products, workspaces, stores, scenarios and daily metrics are scoped to the authenticated user. Do not expose service-role keys or third-party OAuth secrets in client-side environments.

See [docs/INTEGRATIONS.md](./docs/INTEGRATIONS.md) for the planned Shopify, Google Ads and Meta Ads integration architecture.

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
