# athmira

athmira is a web-first, mobile-ready sports performance app for beginner and intermediate endurance athletes.

English: **Train smarter. Go further.**  
Spanish: **Entrena mejor. Llega más lejos.**

The first MVP focuses on account creation, user profiles, bike profiles, a camera-based bike-fit flow, and preliminary mock results. It is built with Expo (in **bare workflow** — `apps/app/ios/` and `apps/app/android/` are committed and edited directly; builds run locally with Xcode and Android Studio, no EAS Build), React Native Web, Expo Router, TypeScript, Supabase, and Vercel.

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

The same Expo app in `apps/app` targets web, iOS, and Android. The repo uses Expo's **bare workflow**: `apps/app/ios/` and `apps/app/android/` are committed and edited directly, and builds run locally on the developer's Mac with Xcode (iOS) and Android Studio (Android). **`expo prebuild` MUST NOT be run again on this repo** — it would overwrite committed native changes.

The native camera flows use `expo-camera` (or the local `expo-pose-landmarker` module on the analysis screens) with only the camera permission enabled. Android explicitly blocks microphone recording permission, and the app keeps the screen awake while an analysis camera is mounted.

### Requirements for native builds

In addition to the project [Requirements](#requirements):

- **macOS** (iOS builds need Xcode, which is Mac-only).
- **Xcode 16+** with the iOS SDK (current default Xcode in the team: 26.x).
- **CocoaPods**: `brew install cocoapods`.
- **JDK 17** (Zulu / Temurin / Oracle): `java -version` should report `17.x`.
- **Android Studio** with Android SDK Platform 34+, Build-Tools 36+, NDK 27+, CMake, and Platform-Tools. Android Studio installs these on first project sync; the first `npm run android` will also auto-install missing pieces if it can find the SDK.
- **Watchman** (recommended) for Metro file watching: `brew install watchman`.
- **UTF-8 shell locale.** Add to `~/.zshrc`:

  ```bash
  export LANG=en_US.UTF-8
  export LC_ALL=en_US.UTF-8
  ```

  CocoaPods 1.16 on Ruby 4 crashes with `Encoding::CompatibilityError` on shells without UTF-8. The `npm run ios*` scripts already bake this in, but other CocoaPods commands you run by hand will need it.

### Running the app

| Target | Command | Notes |
|---|---|---|
| Web (dev) | `npm run web` | Metro at <http://localhost:8081>. |
| Web (production build) | `npm run build` | Static export to `apps/app/dist/`. |
| iOS Simulator | `npm run ios` | First build takes 5-10 min (Pods compile from source). |
| iOS physical device (USB) | `npm run ios:device` | See [Known issue: iOS 26+](#known-issue-ios-26-device-install) if it errors at install. |
| iOS via Xcode | `npm run ios:xcode` → ⌘R | Easiest path; Xcode handles signing automatically. |
| Android emulator or device | `npm run android` | Needs an AVD running (or device with USB debugging enabled). |
| Android via Android Studio | `npm run android:studio` | Then *Sync Project with Gradle Files* → Run. |

First-time Android build: if Gradle errors with `SDK location not found`, create `apps/app/android/local.properties` (gitignored):

```
sdk.dir=/Users/<you>/Library/Android/sdk
```

#### Known issue: iOS 26+ device install

`expo run:ios --device` errors with `LockdowndClient.startSession: Cannot convert object to primitive value` against iPhones on iOS 26+ — this is a bug in the Expo CLI 55 internal lockdownd client, not in this project. The build itself **succeeds**; only the install step fails. Two workarounds:

**Workaround A — Xcode (recommended, one click):**

```bash
npm run ios:xcode    # opens apps/app/ios/athmira.xcworkspace
# Pick your iPhone in the device dropdown → ⌘R
```

Xcode uses `xcrun devicectl` under the hood and avoids the bug.

**Workaround B — CLI (`xcrun devicectl`):**

```bash
# Make sure Developer Mode is enabled on the iPhone:
# Settings → Privacy & Security → Developer Mode → On (requires reboot)

# 1. Build the .app
cd apps/app && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 \
  xcodebuild -workspace ios/athmira.xcworkspace -scheme athmira \
  -configuration Debug -destination 'generic/platform=iOS' \
  -derivedDataPath ios/build/DerivedData build

# 2. List the device's UDID
xcrun devicectl list devices

# 3. Install the .app
xcrun devicectl device install app --device <UDID> \
  ios/build/DerivedData/Build/Products/Debug-iphoneos/athmira.app

# 4. Start Metro in another terminal
npm run dev

# 5. Launch the app
xcrun devicectl device process launch --device <UDID> com.athmira.app
```

### Production builds

| Output | Command | Where it lands |
|---|---|---|
| iOS `.xcarchive` | `npm run ios:archive` | `apps/app/ios/build/athmira.xcarchive` |
| Android AAB (Play Store) | `npm run android:bundle` | `apps/app/android/app/build/outputs/bundle/release/app-release.aab` |
| Android APK (sideload / internal testing) | `npm run android:apk` | `apps/app/android/app/build/outputs/apk/release/app-release.apk` |

For iOS App Store uploads, open the `.xcarchive` in Xcode → *Organizer* → *Distribute App*, or use `npm run ios:xcode` and Product → Archive → Distribute App from there directly.

For Play Store uploads, see [Signing → Android signing — pending: Play Console setup](#android-signing--pending-play-console-setup).

### Modifying native code

In bare workflow, `apps/app/ios/` and `apps/app/android/` are the **source of truth** for native configuration. Edit those files directly — `app.json` and `app.config.js` are no longer used to regenerate native config.

| Change | Edit this file |
|---|---|
| iOS Info.plist (permissions, capabilities, display name) | `apps/app/ios/athmira/Info.plist` |
| iOS app delegate / startup | `apps/app/ios/athmira/AppDelegate.swift` |
| iOS entitlements | `apps/app/ios/athmira/athmira.entitlements` |
| Add a CocoaPod | `apps/app/ios/Podfile` then `npm run ios:pods` |
| Android manifest (permissions, deep links) | `apps/app/android/app/src/main/AndroidManifest.xml` |
| Android app gradle (SDK levels, `versionCode`/`versionName`, deps) | `apps/app/android/app/build.gradle` |
| Android Kotlin/Java startup | `apps/app/android/app/src/main/java/com/athmira/app/` |
| Add a local Expo Module | `apps/app/modules/` (see `expo-pose-landmarker/` as template) |

**Never run `expo prebuild` again on this repo.** It would overwrite all the manual native changes that have been committed.

`app.json` and `app.config.js` are still valid — but only for **Expo runtime metadata**: slug, scheme, `version` displayed in Expo APIs, the expo-router origin plugin, etc.

### Native modules for performance-critical flows

Expo is **not** a hard ceiling on what athmira can do natively. For high-throughput camera and image-processing scenarios — especially the bike-fit **frontal (front knee tracking)** and **lateral (side bike fit)** capture flows, and any future aero posture, video, or sensor-fusion pipeline — the project explicitly allows (and encourages) dropping into native code on each platform: Swift (with Metal / AVFoundation / Vision when useful) on iOS, Kotlin (with CameraX + GPU delegate) on Android. The goal is that no real-time CV feature is ever slow because of an Expo-imposed JS path.

The contract for that native code is:

- Wrap it as a **local Expo Module** under `apps/app/modules/` (see `apps/app/modules/expo-pose-landmarker/` as the canonical reference: Swift + MediaPipe Metal delegate on iOS, Kotlin + MediaPipe GPU delegate on Android).
- Expose a single typed **TypeScript façade** so screens, shared engines (`pose-engine`, `fit-engine`, `aero-engine`), and tests stay platform-agnostic.
- Provide a **web fallback** (lower-fidelity is fine — e.g. TFJS WebGL, slower polling) so the web build never blocks the user.
- Keep business logic in shared packages or services, **not** inside the native module bridge.

When adding device-specific features, prefer Expo SDK modules first for ordinary functionality. For anything performance-critical, follow the native-module contract above.

### EAS Build (legacy)

EAS Build is no longer used by this project. The original `apps/app/eas.json` is preserved at `apps/app/.archive/eas.json.legacy` as a historical reference. The bare workflow described above replaces it on all platforms.

The `eas.projectId` in `apps/app/app.json` is intentionally still in place, so if the project ever needs to return to EAS for OTA updates, store submission via `eas submit`, or remote builds, restore `eas.json` from the archive and `eas` commands will continue to resolve the project.

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
# Web
npm run web              # Dev server for web (Metro at http://localhost:8081)
npm run build            # Static export of the Expo web app to apps/app/dist/

# iOS
npm run ios              # Build + install in the iOS Simulator
npm run ios:device       # Build + install on a connected iPhone/iPad (see "Known issue: iOS 26+")
npm run ios:release      # Build the iOS Release configuration on the simulator
npm run ios:archive      # Build a .xcarchive for App Store distribution
npm run ios:xcode        # Open apps/app/ios/athmira.xcworkspace in Xcode
npm run ios:pods         # cd apps/app/ios && pod install

# Android
npm run android          # Build + install on the running emulator or USB device
npm run android:release  # Build the Android Release variant locally
npm run android:apk      # Assemble a signed (or debug-signed) release APK
npm run android:bundle   # Bundle a signed (or debug-signed) release AAB
npm run android:studio   # Open apps/app/android in Android Studio
npm run android:clean    # ./gradlew clean

# Dev server (shared)
npm run dev              # expo start --dev-client (Metro for installed dev clients)

# Quality
npm run expo:check       # Check Expo SDK dependency compatibility
npm run lint             # Run Expo lint
npm run typecheck        # Run TypeScript checks
```

All `npm run ios*` scripts include `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` to work around the CocoaPods 1.16 + Ruby 4 encoding bug. Other scripts run as-is.

## Troubleshooting

**`Encoding::CompatibilityError` from CocoaPods** — Your shell isn't in UTF-8. Either export `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` in `~/.zshrc` (recommended) or prefix the failing command with them inline. The `npm run ios*` scripts already do this.

**`Pod not found` / Pods out of date** — `npm run ios:pods`.

**`SDK location not found` (Android Gradle)** — Create `apps/app/android/local.properties` (gitignored):

```
sdk.dir=/Users/<you>/Library/Android/sdk
```

**`MediaPipe pose_landmarker_lite.task not found`** — The model file is gitignored and must be downloaded once into both copies. See [apps/app/modules/expo-pose-landmarker/README.md](apps/app/modules/expo-pose-landmarker/README.md).

**`expo run:ios --device` errors with `LockdowndClient.startSession`** — Known Expo CLI 55 bug on iOS 26+. The build is fine; only the install fails. Use [Workaround A or B](#known-issue-ios-26-device-install).

**`Could not load JS bundle`** — Metro isn't running. Open a second terminal and run `npm run dev`. The dev client looks for Metro at `http://<your-LAN-IP>:8081`.

**App lints/typechecks clean locally but Vercel preview shows errors** — Vercel runs `npm run build` which does **not** run `lint` or `typecheck`. Run them locally before pushing:

```bash
npm run typecheck && npm run lint
```

**Android emulator boots but the app never starts** — Metro and the emulator must be on the same loopback. After a long pause adb may forget the device — `adb kill-server && adb start-server` and check `adb devices`.

**`expo prebuild` was accidentally run** — Stop the command if it's still going. `git status` will show massive diffs to `apps/app/ios/` and `apps/app/android/`. Discard them: `git checkout -- apps/app/ios apps/app/android` and `git clean -fd apps/app/ios apps/app/android`. The committed bare-workflow versions of those folders are the canonical source.

## Safety And Claims

athmira's early bike-fit and aero results are preliminary, estimated, camera-based guidance for training and educational purposes. They are not medically accurate, do not replace a professional bike fit, and do not provide real wind-tunnel or CFD precision.
