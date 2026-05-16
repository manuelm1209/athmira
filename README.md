# Athmira

Athmira is a web-first, mobile-ready sports performance app for beginner and intermediate endurance athletes.

English: **Train smarter. Go further.**  
Spanish: **Entrena mejor. Llega más lejos.**

The first MVP focuses on account creation, user profiles, bike profiles, a camera-based bike-fit flow, and preliminary mock results. It is built with Expo, React Native Web, Expo Router, TypeScript, Supabase, and Vercel.

## Project Structure

```text
/apps
  /app                 Expo app for web, iOS, and Android
/packages
  /aero-engine         Mock aero scoring interfaces
  /ai-engine           Placeholder AI coaching interfaces
  /fit-engine          Mock fit scoring and recommendation logic
  /nutrition-engine    Placeholder nutrition calculators
  /pose-engine         Mock pose interfaces and angle calculations
  /supabase            Supabase client and data services
  /types               Shared domain types
  /ui                  Shared React Native UI primitives
/supabase
  /migrations          Initial database schema and RLS policies
```

## Requirements

- Node.js `20.19.x` or newer for Expo SDK 55.
- npm.
- A Supabase project.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SITE_URL=https://athmira.com
EXPO_PUBLIC_TURNSTILE_SITE_KEY=
```

In this monorepo, Expo runs from `apps/app`. The app config also reads `.env.local` from the repository root and accepts these public aliases:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `TURNSTILE_SITE_KEY`

Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, or other secret keys to the client app.

For Cloudflare Turnstile, add the public site key to the app environment and configure the secret key in Supabase Auth CAPTCHA/Bot Protection. The app passes the Turnstile token to Supabase Auth during login and signup; the secret key should never be bundled into Expo.

For Supabase email confirmation links, the app sends users to `/auth/callback`. Configure Supabase Auth URL settings:

- Site URL: `https://athmira.com`
- Redirect URL: `https://athmira.com/auth/callback`
- Optional local Redirect URL: `http://localhost:8082/auth/callback`

For local-only email verification, set `EXPO_PUBLIC_AUTH_REDIRECT_URL=http://localhost:8082/auth/callback`.

4. Start the web app:

```bash
npm run web
```

## Supabase Setup

Run the SQL migrations in `supabase/migrations` against your Supabase project in filename order. They create:

- `profiles`
- `bikes`
- `fit_sessions`
- `fit_measurements`
- `aero_scores`
- `recommendations`
- `media_assets`
- `analysis_summaries`
- `front_knee_measurements`
- private `fit-media` storage bucket

Row Level Security is enabled so authenticated users can only access their own data.

Media should be stored in Supabase Storage, not directly in Postgres. The MVP includes signed URL helpers for private media access.

`analysis_summaries` stores comparable session-level scores for side bike-fit and front knee-tracking sessions. `front_knee_measurements` stores the detailed left/right knee path metrics used to compare changes across sessions.

## Vercel Deployment

Use this repository as a Vercel project with:

- Build command: `npm run build`
- Output directory: `apps/app/dist`
- Install command: `npm install`

Set these Vercel environment variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SITE_URL=https://athmira.com
```

The web build is produced by Expo static export. The main product app does not use Next.js.

`vercel.json` includes a filesystem-first fallback to `/index.html` so direct refreshes on Expo Router paths such as `/auth/login`, `/dashboard`, and `/auth/callback` load the app instead of returning a Vercel `404: NOT_FOUND`.

## Scripts

```bash
npm run web        # Start Expo for web
npm run build      # Export the Expo web app
npm run expo:check # Check Expo SDK dependency compatibility
npm run lint       # Run Expo lint
npm run typecheck  # Run TypeScript checks
```

## Safety And Claims

Athmira's early bike-fit and aero results are preliminary, estimated, camera-based guidance for training and educational purposes. They are not medically accurate, do not replace a professional bike fit, and do not provide real wind-tunnel or CFD precision.
