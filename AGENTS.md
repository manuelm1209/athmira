# AGENTS.md

## Product Context

This project is a web-first, mobile-ready sports performance application for beginner and intermediate endurance athletes.
The first target audience is cyclists and future triathletes who want help improving their bike fit, aero posture, nutrition, training preparation, and long-term performance.
The first MVP is a web application, but the architecture must support future native iOS and Android apps with minimal rework.
The main product idea is to help an athlete progress from beginner to more serious goals, such as completing a triathlon or Ironman-style event.

## Brand Writing

Always write the brand name as `athmira` and the domain as `athmira.com`, fully lowercase, matching the logo assets.

## Core Product Vision

The app will eventually include:

- Camera-based bike fit analysis
- Aero posture analysis
- Visual wind tunnel-style simulation
- Nutrition calculators
- Carbohydrate and hydration planning
- Tire pressure calculator
- Training guidance
- Wearable integrations
- Garmin, Strava, Apple Health, and Google Fit integrations
- AI coaching
- Progress tracking
- Multi-sport modules for cycling, running, swimming, and triathlon

The first version should not try to build everything. It should create the foundation.

## Current MVP Focus

The current MVP focuses on:

1. Authentication
2. User profile
3. Bike profile
4. Camera-based analysis flow
5. Mock fit results
6. Mock aero score
7. Supabase database structure
8. Vercel web deployment
9. Mobile-ready architecture
10. Secure platform administration for authorized admins

## Tech Stack

Use:

- Expo
- React Native
- React Native Web
- Expo Router
- TypeScript
- Supabase
- Vercel

Do not use Next.js for the main application.
Next.js may be added later only as a separate marketing website, blog, or SEO-focused public site.

## Architecture Principles

The app should be built as a cross-platform application from day one.
The same core code should eventually support:

- Web
- iOS
- Android

Keep business logic separate from UI.
Avoid placing calculations, Supabase queries, or computer vision logic directly inside screen components.
Use modules/services for:

- Supabase access
- Bike fit calculations
- Pose analysis
- Aero scoring
- Nutrition calculations
- AI recommendations
- Wearable integrations

## Cross-Platform Native Rules

Web, iOS, and Android must remain first-class targets. New features should be designed as shared TypeScript business logic with thin platform adapters.

- Unless a request explicitly says it is only for web, only for iOS, or only for Android, treat every UI and behavior change as cross-platform work for web, iOS, and Android.
- This rule is mandatory: any new label, copy, color, animation, phase machine, overlay, instruction, badge, or interaction added to a `*.web.tsx` component MUST also land in the matching `*.native.tsx` sibling (and vice versa) in the same change set.
- Camera tracking UX (countdown phases, big-number overlays, position guides, brand colors, recording progress, completion states) must stay visually and behaviorally consistent across `*.web.tsx` and `*.native.tsx` siblings.
- When pose detection or any other capability is not yet available natively, still implement the surrounding UX (countdowns, instructions, phase overlays) so users see the same flow on every platform; gate only the capability-dependent visuals behind feature detection until the native implementation ships.
- Add or update i18n keys in `apps/app/src/i18n/translations.ts` (both `en` and `es`) for every user-facing string introduced in any platform variant.
- When changing shared screens, verify that shared primitives render acceptably on native as well as React Native Web; do not leave native with a different interaction model unless there is a documented platform reason.
- Prefer Expo SDK modules before adding custom native code.
- Test native functionality in Expo Go first when possible.
- Use development builds or EAS builds only when a feature needs a local Expo module, native config plugin, or native dependency outside Expo Go.
- Keep platform branches explicit with `.web.ts`, `.native.ts`, `.ios.ts`, or `.android.ts` files instead of scattering platform checks through screens.
- Add a web fallback or clear unsupported state for every native-only capability.
- Keep Swift/Kotlin/Java code inside local Expo modules only when JavaScript/TypeScript and Expo SDK modules are not enough.
- Expose custom native modules through typed TypeScript APIs and keep domain calculations in shared packages such as `pose-engine`, `fit-engine`, `aero-engine`, or `nutrition-engine`.
- Do not commit generated `ios/` or `android/` folders unless the project intentionally moves from managed Expo to committed native projects.
- Use `native:prebuild`, `native:prebuild:ios`, and `native:prebuild:android` script names for Expo prebuild commands. Do not add npm lifecycle scripts named `prebuild`, because npm runs them automatically before `build`.
- Keep native app configuration in `apps/app/app.json`, `apps/app/app.config.js`, and `apps/app/eas.json`; document new permissions, entitlements, or build profile changes in README.

## Image and Asset Optimization

Treat every committed image, icon, or media file as a performance and bandwidth cost. The web build, native bundles, and slow mobile networks all pay for oversized assets.

- Optimize before committing. Never check in a raw camera/export PNG, screenshot, or multi-megabyte source file. Resize and recompress to the dimensions actually needed by the UI.
- Pick the smallest format that preserves quality: prefer JPG (quality ≈70–80) for photos and rendered bike or product shots; use PNG only when transparency matters; use SVG for icons and brand marks; consider WebP/AVIF when a single platform target warrants it.
- Target reasonable dimensions for the use case. Card images and previews should max out around 1000–1200 px on the longest edge. App icons and thumbnails should be sized to their actual render size at @2x or @3x, not arbitrary large dimensions.
- Keep file sizes lean. As a rule of thumb: under ~150 KB for content/preview images, under ~50 KB for UI icons or small thumbnails, under ~30 KB for inline logos.
- Group assets by purpose under `apps/app/assets/<group>/` (e.g. `assets/bikes/`, `assets/home/`, `assets/brand/`) and name them with kebab-case, lowercase, ASCII-only filenames.
- Centralize image references in a typed `require(...)` mapping module (see `apps/app/src/lib/bike-images.ts` and `apps/app/src/lib/visual-assets.ts`) instead of scattering raw `require` calls through screens.
- Do not upload original-resolution photos, scans, or designer exports directly to user-facing pages. Optimize them first; if you must keep an original, store it outside the bundled `assets/` directory.
- When adding new image sets, document any non-obvious source/size choices in this file or in the relevant README.

## Cybersecurity Requirements

Cybersecurity is a must for every feature. Treat auth, user profile data, bike data, camera/media data, analysis history, and future wearable or AI data as sensitive user data.

Security rules for all changes:

- Never commit secrets or private keys.
- Never expose service-role, database, JWT, Turnstile secret, or provider secret keys to Expo, React Native Web, or any `EXPO_PUBLIC_*` variable.
- Keep Supabase access behind service modules and rely on Row Level Security as the server-side authorization boundary.
- Enable and review RLS for every user-owned table in exposed schemas.
- Store media in private Supabase Storage buckets and use signed URLs for private access.
- Keep privileged database functions out of exposed schemas when possible, lock down executable privileges, and set explicit `search_path` values.
- Validate and normalize user-controlled input before persistence.
- Keep camera permissions scoped to the analysis flows and stop media tracks when analysis components unmount.
- Use bot protection on auth forms and keep CAPTCHA secrets server-side.
- Keep platform-admin operations behind trusted server endpoints; never call Supabase Admin Auth APIs from the Expo client.
- Store admin grants separately from editable profile data so users cannot self-promote.
- Audit admin grants, revocations, user creation, profile edits, and password resets.
- Add or update security notes in README, migrations, and deployment config when introducing new auth, storage, AI, wearable, or external integration behavior.

## Admin UI Pattern

The main `/admin` route must stay as a minimal administration hub. It should show the available admin areas and route the administrator to dedicated pages instead of rendering all management forms directly.

Current dedicated admin pages:

- `/admin/users` for user creation, user account review, role management, temporary passwords, bikes, and camera analysis review.
- `/admin/nutrition-products` for creating and editing global nutrition products, including English and Spanish names plus composition values.

When adding new admin functionality, add it as a dedicated admin route and link to it from the `/admin` hub. Keep privileged operations behind existing protected admin endpoints or RLS policies, depending on the operation.

## Suggested Structure

```text
/apps
  /app
    Main Expo application
/packages
  /supabase
  /types
  /ui
  /pose-engine
  /fit-engine
  /aero-engine
  /nutrition-engine
  /ai-engine
```

If the project is not yet a monorepo, keep a simple Expo structure but organize the app internally using the same separation.

Suggested internal structure:

```text
/src
  /app
  /components
  /features
    /auth
    /dashboard
    /bikes
    /analysis
    /results
    /profile
  /lib
    /supabase
  /services
    /fit-engine
    /aero-engine
    /pose-engine
    /nutrition-engine
  /types
  /utils
```

## Product Modules

### Bike Fit

The bike fit module should eventually:

- Use the camera to detect body posture
- Detect key joints
- Calculate angles
- Compare measurements against expected ranges
- Recommend bike adjustments
- Track before and after sessions

Important measurements:

- Knee angle
- Hip angle
- Torso angle
- Elbow angle
- Shoulder angle
- Head position
- Pedaling stability
- Fit confidence score

### Aero Analysis

The aero module should eventually:

- Estimate frontal area
- Analyze torso position
- Analyze head position
- Analyze arm compactness
- Score posture stability
- Save best posture snapshot
- Display wind tunnel-style visual feedback

Important note:

The app should not claim to provide professional CFD simulation or real wind tunnel precision. The early version should describe this as an estimated visual aero analysis.

Use language such as:

- Estimated aero score
- Camera-based guidance
- Preliminary analysis
- Visual simulation
- Educational purposes

### Nutrition

The nutrition module should eventually include:

- Carbohydrate calculator
- Hydration calculator
- Sodium/electrolyte calculator
- Tire pressure calculator based on bike type, rider weight, tire width, and riding surface
- Pre-workout meal suggestions
- Long ride fueling plans
- Race day fueling plan

### AI Coach

The AI coach should eventually:

- Explain fit results
- Suggest next steps
- Help beginners understand training decisions
- Adjust recommendations based on progress
- Use wearable data when available
- Avoid medical claims

The AI coach should not replace doctors, physical therapists, professional coaches, or bike fitters.

### Wearables

Future integrations may include:

- Apple Health
- Google Fit / Health Connect
- Garmin
- Strava
- Wahoo
- TrainingPeaks

The first version does not need these integrations, but the data model should not block them.

## Supabase Guidelines

Use Supabase for:

- Authentication
- Postgres database
- Storage
- Row Level Security
- Future Edge Functions

Use environment variables:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Never hardcode credentials.

Use RLS policies so users can only access their own data.

Store media files in Supabase Storage. Do not store video or image blobs directly in Postgres.

## Core Database Tables

Initial tables:

- profiles
- admin_roles
- bikes
- fit_sessions
- fit_measurements
- aero_scores
- recommendations
- media_assets

Future tables:

- workouts
- nutrition_logs
- wearable_connections
- wearable_metrics
- training_plans
- ai_conversations
- ai_recommendations

## Safety and Claims

The app should be careful with health, injury, and performance claims.

Do not say:

- "This is medically accurate"
- "This replaces a professional bike fit"
- "This prevents injury"
- "This calculates your real drag coefficient"
- "This is equivalent to a wind tunnel"

Prefer:

- "Estimated"
- "Preliminary"
- "Educational"
- "Guidance"
- "Camera-based"
- "AI-assisted"
- "Consult a professional if pain persists"

## UI Direction

The app should feel:

- Clean
- Athletic
- Premium
- Friendly for beginners
- Data-driven but not overwhelming

Avoid making the first version too complex.

Prioritize:

- Simple onboarding
- Clear camera setup instructions
- Easy bike profile creation
- Clear results
- Actionable recommendations

## Initial Routes

Use Expo Router.

```text
/
  Welcome screen
/auth/login
  Login
/auth/signup
  Signup
/dashboard
  Main dashboard
/profile
  User profile
/bikes
  Bike list
/bikes/new
  New bike
/analysis
  Start analysis
/analysis/camera
  Camera flow
/analysis/results
  Results
/settings
  Settings
```

## Camera Flow

The camera flow should:

1. Ask for camera permission.
2. Show live preview.
3. Explain setup instructions.
4. Show an overlay placeholder for future pose lines.
5. Let the user start a mock analysis.
6. Create a fit session in Supabase.
7. Navigate to a results screen.

For now, computer vision can be mocked.

The code should still be structured as if real pose detection will be added later.

Native camera requirements:

- Use `expo-camera` (`CameraView`) for iOS and Android camera previews. The web targets continue to use the browser `getUserMedia` API in `*.web.tsx` siblings.
- Native pose detection runs MediaPipe Pose Landmarker (Lite) via the local Expo Module at `apps/app/modules/expo-pose-landmarker/`. Swift uses the Metal GPU delegate (`MediaPipeTasksVision` pod); Kotlin uses the Android GPU delegate (`com.google.mediapipe:tasks-vision`). The module exposes a `<PoseLandmarkerView />` React component (drop-in replacement for `expo-camera`'s `CameraView`) that owns the `AVCaptureSession` / CameraX pipeline and runs MediaPipe in live-stream mode — poses are emitted directly via the `onPose` event at the device's native frame rate. Target FPS: ≥20 on iPhone 12+ / Pixel 6+. No TFJS, no `jpeg-js`, no manual decode loop, no polling.
- The module emits 17 COCO-style keypoints (`nose`, `left_shoulder`, etc.) in normalized `[0, 1]` coords; MediaPipe's full 33-landmark output is filtered/renamed natively via the mapping table in `src/landmarkMapping.ts` (kept in lockstep with the iOS Swift `mediaPipeIndexToCoco17` and Android Kotlin `MEDIAPIPE_TO_COCO17`). This keeps the existing SVG overlays, `poseOverlayMath.ts`, and `fit-engine` consumers unchanged.
- Do **not** reintroduce `react-native-vision-camera`, `react-native-fast-tflite`, `react-native-worklets-core`, `react-native-worklets`, `react-native-nitro-modules`, or `react-native-nitro-image` to the camera path. The upstream `folly/coro/Coroutine.h` bug (facebook/react-native#53575) still blocks all worklets-based stacks on RN 0.83 and there is no public confirmation it's fixed on RN 0.85. MediaPipe Tasks Vision does not pull `folly::coro` and is the supported route.
- MediaPipe model file: `pose_landmarker_lite.task` (~5 MB) must be downloaded once from Google's CDN and placed inside both `apps/app/modules/expo-pose-landmarker/ios/Resources/` and `apps/app/modules/expo-pose-landmarker/android/src/main/assets/`. Both copies are gitignored. See the module's README for the exact `curl` command.
- The legacy `apps/app/assets/models/movenet_singlepose_lightning.tflite` is no longer used and can be deleted once M2 ships and the polling path is removed.
- Local Expo Modules cannot run in Expo Go. Native development of the analysis flow requires an EAS dev build (`eas build --profile development --platform ios|android`). Web development still works in `npm run dev` because the web pose pipeline (TFJS WebGL) is untouched.
- Request only camera permission unless a feature truly records audio. The `expo-camera` plugin in `app.json` is already wired to disable microphone and the barcode scanner.
- Do not request Android `RECORD_AUDIO` for bike fit or posture capture.
- Keep the device awake during active camera analysis via `expo-keep-awake`.
- Mirror front-camera previews when they are used for rider setup (`CameraView`'s `mirror` prop).
- Handle `onCameraReady` and `onMountError` before enabling analysis actions.
- Keep camera screens responsive to notches, home indicators, small phones, tablets, and Android navigation areas.
- Stop or unmount camera sessions when leaving the analysis flow.

## Pose Engine Interface

Create interfaces similar to:

```ts
export type PoseKeypoint = {
  name: string;
  x: number;
  y: number;
  confidence: number;
};

export type JointAngles = {
  kneeAngle?: number;
  hipAngle?: number;
  torsoAngle?: number;
  elbowAngle?: number;
  shoulderAngle?: number;
};

export type FitScore = {
  comfortScore: number;
  aeroScore: number;
  confidenceScore: number;
};

export type FitRecommendation = {
  priority: "low" | "medium" | "high";
  category:
    | "saddle_height"
    | "saddle_position"
    | "reach"
    | "torso"
    | "arms"
    | "head"
    | "comfort"
    | "aero";
  message: string;
  adjustmentMm?: number;
  confidenceScore: number;
};
```

## Development Rules

When updating the project:

- Keep TypeScript strict.
- Keep components small.
- Prefer reusable components.
- Do not duplicate business logic.
- Keep Supabase calls in service modules.
- Keep calculations in engine modules.
- Keep screens focused on rendering and orchestration.
- Add useful README notes when introducing new setup steps.
- Update this AGENTS.md file when the product direction changes.

## Authenticated Playwright Access

Codex and the Playwright skill should use the saved authenticated browser state when inspecting protected app screens.

- Default local URL: `http://localhost:8081`.
- Default storage state: `playwright/.auth/codex-user.json`.
- Playwright test config reads `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_STORAGE_STATE`, falling back to those defaults.
- The `chromium` project uses the saved storage state directly by default, so protected routes can be tested without re-entering credentials.
- To regenerate `playwright/.auth/codex-user.json`, put `CODEX_TEST_EMAIL` and `CODEX_TEST_PASSWORD` in `.env.local`, start the app, then run `PLAYWRIGHT_REFRESH_AUTH=1 npx playwright test --project=setup`.
- The Playwright CLI skill reads `playwright-cli.json` from the repo root. Run CLI commands from `/Users/manuelmontoya/CODE/athmira` so the skill automatically uses `playwright/.auth/codex-user.json`.
- When using the Playwright CLI skill, open protected pages with the localhost origin that matches the saved state, for example `http://localhost:8081/dashboard`, `http://localhost:8081/profile`, or `http://localhost:8081/admin/users`.
- Do not commit `playwright/.auth/*.json`; these files contain user session tokens and are ignored by git.

## Deployment

The web version should be deployable to Vercel.

Include:

- Build command
- Output directory
- Environment variable instructions
- Supabase setup instructions

## Current Priority

The current priority is not perfect computer vision.

The current priority is to build a strong foundation:

1. App structure
2. Auth
3. Supabase schema
4. Bike profiles
5. Camera flow
6. Mock analysis
7. Results screen
8. Vercel deployment

Once this is stable, real pose detection and aero analysis can be added.
