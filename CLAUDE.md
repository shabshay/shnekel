# Shnekel — Project Rules

## What is this?
Shnekel is a personal expense tracker named after the Israeli 2₪ coin. React + TypeScript + Vite, hosted on GitHub Pages, with Supabase backend.

## Tech Stack
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (uses `@theme` in index.css for CSS variables)
- **Supabase** for auth (magic link) + database + storage (receipts)
- **Vitest** + **jsdom** for unit tests
- **GitHub Actions** for CI (test → build → deploy to GitHub Pages)
- **XLSX** (SheetJS) for import/export

## Architecture

### Data Flow
```
UI ←→ React Hooks ←→ storage.ts (localStorage) ←→ sync.ts ←→ Supabase
```
- **Reads** always from localStorage (instant, works offline)
- **Writes** go to localStorage first, then sync queue pushes to Supabase
- `storage.ts` is the single abstraction layer — all data access goes through it

### Key Files
- `src/types.ts` — All shared types (Settings, Expense, Category, etc.)
- `src/lib/storage.ts` — CRUD operations (localStorage + sync enqueue)
- `src/lib/sync.ts` — Background Supabase sync engine
- `src/lib/supabase.ts` — Supabase client singleton
- `src/lib/format.ts` — Currency formatting (₪)
- `src/hooks/useExpenses.ts` — Expense hook + period calculations + stats
- `src/hooks/useSettings.ts` — Settings hook with sync event listener
- `src/hooks/useAuth.ts` — Auth state hook

### Pages
- `Login.tsx` — Magic link email auth
- `Onboarding.tsx` — Period + month start day + budget setup
- `Dashboard.tsx` — Main screen (gauge, alerts, search, expenses)
- `Reports.tsx` — Stats cards, chart, export
- `Import.tsx` — File upload (Isracard .xls or generic spreadsheet)
- `Recurring.tsx` — Recurring expense management
- `Categories.tsx` — Custom category management

## Conventions

### Code Style
- **No semicolons** — Prettier-free, minimal config
- **Single quotes** in imports
- **Functional components only** — no class components
- **Hooks for state** — useState, useCallback, useMemo, useEffect
- **No global state library** — React hooks + localStorage is enough for now

### Naming
- Files: PascalCase for components/pages, camelCase for lib/hooks
- Types: PascalCase (Expense, Settings, CategoryInfo)
- Functions: camelCase (addExpense, formatCurrency)
- CSS: Tailwind utilities only, no custom class names except in index.css
- Test files: `__tests__/filename.test.ts` next to the source file

### Styling
- Use CSS custom properties from `@theme` in index.css — never hardcode colors
- Dark mode: `[data-theme="dark"]` overrides in index.css
- Border radius: `rounded-xl` for cards, `rounded-lg` for inputs, `rounded-full` for pills
- Shadows: `shadow-xl shadow-primary-container/10` for primary buttons only
- Fonts: `font-headline` (Lexend) for titles/numbers, `font-body` (Inter) for text
- Icons: Material Symbols Outlined, use `.filled` class for active states
- Bottom sheet modals: `animate-slide-up` class, backdrop blur, drag handle

### Data
- Category type is `string` (not union) to support custom categories
- Use `getCategories()` from storage.ts — never import `CATEGORIES` directly
- All currency display uses `formatCurrency()` from lib/format.ts
- Dates stored as ISO strings
- IDs generated with `crypto.randomUUID()`

### Supabase
- Env vars: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- Tables: `settings` (one row per user), `expenses` (many per user)
- Both have RLS: `auth.uid() = user_id`
- Storage bucket: `receipts` (public read, authenticated upload)
- Column naming: snake_case in Supabase, camelCase in TypeScript

### Testing
- Test pure functions and business logic, not UI components
- Mock `sync.ts` in storage tests to prevent Supabase calls
- Mock `localStorage` with Map-based implementation for storage tests
- Use `@vitest-environment jsdom` for DOM-dependent tests
- Run `npm test` before every commit

### CI/CD
- Every push to `main` triggers: test → build → deploy to GitHub Pages
- GitHub secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Failing tests block deployment
- HashRouter (not BrowserRouter) for GitHub Pages compatibility
- Vite `base: '/shnekel/'` for subpath hosting

## Common Tasks
- Add new page: create in `src/pages/`, add route in `App.tsx`, add to Layout nav if needed
- Add new storage function: add to `storage.ts`, add sync op type to `sync.ts` if needed
- Add new setting: update `Settings` interface in `types.ts`, add default in `storage.ts`, add to `sync.ts` pull mapping
- Add custom CSS: only in `index.css`, use `@theme` for new color variables
- Export new function for testing: mark as `export` (not just module-private)

## Environment Setup
```bash
cd app && npm install    # install deps
npm run dev              # start dev server
npm test                 # run tests
npm run build            # production build (tsc + vite)
```

## Supabase Project
- Project ref: `eaqykxnysrtomvtyqpbg`
- Region: EU Central (Frankfurt)
- Dashboard: https://supabase.com/dashboard/project/eaqykxnysrtomvtyqpbg
