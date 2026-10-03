# Global Ecommerce Toolkit

Open-source tools for global ecommerce operators: profitability, ROAS, product validation, market research and international expansion.

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
- Market comparison for the United States, United Kingdom and Germany
- Multi-currency display for USD, EUR and GBP

## Live app

The current production build is deployed on Vercel.

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Vercel

## Getting started

```bash
git clone https://github.com/Rangel0309/global-ecommerce-toolkit.git
cd global-ecommerce-toolkit
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and provide your Supabase project values before using authentication or persistence.

## Security model

User-owned tables use Supabase Row Level Security. Products, workspaces and scenarios are scoped to the authenticated user. Do not expose service-role keys in client-side environments.

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
