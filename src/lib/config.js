// All configuration is read from environment variables (VITE_* prefix).
// There are no hardcoded fallbacks — a missing variable throws at module load
// time so the app fails fast with a clear message instead of silently hitting
// the wrong backend.

const REQUIRED = [
  'VITE_ADMIN_WORKER_URL',
  'VITE_MEDIA_WORKER_URL',
  'VITE_MEMBERSHIP_WORKER_URL',
  'VITE_EVENTS_WORKER_URL',
  'VITE_OAUTH_URL',
  'VITE_OAUTH_SITE_ID',
];

const missing = REQUIRED.filter(k => !import.meta.env[k]);
if (missing.length > 0) {
  throw new Error(
    `Admin portal is missing required environment variable${
      missing.length > 1 ? 's' : ''
    }:\n  ${missing.join('\n  ')}\n\nCopy .env.example to .env.local and fill in all values.`
  );
}

export const ADMIN_WORKER_URL      = import.meta.env.VITE_ADMIN_WORKER_URL;
export const MEDIA_WORKER_URL      = import.meta.env.VITE_MEDIA_WORKER_URL;
export const MEMBERSHIP_WORKER_URL = import.meta.env.VITE_MEMBERSHIP_WORKER_URL;
export const EVENTS_WORKER_URL     = import.meta.env.VITE_EVENTS_WORKER_URL;
export const OAUTH_URL             = import.meta.env.VITE_OAUTH_URL;
// Must match the hostname the Sveltia auth worker was configured with (the Hugo site).
// Stays fixed whether the admin portal runs on localhost or Cloudflare Pages.
export const OAUTH_SITE_ID         = import.meta.env.VITE_OAUTH_SITE_ID;
