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

## Native iOS And Android

The same Expo app in `apps/app` targets web, iOS, and Android. Start with Expo Go for quick native validation of non-CV screens:

```bash
npm run ios
npm run android
```

The native camera flows use `expo-camera` (or the local `expo-pose-landmarker` module on the analysis screens) with only the camera permission enabled. Android explicitly blocks microphone recording permission, and the app keeps the screen awake while an analysis camera is mounted.

### Native modules for performance-critical flows

Expo is **not** a hard ceiling on what athmira can do natively. For high-throughput camera and image-processing scenarios — especially the bike-fit **frontal (front knee tracking)** and **lateral (side bike fit)** capture flows, and any future aero posture, video, or sensor-fusion pipeline — the project explicitly allows (and encourages) dropping into native code on each platform: Swift (with Metal / AVFoundation / Vision when useful) on iOS, Kotlin (with CameraX + GPU delegate) on Android. The goal is that no real-time CV feature is ever slow because of an Expo-imposed JS path.

The contract for that native code is:

- Wrap it as a **local Expo Module** under `apps/app/modules/` (see `apps/app/modules/expo-pose-landmarker/` as the canonical reference: Swift + MediaPipe Metal delegate on iOS, Kotlin + MediaPipe GPU delegate on Android).
- Expose a single typed **TypeScript façade** so screens, shared engines (`pose-engine`, `fit-engine`, `aero-engine`), and tests stay platform-agnostic.
- Provide a **web fallback** (lower-fidelity is fine — e.g. TFJS WebGL, slower polling) so the web build never blocks the user.
- Keep business logic in shared packages or services, **not** inside the native module bridge.

### EAS build profiles

Profiles live in `apps/app/eas.json`. There are two distinct iOS dev paths — pick the one that matches your target:

```bash
cd apps/app

# Physical iPhone / iPad — required for camera, pose, GPU/Metal, and thermal benchmarks
npx eas build --profile development --platform ios

# iOS Simulator only — fast UI iteration on a Mac without a device.
# MediaPipe's GPU/Metal delegate is not available on the simulator and will
# fall back to CPU, so do not benchmark pose detection here.
npx eas build --profile development-simulator --platform ios

# Android phones — internal-distribution APK with the dev client
npx eas build --profile development --platform android

# Stakeholder testing (Android APK)
npx eas build --profile preview --platform android

# Store-ready builds (auto-increments version codes)
npx eas build --profile production --platform all
```

Both `development` and `development-simulator` produce a dev-client build, so the local `expo-pose-landmarker` module and any future custom native modules are usable in both — but only the `development` profile (on a real device) gives you accurate frame-rate, thermal, and battery measurements.

Run `npm run native:prebuild:ios` or `npm run native:prebuild:android` only when a custom native module, config plugin, or local native debugging requires generated `ios/` or `android/` folders. Do not commit generated native folders unless the project intentionally moves away from managed Expo.

When adding device-specific features, prefer Expo SDK modules first for ordinary functionality. For anything performance-critical, follow the native-module contract above.

## Signing

### iOS signing

iOS Debug builds (simulator + physical device) need a Team configured in Xcode. Each developer does this once on their machine — no shared certificates live in the repo.

1. Open the workspace in Xcode:

   ```bash
   npm run ios:xcode
   ```

2. Select the `athmira` target → **Signing & Capabilities**.
3. Check **Automatically manage signing** and pick your Apple ID Team.
4. Build and run with `⌘R`. Xcode will provision your device the first time.

For Release / TestFlight / App Store builds, install your Apple Developer certificate and provisioning profile in Xcode. Never commit `.p8`, `.p12`, `.mobileprovision`, or `.provisionprofile` files — they're already in `.gitignore`.

### Android signing — current state

The repo ships with a working `debug.keystore` (auto-generated by Gradle). That covers:

- Local development on the emulator (`npm run android`).
- Local APK release builds (`npm run android:apk` / `npm run android:release`) — they sign with the **debug** keystore as a fallback. Useful for sideloading and internal testing, but **Google Play Store will reject any AAB signed with `debug.keystore`** — that's the intended signal.

The release-signing pipeline in [apps/app/android/app/build.gradle](apps/app/android/app/build.gradle) reads from `apps/app/android/keystore.properties` (gitignored). When that file exists, release builds sign with the upload keystore declared there; when it doesn't, builds gracefully fall back to debug signing so gradle keeps parsing for everyone.

### Android signing — pending: Play Console setup

When the Google Play Console developer account is in place ($25 USD, one-time, at <https://play.google.com/console/signup>), complete the following to enable Play Store uploads. Each step happens exactly once.

1. **Generate the upload keystore** (store it outside the repo):

   ```bash
   mkdir -p ~/keys
   keytool -genkey -v \
     -keystore ~/keys/athmira-upload.keystore \
     -alias athmira \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

   Use a strong password and **save it in a password manager** — losing it locks you out of publishing updates from this machine. The `keystore.properties` file below contains the password in plaintext, which is acceptable because the file is gitignored, but the password manager copy is the source of truth.

2. **Create `apps/app/android/keystore.properties`** (already gitignored — never commit it):

   ```
   storeFile=/Users/manuelmontoya/keys/athmira-upload.keystore
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=athmira
   keyPassword=YOUR_KEY_PASSWORD
   ```

   No edits to `build.gradle` are needed — it already picks the file up automatically.

3. **Build a signed App Bundle**:

   ```bash
   npm run android:bundle
   ```

   Output: `apps/app/android/app/build/outputs/bundle/release/app-release.aab`.

4. **Verify the signature** before uploading:

   ```bash
   "$ANDROID_HOME/build-tools/36.0.0/apksigner" verify --verbose --print-certs \
     apps/app/android/app/build/outputs/bundle/release/app-release.aab
   ```

   Confirm the printed certificate matches the alias `athmira`. If it still says `androiddebugkey`, `keystore.properties` is missing or malformed.

5. **In Google Play Console** (one-time per app):

   1. Create a new app → fill out app details, package name `com.athmira.app`.
   2. **Enroll in Play App Signing** (recommended): Google generates and holds the final signing key. The keystore you generated above becomes the **upload key**, which is safer because losing it doesn't lock you out — Google can reset the upload key.
   3. Upload the `app-release.aab` to the **Internal testing** track first.
   4. Promote to closed/open testing or production once stable.

6. **For every subsequent release**:

   ```bash
   # Bump versionCode + versionName in apps/app/android/app/build.gradle
   npm run android:bundle
   # Upload the new app-release.aab to Play Console
   ```

   The `versionCode` (integer) must strictly increase with every Play Store upload. `versionName` (string) is what users see.

## Authenticated Playwright Access

Codex and Playwright can inspect protected routes by reusing the saved browser state in `playwright/.auth/codex-user.json`. That file contains session tokens, is ignored by git, and should stay local.

Run the app at the same origin used by the saved state:

```bash
npm run web
```

Then open protected pages from the repository root with the Playwright CLI skill. The repo-level `playwright-cli.json` points the skill at `playwright/.auth/codex-user.json`:

```bash
"$HOME/.codex/skills/playwright/scripts/playwright_cli.sh" open http://localhost:8081/dashboard
"$HOME/.codex/skills/playwright/scripts/playwright_cli.sh" snapshot
```

The Playwright test config also uses that storage state by default:

```bash
npx playwright test --project=chromium
```

To regenerate the authenticated state, add only these private values to `.env.local`, start the app, and run the setup project:

```bash
CODEX_TEST_EMAIL=
CODEX_TEST_PASSWORD=
PLAYWRIGHT_REFRESH_AUTH=1 npx playwright test --project=setup
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
npm run ios        # Start the app in Expo Go on iOS
npm run android    # Start the app in Expo Go on Android
```

## Safety And Claims

athmira's early bike-fit and aero results are preliminary, estimated, camera-based guidance for training and educational purposes. They are not medically accurate, do not replace a professional bike fit, and do not provide real wind-tunnel or CFD precision.
