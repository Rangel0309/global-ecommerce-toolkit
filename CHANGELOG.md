# Changelog

All notable changes to this project will be documented here.

## 0.3.0 - Store operations

### Added
- Store-level operating dashboard
- Daily revenue, order, ad spend, COGS, fee, refund and other-cost entries
- Revenue, profit, margin, ROAS, CPA and AOV reporting
- 7, 14 and 30 day store views
- Daily performance trend visualization
- Editable operating-day history
- Multi-store support with separate store currencies
- Store-operations CSV export
- Product comparison table
- Scenario comparison table
- Paid traffic metrics calculator for CTR, CPC, CPM, CVR, CPA and ROAS
- Calculator CSV export
- UTM builder
- USD/EUR/GBP FX reference converter with manual override
- Keyless server-side FX proxy endpoint
- Public profitability API at /api/calculate
- Sticky quick navigation for the main tools
- GitHub Actions build validation
- Security policy
- Integration architecture documentation for Shopify, Google Ads and Meta Ads

### Security
- Added relationship-aware Row Level Security for stores and daily metrics
- Added supporting foreign-key indexes
- Kept store financial KPIs separated by original currency instead of silently mixing USD, EUR and GBP

## 0.2.0 - Operator workspace

### Added
- Supabase authentication and persistent user data
- Automatic private workspace creation
- Portfolio KPI dashboard
- Product create, load, update and delete workflow
- Product operating statuses: idea, testing, winner, paused and failed
- Saved pricing and CPA scenarios
- Row Level Security policies for user-owned data
- Supporting database indexes and hardened signup trigger permissions

## 0.1.0 - Initial public foundation

### Added
- Ecommerce profitability calculator
- Break-even CPA and ROAS calculations
- Product signal score
- Market research workspace for US, UK and Germany
- USD, EUR and GBP display modes
- Contribution guidelines and public roadmap
