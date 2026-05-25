# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## Voice settings and response animations

- Voice controls live in `artifacts/mobile/components/SettingsScreen.tsx` under **VOICE** → **Talkness**.
- Supported presets: `Nova`, `Alloy`, `Echo`, `Fable`, `Onyx`, `Shimmer`.
- Talkness controls are persisted with AsyncStorage (`rate`, `pitch`, `volume`, `expressiveness`, `auto speak responses`) in `AppContext`.
- TTS playback is powered by the browser Web Speech API when available (`window.speechSynthesis`).
  - No API key is required for Web Speech API.
  - If speech synthesis is unavailable on a device/runtime, ARC X continues showing text responses without audio.
- Chat responses include streaming cursor/typing effects, fallback reveal animation for non-stream responses, and a speaking indicator tied to TTS playback state.
- Motion-sensitive users are respected via `AccessibilityInfo.isReduceMotionEnabled()` (`useReducedMotion` hook).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
