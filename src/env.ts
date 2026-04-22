export const env = {
  databaseUrl: process.env.DATABASE_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  gmailEnabled: process.env.GMAIL_ENABLED === "true",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI
};
