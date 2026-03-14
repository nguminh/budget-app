# Maple Ledger

Maple Ledger is Iteration 1 of a bilingual personal budgeting web app built with React, Vite, Tailwind, and Supabase. It covers auth, transaction CRUD, monthly budget tracking, dashboard charts, and a responsive mobile/desktop shell.

## Iteration 1 scope

- Email sign up, sign in, and sign out with Supabase Auth
- Protected routes for dashboard, transactions, budgets, and settings
- Create, edit, delete, and list transactions
- Current monthly overall budget management
- Dashboard summaries, recent transactions, and spending-by-category chart
- English and French UI with persisted language preference
- Responsive desktop sidebar and mobile bottom navigation

## Stack

- React 19 + Vite 8 + TypeScript
- Tailwind CSS
- React Router
- Supabase Auth + Postgres
- react-hook-form + zod
- Recharts
- react-i18next + i18next
- sonner
- lucide-react
- date-fns

## Environment variables

Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and anon public key into `.env`.
3. In Supabase Auth, enable Email provider.
4. For fast hackathon testing, optionally disable email confirmation.
5. Run the SQL in [supabase/schema.sql](/D:/budget-app/supabase/schema.sql).
6. Confirm RLS and policies were created successfully.
7. Seeded default categories will be inserted by the schema.

## Local development

```bash
npm install
npm run build
npm run dev
```

The Vite dev server will print the local URL, typically `http://localhost:5173`.

## PWA note

The old repo registered a cache-first service worker that would likely serve stale assets during rapid iteration. Iteration 1 keeps the manifest file but does not register the service worker in the app entrypoint.

## Known limitations

- Budget UI currently manages the overall monthly budget, not category budgets.
- Currency is stored as CAD for Iteration 1, with only a placeholder for future expansion.
- No OCR, bank sync, premium billing, AI categorization, or offline sync yet.
- Settings exposes a premium teaser card only.

## Future ideas

- Category-specific budgets
- Custom user categories in the UI
- Receipt OCR and voice input
- Premium analytics and automation
- Bank import or sync

