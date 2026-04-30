const required = [
  "DATABASE_URL",
  "LINE_CHANNEL_ACCESS_TOKEN",
  "LINE_CHANNEL_SECRET",
  "LINE_USER_ID",
  "BASE_URL",
] as const;

type EnvKey = (typeof required)[number];

function getEnv(): Record<EnvKey, string> {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  return Object.fromEntries(
    required.map((k) => [k, process.env[k] as string])
  ) as Record<EnvKey, string>;
}

export const env = getEnv();
