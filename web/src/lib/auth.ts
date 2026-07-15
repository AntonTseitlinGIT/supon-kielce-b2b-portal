import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getPortalPath } from "@/config/permissions.config";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const ip = (request as any)?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim()
          ?? (request as any)?.ip
          ?? "unknown";
        const rateLimitKey = `login:${ip}:${email}`;

        const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey);
        if (!allowed) {
          const minutes = Math.ceil(retryAfterMs / 60000);
          throw new Error(`Za dużo prób logowania. Spróbuj ponownie za ${minutes} min.`);
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            client: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
          },
        });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        clearRateLimit(rateLimitKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientId: user.clientId,
          branchId: user.branchId,
          clientName: user.client?.name ?? null,
          branchName: user.branch?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.clientId = (user as any).clientId;
        token.branchId = (user as any).branchId;
        token.clientName = (user as any).clientName;
        token.branchName = (user as any).branchName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.clientId = token.clientId as string | null;
        session.user.branchId = token.branchId as string | null;
        session.user.clientName = token.clientName as string | null;
        session.user.branchName = token.branchName as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
