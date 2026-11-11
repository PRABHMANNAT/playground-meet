export function appOrigin() {
  if (process.env.APP_URL) return new URL(process.env.APP_URL).origin;
  const host =
    process.env.VERCEL_ENV === 'production'
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? new URL(`https://${host}`).origin : 'http://localhost:3000';
}

export function allowedOrigins() {
  const origins = new Set([appOrigin()]);
  if (process.env.VERCEL === '1') {
    for (const host of [
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ]) {
      if (host) origins.add(new URL(`https://${host}`).origin);
    }
  }
  return origins;
}
