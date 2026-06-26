import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, nom, prenom, password, role } = body;

    // Validation de base
    if (!email || !password || !nom || !prenom) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires." },
        { status: 400 }
      );
    }

    // 1. Vérifier si l'utilisateur existe déjà
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 400 }
      );
    }

    // 2. Hasher le mot de passe (Sécurité IIR obligatoire)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Création dans la base de données
    const user = await prisma.user.create({
      data: {
        email,
        nom,
        prenom,
        motDePasse: hashedPassword,
        role: role || "VENDEUR", // Utilise le rôle choisi ou VENDEUR par défaut
      },
    });

    return NextResponse.json(
      { message: "Utilisateur créé avec succès", userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur Register:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription." },
      { status: 500 }
    );
  }
}