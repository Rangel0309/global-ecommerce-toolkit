# Security Policy

## Supported version

The latest production version and the current `main` branch receive security fixes.

## Reporting a vulnerability

Please do not publish exploitable security details in a public issue. Prefer GitHub's private vulnerability reporting / security advisory flow when available.

Include:

- affected area
- reproduction steps
- expected impact
- suggested mitigation if known

## Deployment checklist

Production deployments should:

- keep Supabase service-role keys server-side only
- keep Shopify, Google Ads and Meta OAuth secrets server-side only
- use Row Level Security for user-owned database tables
- verify webhook signatures
- enable leaked-password protection in Supabase Auth when available for the project plan
- use HTTPS for all production traffic
- rotate third-party credentials after suspected exposure

The browser application should only receive publishable/public keys explicitly designed for client-side use.
