// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma"; 
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Identifiants requis");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.motDePasse) {
          throw new Error("Utilisateur non trouvé");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.motDePasse
        );

        if (!isPasswordCorrect) {
          throw new Error("Mot de passe incorrect");
        }

        // 🛡️ RÈGLE MÉTIER DE SÉCURITÉ : Vérification du compte actif
        // (Ajuste "est_actif" ou "isActive" selon le nom exact dans ton modèle Prisma)
        if (user.actif === false) {
          throw new Error("COMPTE_INACTIF"); 
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role, 
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; 
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id; 
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", 
    error: "/api/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };