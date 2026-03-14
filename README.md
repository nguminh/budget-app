# Maple Ledger

Maple Ledger is Iteration 1 of a bilingual personal budgeting web app built with React, Vite, Tailwind, and Supabase. It covers auth, transaction CRUD, monthly budget tracking, dashboard charts, and a responsive mobile/desktop shell.

## Iteration 1 scope

- Email sign up, sign in, and sign out with Supabase Auth
- Protected routes for dashboard, transactions, budgets, settings, and AI capture
- Create, edit, delete, and list transactions
- AI-assisted receipt/photo ingestion into a review queue
- AI-assisted voice capture into the same review queue
- Current monthly overall budget management
- Dashboard summaries, recent transactions, and spending-by-category chart
- English and French UI with persisted language preference
- Responsive desktop sidebar and mobile bottom navigation

## Stack

- React 19 + Vite 8 + TypeScript
- Tailwind CSS
- React Router
- Supabase Auth + Postgres + Storage + Edge Functions
- Gemini API for receipt/photo and voice parsing
- react-hook-form + zod
- Recharts
- react-i18next + i18next
- sonner
- lucide-react
- date-fns

## Environment variables

Copy [.env.example](/D:/budget-app/.env.example) to `.env` and fill in:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite-preview
```

The app itself uses the Vite vars. The Edge Function expects `GEMINI_API_KEY` and `GEMINI_MODEL` in its environment.

For local Supabase function development, copy [supabase/.env.example](/D:/budget-app/supabase/.env.example) to `supabase/.env` and use the same Gemini values there.

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and anon public key into `.env`.
3. Add your Gemini API key and preferred model to `.env`.
4. In Supabase Auth, enable Email provider.
5. For fast hackathon testing, optionally disable email confirmation.
6. Run the SQL in [supabase/schema.sql](/D:/budget-app/supabase/schema.sql).
7. Deploy the Edge Function in [supabase/functions/transaction-ingest/index.ts](/D:/budget-app/supabase/functions/transaction-ingest/index.ts).
8. Set `GEMINI_API_KEY` and `GEMINI_MODEL` as Edge Function secrets in Supabase for deployed environments.
9. Confirm RLS, storage policies, and the `transaction-ingestion` bucket were created successfully.
10. Seeded default categories will be inserted by the schema.

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

- AI candidates are client-side only for now; refresh clears the queue.
- Receipt/photo parsing currently returns one candidate per image.
- Voice flow supports approve/remove, but not inline editing yet.
- Budget UI currently manages the overall monthly budget, not category budgets.
- Currency is stored as CAD by default unless a profile currency is set.
- No OCR line-item extraction, bank sync, premium billing, or offline sync yet.
- Settings exposes a premium teaser card only.

## Future ideas

- Persistent AI draft queue and review history
- Edit-before-approve for AI candidates
- Multi-transaction receipts and line-item extraction
- Category-specific budgets
- Custom user categories in the UI
- Premium analytics and automation
- Bank import or sync
