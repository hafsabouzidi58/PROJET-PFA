// src/app/api/arrivages/[id]/route.ts
import { NextResponse } from "next/server";
import { ArrivageService } from "@/services/ArrivageService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Format asynchrone Next.js 15 obligatoire
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentUserId = parseInt((session.user as any).id);
    const userRole = (session.user as any).role;
    
    // Résolution des paramètres de l'URL
    const resolvedParams = await params;
    const arrivageId = parseInt(resolvedParams.id);

    if (isNaN(arrivageId)) {
      return NextResponse.json({ error: "Identifiant d'arrivage invalide" }, { status: 400 });
    }

    const body = await req.json();
    const quantiteRecue = parseInt(body.quantiteRecue);
    const fournisseurId = parseInt(body.fournisseurId);
    const produitId = parseInt(body.produitId);

    if (isNaN(quantiteRecue) || isNaN(fournisseurId) || isNaN(produitId)) {
      return NextResponse.json({ error: "Données manquantes ou invalides" }, { status: 400 });
    }

    const arrivageModifie = await ArrivageService.updateArrivage(
      arrivageId,
      currentUserId,
      userRole,
      { quantiteRecue, fournisseurId, produitId }
    );

    return NextResponse.json({ message: "Arrivage corrigé avec succès", arrivageModifie });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}