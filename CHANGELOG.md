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
- Scenario comparison table
- Calculator CSV export
- UTM builder
- GitHub Actions build validation
- Integration architecture documentation for Shopify, Google Ads and Meta Ads

### Security
- Added relationship-aware Row Level Security for stores and daily metrics
- Added supporting foreign-key indexes
- Kept cross-currency store totals separate until an exchange-rate source exists

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
