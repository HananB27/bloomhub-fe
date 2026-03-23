import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getApiBaseUrl } from "@/lib/config";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "MOCK_CLIENT_SECRET",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("[NextAuth] signIn callback triggered. User:", user?.email);
      console.log("[NextAuth] Account type:", account?.provider);
      return true;
    },
    async jwt({ token, account, user, profile }) {
      if (account && account.id_token) {
        // Exchange Google ID token for local JWT from Django backend
        try {
          const baseUrl = getApiBaseUrl();
          const response = await fetch(`${baseUrl}/api/auth/google/exchange/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });

          if (response.ok) {
            const data = await response.json();
            token.accessToken = data.access;
            token.refreshToken = data.refresh;
            token.career_level = data.user?.career_level;

            token.picture =
              (data.user as { avatar_url?: string })?.avatar_url ||
              (profile as { picture?: string })?.picture ||
              user?.image ||
              (token.picture as string);
          } else {
            token.accessToken = account.access_token; // Fallback to Google token
          }
        } catch (error) {
          console.error("[NextAuth] Exchange error:", error);
          token.accessToken = account.access_token;
        }
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.image = token.picture;
        session.user.career_level = token.career_level;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  debug: true,
  secret:
    process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_development",
});

export { handler as GET, handler as POST };
