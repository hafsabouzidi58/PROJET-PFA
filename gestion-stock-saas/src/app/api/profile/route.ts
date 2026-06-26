import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Ajuste le chemin selon ton projet
import { prisma } from "@/lib/prisma"; 
import bcrypt from "bcryptjs"; // Pour le hachage sécurisé du mot de passe

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);
    const { nom, prenom, email, password } = await req.json();

    // 1. Validation de base
    if (!nom || !prenom || !email) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // 2. Vérifier si l'email est déjà pris par un autre utilisateur
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé par un autre compte." }, { status: 400 });
    }

    // 3. Préparer les données à mettre à jour
    const updateData: any = {
      nom: nom,
      prenom: prenom,
      email: email,
    };

    // Si un nouveau mot de passe est renseigné, on le hash de manière sécurisée
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json({ error: "Le mot de passe doit faire au moins 6 caractères." }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // 4. Mise à jour dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Profil mis à jour avec succès !",
      user: { nom: updatedUser.nom, prenom: updatedUser.prenom, email: updatedUser.email }
    });

  } catch (error) {
    console.error("Erreur profil:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}