import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "./db/db";
import { trustedOrigins } from "./lib/env";
import {
  users,
  sessions,
  accounts,
  verificationTokens,
} from "./db/auth-schema";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

function toOrigin(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const authTrustedOrigins = Array.from(
  new Set(
    [
      ...trustedOrigins,
      toOrigin(process.env.BETTER_AUTH_URL),
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter((value): value is string => Boolean(value)),
  ),
);

const socialProviders = {
  ...(githubClientId && githubClientSecret
    ? {
        github: {
          clientId: githubClientId,
          clientSecret: githubClientSecret,
        },
      }
    : {}),
  ...(googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : {}),
};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: authTrustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verificationTokens,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  plugins: [username()],
});
