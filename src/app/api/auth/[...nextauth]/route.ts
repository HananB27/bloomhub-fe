import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
// Use runtime-safe casts to avoid widening to `any` while keeping NextAuth callback signatures intact
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getApiBaseUrl } from "@/lib/config";

function getRoleNameFromUser(user: unknown): string | undefined {
  if (!user || typeof user !== "object") return undefined;

  const userRecord = user as Record<string, unknown>;
  const role = userRecord.role;

  if (typeof userRecord.role_name === "string") return userRecord.role_name;
  if (typeof role === "string") return role;
  if (role && typeof role === "object") {
    const roleRecord = role as Record<string, unknown>;
    if (typeof roleRecord.name === "string") return roleRecord.name;
  }

  return undefined;
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "MOCK_CLIENT_SECRET",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/auth/login/`, {
          method: "POST",
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (res.ok && data) {
          // data should contain { access, refresh, user }
          return {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.first_name} ${data.user.last_name}`,
            accessToken: data.access,
            refreshToken: data.refresh,
            career_level: data.user.career_level,
            image: data.user.avatar_url,
            is_staff: data.user.is_staff,
            is_superuser: data.user.is_superuser,
            role: getRoleNameFromUser(data.user),
          };
        }

        throw new Error(data.error || "Invalid email or password");
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user: _user }) {
      return true;
    },
    async jwt({ token, account, user }) {
      type JWTToken = {
        accessToken?: string;
        refreshToken?: string;
        career_level?: string;
        picture?: string;
        role?: string;
        error?: string;
        [key: string]: unknown;
      };

      // Helper: decode base64url JSON payload from JWT
      const decodeJwtPayload = (
        jwt?: string
      ): Record<string, unknown> | null => {
        if (!jwt) return null;
        try {
          const parts = jwt.split(".");
          if (parts.length < 2) return null;
          const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const json = Buffer.from(payload, "base64").toString("utf8");
          return JSON.parse(json) as Record<string, unknown>;
        } catch {
          return null;
        }
      };

      const isTokenExpired = (jwt?: string, offsetSeconds = 30) => {
        const payload = decodeJwtPayload(jwt);
        if (!payload || !("exp" in payload)) return true;
        const exp = Number(payload.exp);
        const now = Math.floor(Date.now() / 1000);
        return exp <= now + offsetSeconds;
      };

      const refreshAccessToken = async (
        currentToken: JWTToken
      ): Promise<JWTToken> => {
        try {
          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/api/auth/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: currentToken.refreshToken }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));

            console.error("[NextAuth] refresh failed", err);
            return { ...currentToken, error: "RefreshAccessTokenError" };
          }

          const data = (await res.json()) as Record<string, unknown>;
          const updated: JWTToken = { ...currentToken };
          if (typeof data.access === "string") {
            updated.accessToken = data.access;
          }
          if (typeof data.refresh === "string") {
            updated.refreshToken = data.refresh;
          }
          return updated;
        } catch (e) {
          console.error("[NextAuth] refresh exception", e);
          return { ...currentToken, error: "RefreshAccessTokenError" };
        }
      };

      // For Credentials provider, the 'user' object comes from the 'authorize' function above
      if (account?.provider === "credentials" && user) {
        const u = user as unknown as Record<string, unknown>;
        if (typeof u.accessToken === "string")
          token.accessToken = u.accessToken;
        if (typeof u.refreshToken === "string")
          token.refreshToken = u.refreshToken;
        if (typeof u.career_level === "string")
          token.career_level = u.career_level as string;
        if (typeof u.image === "string") token.picture = u.image as string;
        if (typeof u.is_staff === "boolean") token.is_staff = u.is_staff;
        if (typeof u.is_superuser === "boolean")
          token.is_superuser = u.is_superuser;
        if (typeof u.role === "string") token.role = u.role;
      }

      // For Google provider, we exchange the id_token for a local JWT
      if (
        account?.provider === "google" &&
        typeof account.id_token === "string"
      ) {
        try {
          const baseUrl = getApiBaseUrl();
          const response = await fetch(`${baseUrl}/api/auth/google/exchange/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });

          if (response.ok) {
            const data = (await response.json()) as Record<string, unknown>;
            if (typeof data.access === "string")
              token.accessToken = data.access;
            if (typeof data.refresh === "string")
              token.refreshToken = data.refresh;
            if (
              data.user &&
              typeof (data.user as Record<string, unknown>).career_level ===
                "string"
            ) {
              token.career_level = (data.user as Record<string, unknown>)
                .career_level as string;
            }
            if (
              data.user &&
              typeof (data.user as Record<string, unknown>).avatar_url ===
                "string"
            ) {
              token.picture = (data.user as Record<string, unknown>)
                .avatar_url as string;
            }
            if (
              data.user &&
              typeof (data.user as Record<string, unknown>).is_staff ===
                "boolean"
            ) {
              token.is_staff = (data.user as Record<string, unknown>).is_staff;
            }
            if (
              data.user &&
              typeof (data.user as Record<string, unknown>).is_superuser ===
                "boolean"
            ) {
              token.is_superuser = (
                data.user as Record<string, unknown>
              ).is_superuser;
            }
            const roleName = getRoleNameFromUser(data.user);
            if (roleName) token.role = roleName;
          }
        } catch (error) {
          console.error("[NextAuth] Exchange error:", error);
        }
      } else if (user) {
        // This is for credentials provider
        const u = user as {
          accessToken?: string;
          refreshToken?: string;
          career_level?: string;
          image?: string;
          role?: string;
        };
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.career_level = u.career_level;
        token.picture = u.image;
        token.role = u.role;
      }

      // Try to refresh the token if it's expired (or missing expiry info)
      if (
        typeof token.accessToken === "string" &&
        isTokenExpired(token.accessToken)
      ) {
        const refreshed = await refreshAccessToken(
          token as unknown as JWTToken
        );
        return refreshed as unknown as Record<string, unknown>;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const t = token as unknown as Record<string, unknown>;

        // Add user ID to session
        if (typeof t.sub === "string") {
          (session.user as Record<string, unknown>).id = Number(t.sub);
        }

        // Add is_staff and is_superuser
        if (typeof t.is_staff === "boolean") {
          (session.user as Record<string, unknown>).is_staff = t.is_staff;
        }
        if (typeof t.is_superuser === "boolean") {
          (session.user as Record<string, unknown>).is_superuser =
            t.is_superuser;
        }
        if (typeof t.role === "string") {
          (session.user as Record<string, unknown>).role = t.role;
        }

        // Add picture
        if (typeof t.picture === "string") {
          session.user!.image = t.picture as string;
        }

        // Add career level
        if (typeof t.career_level === "string") {
          session.user =
            session.user || ({} as unknown as Record<string, unknown>);
          (session.user as Record<string, unknown>).career_level =
            t.career_level as string;
        }

        // Add access token
        if (typeof t.accessToken === "string") {
          (session as unknown as Record<string, unknown>).accessToken =
            t.accessToken;
        }
      }
      return session;
    },
  },
  debug: true,
  secret:
    process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_development",
});

export { handler as GET, handler as POST };
