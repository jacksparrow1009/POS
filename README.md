# Awan POS

A multi-branch retail POS SaaS built with Next.js, TypeScript, Tailwind CSS, and a Supabase-ready backend plan.

## V1 Goal

Help a small or medium retail store sign up, create a business, configure a branch, import products, add opening stock, open a register, make sales, and review sales/profit.

## Current State

- Next.js app scaffolded with the App Router.
- First operational dashboard/POS workspace built with seeded retail data.
- Backend blueprint added in `docs/backend-blueprint.md`.
- Supabase client helpers added in `src/lib/supabase`.
- Initial SQL migrations added in `supabase/migrations`.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Next Build Steps

1. Create a Supabase project and copy credentials into `.env.local`.
2. Apply the migrations in `supabase/migrations`.
3. Implement authentication and organization onboarding.
4. Replace seeded UI data with tenant-scoped queries.
5. Build POS sale creation, inventory movements, and receipt printing.

## Supabase Environment

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Apply Database Schema

Option A, Supabase SQL Editor:

1. Open your Supabase project dashboard.
2. Go to SQL Editor.
3. Paste and run `supabase/apply-all.sql`.

Option B, Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Use the project ref from your Supabase project URL. For example, in
`https://abcdefghijk.supabase.co`, the ref is `abcdefghijk`.
