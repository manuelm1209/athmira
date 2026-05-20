# athmira

athmira is a web-first, mobile-ready sports performance app for beginner and intermediate endurance athletes.

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
  /nutrition-engine    Fueling, hydration, bottle, and tire pressure calculators
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

Public auth forms intentionally avoid displaying raw Supabase Auth errors. Login failures use a generic message so the app does not reveal whether an email exists, a password is wrong, or an account has not been confirmed.

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
- `admin_roles`
- `admin_audit_logs`
- `tire_pressure_settings`
- `nutrition_plans`
- `nutrition_products`
- `nutrition_plan_bottles`
- `nutrition_plan_items`
- private `fit-media` storage bucket

Row Level Security is enabled so authenticated users can only access their own data.

Media should be stored in Supabase Storage, not directly in Postgres. The MVP includes signed URL helpers for private media access.

`analysis_summaries` stores comparable session-level scores for side bike-fit and front knee-tracking sessions. `front_knee_measurements` stores the detailed left/right knee path metrics used to compare changes across sessions.

Migration `0003_security_hardening.sql` moves the privileged signup trigger into a private schema, locks down helper function execution, and pins trigger-function `search_path` values. Apply it after the initial schema migrations in existing Supabase projects.

Migration `0004_admin_platform.sql` adds `admin_roles`. It is intentionally separate from `profiles` so users cannot self-promote through profile updates. Bootstrap the first platform admin manually in Supabase SQL after creating that user's account:

```sql
insert into public.admin_roles (user_id)
values ('YOUR_AUTH_USER_ID');
```

Migration `0005_admin_role_management.sql` expands admin audit logging for admin-role grants and revocations.

Migration `0006_tire_pressure_settings.sql` adds editable tire pressure settings linked to users and optionally to bikes.
Migration `0007_tire_pressure_setup.sql` adds tire setup storage so pressure history distinguishes inner-tube and tubeless recommendations.
Migration `0008_tire_pressure_tpu_and_width_value.sql` adds TPU tube support and stores the exact tire-width value entered by the user.
Migration `0009_nutrition_planning.sql` adds the Nutrition Planning module tables, global product seed data, RLS policies, explicit authenticated grants for the Supabase Data API, and a database trigger limiting each user to 15 custom nutrition products.

Nutrition products use two scopes:

- `global`: seeded system/admin products that all authenticated users can read.
- `user`: custom products owned by one authenticated user. Users can create, edit, and soft-delete their own custom products only.

## Security

Cybersecurity is a required product constraint for athmira. User identity, bike profiles, camera/media data, fit analysis history, and future wearable data should be treated as sensitive user data.

- Keep secret keys out of Expo and React Native Web. Only `EXPO_PUBLIC_*` values should be available to the client.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, database URLs, JWT secrets, and provider secrets in server-side provider settings only.
- Use Supabase RLS for all user-owned tables and private Storage buckets for media.
- Keep nutrition plans, bottles, plan items, and custom products user-owned through RLS. Global nutrition products should only be changed by trusted admins or controlled seed migrations.
- Use signed URLs for private media access.
- Keep Cloudflare Turnstile enabled on auth forms in production and configure the Turnstile secret in Supabase Auth CAPTCHA/Bot Protection.
- Keep public login and signup errors generic; do not expose raw Supabase Auth messages that reveal account existence or confirmation status.
- Review Vercel security headers in `vercel.json` when adding camera, media, worker, or third-party script behavior.

## Admin Platform

The admin panel is available at `/admin` for users listed in `public.admin_roles`. The `/admin` route should remain a lightweight hub that shows the available administration areas and links to dedicated pages. Do not place full management forms directly on the main admin page.

Current admin routes:

- `/admin`: administration hub.
- `/admin/users`: user creation, user review, role management, temporary passwords, bikes, and camera analysis review.
- `/admin/nutrition-products`: global nutrition product creation and composition editing.

Admin capabilities:

- List platform users.
- Create users with a temporary password.
- Create users directly as admins when needed.
- Set a temporary password for an existing user.
- Grant or remove admin access for other users.
- Review and edit user profile/preferences.
- Review each user's bikes.
- Review saved camera analysis sessions and measurements.
- Create and edit global nutrition products, including English and Spanish names plus serving, carbohydrate, calorie, sodium, liquid, and weight values.

Admin Auth operations run through Vercel serverless endpoints in `/api/admin/*`. These endpoints verify the signed-in user's Supabase access token, check `admin_roles`, and only then use `SUPABASE_SERVICE_ROLE_KEY` server-side.

Set these server-only Vercel environment variables:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not prefix the service-role key with `EXPO_PUBLIC_`.

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

`vercel.json` includes a filesystem-first fallback to `/index.html` so direct refreshes on Expo Router paths such as `/auth/login`, `/dashboard`, and `/auth/callback` load the app instead of returning a Vercel `404: NOT_FOUND`. It also sets baseline security headers for HTTPS, content sniffing, referrer behavior, iframe embedding, and browser permissions.

## Scripts

```bash
npm run web        # Start Expo for web
npm run build      # Export the Expo web app
npm run expo:check # Check Expo SDK dependency compatibility
npm run lint       # Run Expo lint
npm run typecheck  # Run TypeScript checks
```

## Safety And Claims

athmira's early bike-fit and aero results are preliminary, estimated, camera-based guidance for training and educational purposes. They are not medically accurate, do not replace a professional bike fit, and do not provide real wind-tunnel or CFD precision.
