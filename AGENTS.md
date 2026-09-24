<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## PWA Status (Phase 1 — done)

Ryora is a PWA. Key files:
- `public/manifest.json` — web app manifest (linked via `layout.tsx` metadata)
- `public/sw.js` — service worker (v3): network-first for HTML, cache-first for static, stale-while-revalidate for same-origin GET, network-only for Supabase. Offline fallback to `/offline`.
- `src/app/offline/page.tsx` — offline fallback page (outside `(main)` route group, no auth check)
- `src/components/pwa/ServiceWorkerRegistrar.tsx` — registers SW
- `src/components/pwa/InstallPrompt.tsx` — custom install prompt (beforeinstallprompt, 7-day dismiss TTL)
- `vercel.json` (in repo root) — excludes `/sw.js`, `/manifest.json`, `/icon-*.png` from no-store headers

## Supabase Migration Status

### Done (Phase 2a):
- `@supabase/supabase-js` installed
- `src/lib/supabase/client.ts` — browser client (anon key, singleton)
- `src/lib/supabase/server.ts` — server client (service_role key, bypass RLS)
- `src/lib/supabase/upload.ts` — upload/delete helpers for Storage
- `/api/upload` — now tries Supabase Storage first, falls back to base64 if `SUPABASE_SERVICE_ROLE_KEY` not set
- `supabase/migrations/20260817000001_storage_bucket.sql` — creates `gallery` bucket + RLS policies
- `deletePhoto` in `actions/db.ts` — cleans up Storage files when deleting photos

### Done (Phase 2c — Auth migration, bridge strategy):
- `@supabase/ssr` installed — cookie-based auth for SSR/RSC
- `src/lib/supabase/serverClient.ts` — async `getSupabaseServerClient()` + `getSupabaseUserProfile()` (Next.js 16: `cookies()` is async)
- `src/proxy.ts` — checks local `ryora-session` cookie OR Supabase session, redirects to `/login` if neither (Next.js 16: `middleware.ts` convention renamed to `proxy.ts`, must live inside `src/`)
- `src/lib/localAuth.ts` — local-auth single source of truth (`LOCAL_USERS` user-1/user-2 + pair-1, `LOCAL_SESSION_COOKIE`, session resolvers). Local cookie dicek duluan di proxy, `/api/*`, dan `(main)/layout` — app tetap usable saat Supabase unreachable
- `src/lib/supabase/fetch.ts` — `supabaseFetch` dipasang ke semua Supabase clients: timeout 8s per request + circuit breaker 30s setelah connectivity failure
- `/api/db` — read actions (get*) degrade ke empty data saat backend gagal; write actions tetap throw untuk retry queue
- `/api/auth` — `verify` reads Supabase cookie session; `logout` calls `supabase.auth.signOut()`
- `/api/db` & `/api/upload` — auth via Supabase cookie session (token in body/formData is vestigial, ignored)
- `(main)/layout.tsx` — verifies Supabase session via browser client
- `(auth)/login/page.tsx` — `supabase.auth.signInWithPassword()` with email mapping (Ryo→ryo@ryora.app, Ara→ara@ryora.app)
- `settings/page.tsx` — logout via `supabase.auth.signOut()`
- `useDatabase.ts` `usePartnerId` — verify call no longer sends token
- **Bridge strategy**: hook signatures unchanged (token param vestigial), auth comes from Supabase cookies auto-sent with same-origin fetch
- `supabase/migrations/20260817000002_supabase_auth.sql` — adds email column, RLS policies on all tables, helper functions `auth_pair_id()` / `auth_user_id()`
- **Prerequisite**: Create 2 users in Supabase Dashboard → Authentication → Users: ryo@ryora.app & ara@ryora.app

### Done (Phase 2b — Realtime subscriptions):
- `src/hooks/useRealtime.ts` — `useRealtime()` (single table) + `useRealtimeMulti()` (multi-table in 1 channel)
- `useRealtimeRefetch()` helper di `useDatabase.ts` — subscribe ke tabel, debounce 300ms, trigger refetch
- All 10 data hooks sekarang pakai realtime + polling fallback (reduced from 10s/5s → 30s/15s)
- `supabase/migrations/20260817000003_realtime.sql` — enable realtime publication + REPLICA IDENTITY FULL
- **Strategy**: Realtime untuk instant updates, polling 30s (15s presence) sebagai fallback kalau realtime disconnect
- **Performance impact**: ~67% reduction in API calls (10s→30s polling + realtime only when data changes)

### Done (Phase 2d — DB queries via Supabase client):
- `actions/db.ts` — all 30+ functions rewritten dari `pg` direct queries → Supabase server client (`getSupabaseServer()`)
- `actions/auth.ts` — `updateProfile`, `updateSettings`, `getUserSettings` rewritten ke Supabase client. `login`/`logout`/`getSession` dihapus (auth via Supabase Auth)
- `initializeDatabase()` tidak lagi dipanggil — table creation via SQL migrations
- `pg` / `lib/db/postgres.ts` tidak lagi di-import di mana pun (file masih ada untuk backward compat)
- RLS: tambah INSERT policy untuk notifications (pair members bisa insert notif untuk partner)
- **Format mapping**: Supabase client return snake_case → helper functions map ke camelCase (same API contract, hooks tidak berubah)

### Done (Phase 2e — Cleanup):
- Deleted `src/lib/db/` directory (postgres.ts, init.ts, index.ts, schema-postgres.sql) — tidak lagi di-import
- Uninstalled deps: `bcryptjs`, `jsonwebtoken`, `@types/jsonwebtoken`, `pg`, `@types/pg`
- `supabase/migrations/20260817000004_cleanup.sql` — drop `sessions` table + `password_hash`/`password` columns dari `users`
- `.env.example` updated — removed `DATABASE_URL`, `JWT_SECRET`, `OWNER_PASSWORD`, `PARTNER_PASSWORD`
- **Result**: Bundle size berkurang, no dead code, single source of truth (Supabase)

### Migration complete ✅
Semua phase (2a-2e) selesai. Ryora sekarang fully powered by Supabase:
- Auth: Supabase Auth (cookie-based via @supabase/ssr)
- DB: Supabase client SDK (server: service_role, browser: anon)
- Storage: Supabase Storage (gallery bucket)
- Realtime: Supabase Realtime (postgres_changes)

## Polling + Realtime (done)

- `src/hooks/usePolling.ts` — smart polling hook: pauses when tab hidden, resumes on visible
- `src/hooks/useRealtime.ts` — Supabase Realtime subscriptions (postgres_changes)
- All 10 data hooks in `useDatabase.ts` now use **realtime + polling fallback**:
  - Realtime: instant update saat data berubah (debounced 300ms)
  - Polling: 30s fallback (15s for presence) — kalau realtime disconnect, polling tetap jalan
- `useDailyReset` still uses raw `setInterval(30s)` — intentional (lightweight day-change check)

## Environment Variables

Active Supabase project: `hftcdemqxtlbdbzyvxtn` (restored original — akun Ryora-max).
Project lama `jjlgnxufrpqydzuwdbzn` (akun lain) tidak dipakai lagi.

Required in `.env.local` (local) and Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (browser client)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server client, bypass RLS)
- `OWNER_PIN` / `PARTNER_PIN` — local-auth PINs (server-only, fallback saat Supabase down)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — Web Push

Local users: `user-1` (Ryo/owner) + `user-2` (Ara/partner), `pair_id = 'pair-1'`.

Tidak lagi dipakai (dihapus di Phase 2e):
- ~~`DATABASE_URL`~~ — DB queries via Supabase client SDK
- ~~`JWT_SECRET`~~ — auth via Supabase Auth
- ~~`OWNER_PASSWORD` / `PARTNER_PASSWORD`~~ — password di-set di Supabase Dashboard

## Auth Setup (Phase 2c)

1. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
2. In Supabase Dashboard → Authentication → Users → "Add user":
   - Email: `ryo@ryora.app`, Password: (choose), set role to `authenticated`
   - Email: `ara@ryora.app`, Password: (choose), set role to `authenticated`
3. Run SQL migration: `supabase/migrations/20260817000002_supabase_auth.sql` (adds email column to users, RLS policies)
4. Login page maps role → email: owner=ryo@ryora.app, partner=ara@ryora.app

## Build & Lint

```bash
npm run lint   # eslint
npm run build  # next build (Turbopack)
npm run dev    # next dev --hostname 0.0.0.0
```
