export function integrationFlags(env: NodeJS.ProcessEnv = process.env): {
  database: boolean;
  newsletter: boolean;
  admin: boolean;
} {
  return {
    database: Boolean(env.DATABASE_URL),
    newsletter: Boolean(env.DATABASE_URL && env.RESEND_API_KEY && env.RESEND_FROM && env.RESEND_SEGMENT_ID),
    admin: Boolean(env.ADMIN_TOKEN),
  };
}
