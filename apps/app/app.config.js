const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

const envFiles = [
  path.resolve(__dirname, "../../.env.local"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, ".env.local"),
  path.resolve(__dirname, ".env")
];

for (const envFile of envFiles) {
  loadEnvFile(envFile);
}

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

const siteUrl = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "https://athmira.com"
);

const authRedirectUrl =
  process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL ||
  process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL ||
  `${siteUrl}/auth/callback`;

const turnstileSiteKey =
  process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ||
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  process.env.TURNSTILE_SITE_KEY ||
  "";

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  extra: {
    ...config.extra,
    ...appJson.expo.extra,
    authRedirectUrl,
    siteUrl,
    supabaseUrl,
    supabaseAnonKey,
    turnstileSiteKey
  }
});

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = unquote(rawValue);
  }
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

function normalizeBaseUrl(value) {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "https://athmira.com";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
