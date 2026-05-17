# AGENTS.md

## Product Context

This project is a web-first, mobile-ready sports performance application for beginner and intermediate endurance athletes.
The first target audience is cyclists and future triathletes who want help improving their bike fit, aero posture, nutrition, training preparation, and long-term performance.
The first MVP is a web application, but the architecture must support future native iOS and Android apps with minimal rework.
The main product idea is to help an athlete progress from beginner to more serious goals, such as completing a triathlon or Ironman-style event.

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
