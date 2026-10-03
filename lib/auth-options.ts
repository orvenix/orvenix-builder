import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, roleForEmail, verifyPassword } from "@/lib/auth";
import { resolveAuthSecretV1 } from "@/lib/auth-secret";
import { RATE_LIMIT_POLICIES_V1, checkRateLimitV1, rateLimitIdentityV1 } from "@/lib/security/rate-limit";

export const authOptions: NextAuthOptions = {
  // SEC-1 (SEC0-09): resolved per request; production without a configured secret fails closed.
  get secret() {
    return resolveAuthSecretV1();
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        // SEC-1 (SEC0-10): bound password guessing per client + account.
        const headers = (req?.headers ?? {}) as Record<string, string | undefined>;
        const client = rateLimitIdentityV1({ headers: { get: (name: string) => headers[name] ?? null } });
        const limited = await checkRateLimitV1(RATE_LIMIT_POLICIES_V1.login, `${client}|${String(credentials.email).trim().toLowerCase()}`);
        if (!limited.ok) return null;
        const user = await getUserByEmail(credentials.email as string);
        if (!user) return null;
        const valid = verifyPassword(credentials.password as string, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: roleForEmail(user.email, user.role),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      if (user?.role) token.role = user.role;
      token.role = roleForEmail(token.email ?? "", token.role);
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      if (session.user) session.user.role = roleForEmail(session.user.email ?? "", token.role);
      return session;
    },
  },
};

