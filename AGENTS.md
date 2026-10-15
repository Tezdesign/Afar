# skyscanner (Afar)

A Skyscanner-inspired travel app (Expo/React Native), branded **Afar** in-app copy and assets
(`agent/agent.py`'s system prompt, `images.afarLogo`) even though `package.json`/`app.json` still
say "skyscanner" — a rename in progress, not a bug. Search/browse flights, hotels, and cars from
sample data held in Supabase, plus a voice AI trip assistant over Stream Video. Built as a teaching
project: feature by feature, smallest useful slice first, explained as you go.

## Stack

- **Language / Runtime**: TypeScript, Expo SDK ~57, React Native 0.86, React 19 (React Compiler on)
- **Framework**: Expo Router (typed routes, `src/app/`), NativeWind v5 + Tailwind v4 (`src/global.css`)
- **State**: Zustand v5, one store per concern (`src/store/*.ts`); `persist` (AsyncStorage) only for
  device state (`authStore`, `preferencesStore`), account data loads from Supabase
- **Auth**: `@clerk/expo` (client) + `@clerk/backend` (server-side token verification)
- **Realtime / AI**: `@stream-io/video-react-native-sdk` (client) + `@stream-io/node-sdk` (server
  token minting); the AI trip assistant itself is a separate Python service in `agent/` (Vision
  Agents framework + Gemini Realtime), not part of this Expo app's build
- **Analytics**: `posthog-react-native`
- **Backend**: no server framework — secrets and privileged calls live in Expo Router API routes
  (`src/app/api/*+api.ts`). Since spec 0004, data and account deletion also live in Supabase (see
  Database below)
- **Database**: Supabase Postgres behind Clerk (third party auth): `@supabase/supabase-js` in the app
  (`src/lib/supabase.ts`), row level security as the guard, migrations and the one Edge Function in
  `supabase/`, generated types in `src/types/database.ts`
- **Package manager**: `npm`

## Build approach

<TBD, set by /scope> — informally: feature by feature, smallest useful version first, refactor only
when repetition/complexity actually shows up (see Rules). No formal scope/spec has been written yet.

## Commands

```bash
# Install
npm install

# Dev (Expo dev client / Metro)
npm start
npm run ios     # or: npm run android / npm run web

# Lint
npm run lint

# Type check — no "typecheck" script exists yet, run tsc directly
npx tsc --noEmit
```

No test runner is configured (no `test` script, no Jest config). Plain Node check scripts exist
instead (Node >= 20.19.4, as Expo requires): `node src/lib/parseSearch.check.ts`,
`node src/lib/db/account.check.ts`, `node src/lib/clerkWebhook.check.ts`, and, against the live
project, `node --env-file=.env src/lib/db/catalog.check.ts`.

Supabase (CLI linked to the project; migrations are plain SQL in `supabase/migrations/`):

```bash
supabase db push --include-seed        # apply new migrations (and the seed on first use)
supabase db query --linked -f supabase/tests/isolation.sql   # two user isolation test, ends in a rollback
supabase db advisors --linked          # security and performance lint, must stay empty
supabase gen types typescript --linked > src/types/database.ts   # after every schema change
supabase functions deploy clerk-webhook --no-verify-jwt --use-api
```

The AI agent (`agent/`) is a separate Python project with its own git repo, `.venv`, and
`pyproject.toml` (uv + pytest). It is not started by any command above; see `agent/README.md`. The
Expo app talks to it over HTTP via `VISION_AGENT_URL` (`src/app/api/assistant-call+api.ts`) — with
that env unset, the assistant call endpoint no-ops (`reason: "not_configured"`) instead of failing.

## Specs

`docs/specs/0001-ai-search-and-trust/`: umbrella `index.md` (shared rules, build order) plus children
0001 search, 0002 passport and visa, 0003 live prices, 0004 Supabase and Clerk link. There is no
`docs/scope/` yet. Run `/scope` before this file's Build approach or a feature list can be trusted
as current.

## Rules

- Routes live under `src/app/` (Expo Router, typed routes + React Compiler experiments on), not a
  root `app/`: `(auth)/` (`email.tsx` → `verify.tsx`, OTP sign-in), `(tabs)/` (`index`, `saved`,
  `trips`, `profile`), plus root-level `search.tsx`, `flight/[id].tsx`, `assistant.tsx`, and
  `onboarding.tsx`, and `api/*+api.ts` for server routes. Read `src/app/(tabs)/_layout.tsx` for the
  current tab list rather than trusting one enumerated here.
- Screens are mostly self-contained (up to ~400 lines, e.g. `src/app/(tabs)/index.tsx`,
  `src/app/search.tsx`). `src/components/` holds only what 2+ screens share (chips, field picker,
  `loadError`, `skeleton`, `toast`). Extract a component only when it's reused in 2+ places or makes a
  screen meaningfully easier to read; when unsure, ask rather than pre-extract. A root-level
  `hooks/` and `types/` don't exist — types live in `src/types/`, hooks in `src/lib/` (`useAsync`).
- Per-account state never leaks between accounts. Device state is scoped: `applyStorageScope()` in
  `src/app/_layout.tsx` repoints `authStore` at a `<store-name>:<clerkUserId>` (or `:guest`)
  AsyncStorage bucket on every sign-in/out transition, via `.persist.setOptions({ name })` +
  `.persist.rehydrate()`. Account data (`savedStore`, `tripsStore`) is not persisted at all: it loads
  from Supabase after sign in and is cleared on sign out, and writes go through
  `createWriteThrough()` (`src/lib/writeThrough.ts`): the screen changes at once, writes for one key
  run in order, a failure rolls back only if it is still the latest write, and a write queued before
  a sign out is dropped. Follow this for any new store that holds account data. `preferencesStore`
  (e.g. language) is intentionally global, not scoped, since it's a device preference.
- Never put Clerk's real session token in a Zustand store — `@clerk/expo/token-cache` already
  persists it securely. `authStore.token` exists only for a lightweight non-sensitive token, if ever
  needed (see the doc comment in `src/store/authStore.ts`).
- Data lives in Supabase, not in files: catalog tables and two views (`destinations_with_price`,
  `deals_with_price`, so a price is stored once), seeded by `supabase/seed.sql` and kept in the
  future by a daily date job; account tables behind row level security. The app reads and writes
  it only through `src/lib/db/` (`createCatalog`, `createAccount`, bound in `index.ts`), which
  maps rows to the app types in `src/types/travel.ts`. Only `src/data/languages.ts` is still a
  file. No price is typed in a screen. Sample rows are labelled "Sample data"; no live API yet
  (spec 0003).
- Supabase rules (spec 0004): the phone talks to Supabase with the publishable key plus Clerk's
  session token (`src/lib/supabase.ts`; signed in with no token throws, it never falls back to
  `anon`), so policies are the only guard. Every table gets row level security and explicit
  grants (start from `revoke all`), account tables check `(select auth.jwt()) ->> 'sub'` against
  `user_id`, views use `security_invoker`. Never edit an applied migration, add a new one, then
  regenerate `src/types/database.ts` and run `supabase/tests/isolation.sql` and the advisors.
  The Supabase secret key never leaves Supabase: it is not in `.env` or the app.
- Loading and failure: every database read shows a skeleton while loading and an error with Retry
  when it fails, never a blank screen (`useAsync` in `src/lib/useAsync.ts`, `LoadError`,
  `InlineError`, `skeleton`, `toast`). `AppGate` in `src/app/_layout.tsx` loads the airports
  (`airportStore`) before any screen renders; code outside React reads
  `useAirportStore.getState().airports`. A failed read or write reports a `supabase_error` event
  with the table and operation only, never row data or typed text.
- The Clerk deletion webhook is a Supabase Edge Function, `supabase/functions/clerk-webhook`
  (logic in `supabase/functions/_shared/clerk_webhook.ts`, tested by `src/lib/clerkWebhook.check.ts`),
  not an Expo route. Its signing secret is a Supabase secret (`supabase secrets set
  CLERK_WEBHOOK_SIGNING_SECRET=...`). `tsconfig.json` excludes the Deno code from the app typecheck.
- Secrets and privileged calls only happen server-side, in `src/app/api/*+api.ts`, and only after
  verifying the caller: `getVerifiedClerkUserId()` (`src/lib/clerkServerAuth.ts`) decodes and checks
  the client's Clerk session token — never trust a client-supplied user id. `stream-token+api.ts`
  mints a short-lived Stream token (~4h, client re-hits it to refresh); `assistant-call+api.ts`
  starts/stops the AI agent's session in that user's personal call (`assistant-${userId}`, matching
  `assistantCallId()` in `src/lib/stream.ts`) by proxying to the separate `agent/` service. Follow
  this verify-then-call shape for any new API route; never mint a token or call a paid API directly
  from client code.
- `src/lib/apiBaseUrl.ts` resolves this app's own API routes from `Constants.expoConfig.hostUri` in
  dev (same Metro host); a production build needs `EXPO_PUBLIC_API_BASE_URL` set explicitly, since
  there's no packager host and no browser origin to infer from on native.
- Design tokens are canonical in `src/global.css`'s `@theme` block, mirrored in `src/theme/colors.ts`
  (+ `typography.ts`, `spacing.ts`, `shadow.ts` for the native card shadow). Never invent a color/radius/spacing/type value in a screen — add
  it to `src/global.css` first (as a `@theme` var, or a new `@utility` for a named type style like
  `text-display`/`text-title`/`text-body`/`text-caption`/`text-numeric`), then use the generated
  Tailwind class (`bg-cobalt-500`, `text-ink`, `border-line`, …). One radius scale per screen, never
  mixed; shadows stay single-direction (`shadow-card`, `shadow-raised`), never stacked or colored.
- Style with NativeWind classes by default; drop to `StyleSheet`/inline styles only where NativeWind
  can't reach: `SafeAreaView`, `Button` (use `TouchableOpacity` instead), `KeyboardAvoidingView`,
  `Modal`, `ScrollView`'s `contentContainerStyle`, `TextInput`-specific props, `Animated.View`,
  runtime-computed/dynamic styles, platform-specific behavior, pressed-state styles, native shadow
  syntax, transform arrays, and z-index. Check the installed NativeWind version in `package.json`
  before relying on any syntax from a different major version (currently v5 preview).
- Images go through `src/constants/images.ts` (already the pattern — see `images.afarLogo` in
  `src/app/_layout.tsx`); don't `require()`/import an asset directly in a screen or component unless
  there's a strong reason. Generated or downloaded images live under `assets/images/` with clear
  names.
- When a design image is provided, match it: layout, spacing, type hierarchy, colors, radius,
  shadows, alignment, proportions. Don't approximate or simplify unless told to.
- A new major dependency needs the user's sign-off first: name it, say why it's worth it in one
  line, and wait — don't install or wire it in speculatively.
- TypeScript throughout, `any` avoided, types kept simple and readable over clever.
- Auth is Clerk only — no custom auth. Real screens: `src/app/(auth)/email.tsx` →
  `src/app/(auth)/verify.tsx` (email + OTP). `src/lib/clerk.ts` unwraps Clerk's nested
  `errors[0].code`/`.message` shape (the top-level `code` is a generic wrapper like
  `"api_response_error"`) — reuse `clerkErrorCode`/`clerkErrorMessage` for any new Clerk error UI
  rather than reading `error.message` directly.

## Agent skills

- [clerk family](.agents/skills/): `clerk/skills` — `clerk`, `clerk-setup`, `clerk-expo`,
  `clerk-custom-ui`, `clerk-webhooks`, `clerk-cli`, `clerk-backend-api`, `clerk-react-patterns`,
  `clerk-react-router-patterns`; load the relevant one per Clerk task
- [expo family](.agents/skills/): source varies per skill — `expo-project-structure`,
  `expo-tailwind-setup`, `expo-ui`, `expo-native-ui`, `expo-design-system`, `expo-data-fetching`,
  `expo-module`, `expo-dev-client`, `expo-app-clip`, `expo-brownfield`, `expo-web-to-native`,
  `expo-migrate-module`, `expo-upgrade`, `eas-workflows`, `eas-hosting`, `eas-update-insights`,
  `expo-examples`, `expo-skill-eval`, `expo-skill-feedback`; load the relevant one per Expo/EAS task
- [stream family](.agents/skills/): `stream`, `stream-react-native`, `stream-builder`,
  `stream-docs`; load for any Stream Video/Chat work — `stream/RULES.md` has the hard auth rule this
  app already follows (server derives `user_id` from its own session, never a client param)
- [supabase](.agents/skills/supabase/): `supabase/agent-skills` — Supabase CLI, migrations, row level
  security, auth and Data API grants; load for any Supabase task
- [supabase-postgres-best-practices](.agents/skills/supabase-postgres-best-practices/):
  `supabase/agent-skills` — Postgres schema, index and query conventions; load when writing SQL
- [agent](.agents/skills/agent/): `visionagents.ai`, the Vision Agents framework backing `agent/`;
  load when touching `agent/agent.py` or the assistant call flow
- [design/UI set](.claude/skills/): `design`, `ui-styling`, `ui-layout-master`, `design-system`,
  `brand`, `banner-design`, `slides`, `integration-react-native` — local design/UI-generation
  skills; load for mockup, styling, or design-system work

MCP servers: Supabase (recommended, https://mcp.supabase.com/mcp, use a scoped access token; not connected)
Declined: none recorded

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Rewritten from the repo's real structure — this replaces a generic template that described a
`components/`/`hooks/`/`lesson/` layout this project never had. Worth a quick human pass. Edit
freely: once a line stops matching this draft, later runs treat it as curated and will flag rather
than overwrite it._
