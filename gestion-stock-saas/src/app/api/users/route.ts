// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { UserService } from "@/services/UserService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const users = await UserService.getAllUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 🛡️ Logique métier de sécurité : Seul un ADMIN peut créer un utilisateur
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé. Rôle ADMIN requis." }, { status: 403 });
    }

    const body = await req.json();

    if (!body.nom || !body.prenom || !body.email || !body.motDePasse) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const newUser = await UserService.createUser(body);
    return NextResponse.json({ message: "Utilisateur créé avec succès", user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}