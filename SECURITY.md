# Security Policy

Athmira handles account, profile, bike, camera, media, and performance-analysis data. Cybersecurity is required for every product change.

## Sensitive Data

Treat these as sensitive:

- Supabase Auth sessions and user IDs
- Profile, language, height, weight, gender, and birth date fields
- Bike geometry and equipment data
- Camera snapshots, videos, pose keypoints, and analysis history
- Future wearable, nutrition, training, and AI coaching data

## Secret Handling

Never commit secrets. Never expose service-role, database, JWT, CAPTCHA secret, wearable-provider secret, or AI-provider secret keys through Expo or any `EXPO_PUBLIC_*` variable.

Client-safe values include:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SITE_URL`
- `EXPO_PUBLIC_AUTH_REDIRECT_URL`
- `EXPO_PUBLIC_TURNSTILE_SITE_KEY`

Server-only values include:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_JWT_SECRET`
- `POSTGRES_URL`
- `TURNSTILE_SECRET_KEY`

## Supabase Requirements

- Enable RLS on every user-owned table in exposed schemas.
- Add ownership policies for select, insert, update, and delete paths that the app needs.
- Keep admin grants separate from editable profile data.
- Never allow users to mutate their own admin role through client-accessible profile updates.
- Keep privileged functions in private schemas when possible.
- Set explicit `search_path` values on trigger/helper functions.
- Store media in private Supabase Storage buckets.
- Use signed URLs for private media access.

## Admin API Requirements

- Keep Supabase Admin Auth calls on trusted server endpoints only.
- Verify the requester's Supabase access token before each admin action.
- Check `public.admin_roles` before using `SUPABASE_SERVICE_ROLE_KEY`.
- Write an audit log for user creation, profile edits, and password resets.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only in Vercel/Supabase secrets.
- Do not log temporary passwords, access tokens, refresh tokens, or service keys.

## Web Deployment Requirements

- Keep Vercel security headers configured in `vercel.json`.
- Keep auth routes compatible with Expo Router static fallback.
- Do not add third-party scripts without reviewing their data flow and required headers.
- Keep camera permissions limited to analysis screens and stop media tracks when leaving those screens.

## Reporting

If you find a security issue, do not post exploit details publicly. Document the affected route, data type, reproduction steps, and expected impact for maintainers.
