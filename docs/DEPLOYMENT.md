# Deployment

The recommended production setup is:

- GitHub for source control
- Vercel for the Next.js application
- Supabase for authentication and persisted operator data

## Environment variables

Configure these in Vercel after creating the Supabase project:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never commit private service-role keys to the repository.

## Vercel

Import the GitHub repository into Vercel and keep the default Next.js build settings.

Production deploys should follow the `main` branch.

## Supabase

The first persistence milestone will store:

- user profiles
- ecommerce workspaces
- products
- profitability scenarios

Row Level Security should be enabled on user-owned tables before production use.
