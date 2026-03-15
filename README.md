Deployed on https://budget-app-ashen.vercel.app/

# RWY

RWY is a bilingual personal budgeting app built with React, Vite, Tailwind, and Supabase. The current app covers authentication, onboarding, transaction tracking, monthly budget planning, CSV export, and an assisted transaction import flow with a premium-style product story.

## What ships today

- Supabase email auth with protected routes and automatic profile bootstrapping
- Three-step onboarding for name, monthly budget, and default category allocation
- Dashboard with monthly income, expenses, remaining budget, recent transactions, spending chart, and budget bucket progress
- Transaction management with create, edit, delete, search, type filtering, and month filtering
- Import workspace for transaction files with review-before-save editing
- Monthly budget editor with category allocation sliders/inputs and automatic balancing into `Other`
- Settings page with profile editing, language switching, CSV export, plan teaser, and sign out
- English and French localization, persisted through profile data and local storage
- Responsive desktop sidebar and mobile bottom navigation

## Import flow

The app includes a transaction import workspace at `/transactions/import`.

- Exact CSV and JSON files can be imported directly when they use canonical transaction fields
- Irregular CSV/JSON files, XLSX files, PDFs, and images fall back to Gemini-assisted extraction
- Every imported row is reviewed in-app before saving
- Users can correct merchant, amount, type, category, date, time, and notes before import
- Confidence badges and model warnings help highlight rows that need attention

Direct import works best when your file includes fields such as:

- `type`
- `amount`
- `merchant`
- `category`, `categoryName`, or `categoryId`
- `transactionDate` or `date`
- Optional `transactionTime` or `time`
- Optional `note`

## Premium positioning

For product messaging, the import experience should be treated as a premium feature.

- Gemini-assisted transaction import is the premium feature story in the current README
- The Settings page already includes a premium teaser card
- The import UI also includes a disabled Plaid teaser for future banking integrations

Important implementation note:

- There is no billing or entitlement enforcement yet
- Plaid sync is not implemented yet
- Import is available in the current build, but the README positions it as premium

## Routes

- `/login`
- `/onboarding`
- `/dashboard`
- `/transactions`
- `/transactions/import`
- `/transactions/new`
- `/transactions/:id/edit`
- `/budgets`
- `/settings`

## Stack

- React 19
- Vite 8
- TypeScript
- React Router 7
- TanStack Query 5
- Tailwind CSS
- Radix UI primitives for selected controls
- Supabase Auth + Postgres
- react-hook-form + zod
- Recharts
- i18next + react-i18next
- sonner
- lucide-react
- Vitest + Testing Library
- Gemini via the Google Generative Language API for assisted imports

## Environment variables

Create a `.env` file in the project root. You can start from [`.env.example`](/D:/budget-app/.env.example) and add the missing values.

Required:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

These two values are expected to be public in a browser app. They are not secrets.

- `VITE_SUPABASE_URL` identifies your Supabase project
- `VITE_SUPABASE_ANON_KEY` is the public client key

Important:

- Do not put your `service_role` key in the frontend
- Keep row-level security enabled and policies correct, because the anon key is public by design

Optional, for local Gemini-assisted import development with the Edge Function:

```env
GEMINI_API_KEY=
GEMINI_MODEL=
```

If you are using a remote Supabase project for Gemini imports, you can remove `GEMINI_API_KEY` and `GEMINI_MODEL` from the app `.env`.

These values should be stored as Supabase Edge Function secrets in production, not exposed as browser env vars.

## Local development

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run build
npm run lint
npm test
```

The Vite dev server usually runs at `http://localhost:5173`.

## Supabase setup

1. Create a Supabase project.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.
3. In Supabase Auth, enable the Email provider.
4. For quick local testing, optionally disable email confirmation.
5. Run [`supabase/schema.sql`](/D:/budget-app/supabase/schema.sql) in the SQL editor.
6. Set Gemini secrets and deploy the Edge Function used by imports:

```bash
supabase secrets set GEMINI_API_KEY=your-key GEMINI_MODEL=your-model
supabase functions deploy extract-transactions
```

If you are working directly against a remote Supabase project, those secrets and the function deployment happen in Supabase itself. Keeping the files in this repo does not automatically create the function remotely.

The schema sets up:

- `profiles`
- `categories`
- `transactions`
- `budgets`
- updated-at triggers
- row-level security policies
- an auth trigger that creates a profile record for new users
- seeded default income and expense categories

## Data model notes

- Currency currently defaults to `CAD`
- Monthly budgets support both an overall amount and category-specific allocations
- Profile records store locale, monthly budget, budget allocation preferences, and onboarding completion
- Transactions are owned per user and protected by RLS

## Testing

The project includes tests around key hooks and budget logic, including:

- auth state
- transaction queries
- transaction mutations
- budget mutations
- allocation and budget bucket utilities

Run the full suite with:

```bash
npm test
```

## Production hosting

Recommended setup:

- Vercel for the Vite frontend
- Supabase for auth, database, and the `extract-transactions` Edge Function

Deployment checklist:

1. In Vercel, set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Deploy the frontend from this repo. [`vercel.json`](/D:/budget-app/vercel.json) includes the SPA rewrite needed for React Router.
3. In Supabase, set Gemini secrets and deploy the Edge Function:

```bash
supabase secrets set GEMINI_API_KEY=your-key GEMINI_MODEL=your-model
supabase functions deploy extract-transactions
```

4. In Supabase Auth, add your Vercel production URL and preview URL patterns to the allowed redirect URLs.

Notes:

- Your Vercel deploy branch does not need to be `main`
- Different deploy branches can still point to the same Supabase project if they share the same public env vars
- Use a separate Supabase project if you want true staging isolation

## Known limitations

- No billing, subscriptions, or entitlement checks yet
- No live bank sync yet; Plaid is only a teaser in the UI
- Import still depends on human review before save, especially on Gemini-assisted parses
- Currency support is still centered on CAD
- CSV export currently focuses on transaction data
- No offline sync or background service worker support is enabled

## Roadmap ideas

- Real premium gating and billing
- Plaid-based banking integrations
- More export formats and reporting
- Stronger import templates for bank-specific CSVs
- Additional analytics and automation
- Expanded currency support
