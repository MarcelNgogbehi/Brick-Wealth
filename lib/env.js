// lib/env.js
//
// Runtime environment validation.
// Fails fast at boot if anything required is missing.
// Import this from one place (e.g. middleware.js) so the check runs
// before the first request is served.

const REQUIRED_PROD = [
  "DATABASE_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "APP_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "SESSION_SECRET",
];

const REQUIRED_DEV = [
  "DATABASE_URL",
  "APP_URL",
];

function get(name, fallback = undefined) {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v;
}

function ensureRequired() {
  const isProd = process.env.NODE_ENV === "production";
  const required = isProd ? REQUIRED_PROD : REQUIRED_DEV;
  const missing = required.filter((k) => !get(k));

  if (missing.length) {
    const msg = `[env] Missing required environment variables: ${missing.join(", ")}`;
    if (isProd) {
      throw new Error(msg);
    } else {
      console.warn(`⚠️  ${msg}`);
      console.warn("    Running in dev mode — emails will log to console, rate limiting in-memory.");
    }
  }
}

ensureRequired();

export const env = {
  NODE_ENV: get("NODE_ENV", "development"),
  IS_PROD: process.env.NODE_ENV === "production",
  IS_DEV: process.env.NODE_ENV !== "production",

  DATABASE_URL: get("DATABASE_URL"),
  APP_URL: get("APP_URL", "http://localhost:3000"),

  // Email
  RESEND_API_KEY: get("RESEND_API_KEY"),
  EMAIL_FROM: get("EMAIL_FROM", "Bricks & Wealth <noreply@brickandwealth.com>"),

  // Redis (Upstash) — for distributed rate limiting + session cache
  UPSTASH_REDIS_REST_URL: get("UPSTASH_REDIS_REST_URL"),
  UPSTASH_REDIS_REST_TOKEN: get("UPSTASH_REDIS_REST_TOKEN"),

  // Secrets
  SESSION_SECRET: get("SESSION_SECRET"),

  // Stripe (card payments). Optional — if STRIPE_SECRET_KEY is unset the
  // card-payment option is hidden and investors pay by bank transfer as before.
  STRIPE_SECRET_KEY: get("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: get("STRIPE_WEBHOOK_SECRET"),
  STRIPE_PUBLISHABLE_KEY: get("STRIPE_PUBLISHABLE_KEY"),

  // Optional CAPTCHA
  TURNSTILE_SECRET_KEY: get("TURNSTILE_SECRET_KEY"),
  TURNSTILE_SITE_KEY: get("TURNSTILE_SITE_KEY"),

  // Optional error tracking
  SENTRY_DSN: get("SENTRY_DSN"),
};

export function assertEnv(name) {
  if (!env[name]) {
    throw new Error(`[env] ${name} is required but not set`);
  }
  return env[name];
}