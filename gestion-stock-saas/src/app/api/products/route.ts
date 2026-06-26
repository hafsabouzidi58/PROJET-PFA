import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



export async function GET() {
  try {
    const products = await prisma.produit.findMany({
      include: { 
        categorie: true,
        fournisseur: true // Ajouté pour voir qui fournit le produit
      },
      orderBy: { nom: "asc" }, // Tri par nom car created_at n'existe pas
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Erreur de récupération" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Validation/Parsing des données
    const catId = parseInt(data.categorieId);
    const fournId = parseInt(data.fournisseurId);

    // Sécurité : Si l'un des IDs n'est pas un nombre, on renvoie une erreur claire
    if (isNaN(catId) || isNaN(fournId)) {
      return NextResponse.json(
        { error: "Catégorie ou Fournisseur invalide (ID manquant)" },
        { status: 400 }
      );
    }

    const product = await prisma.produit.create({
      data: {
        nom: data.nom,
        description: data.description,
        // Correction : Utilisation des bons noms envoyés par le frontend
        prixAchat: parseFloat(data.prixAchat) || 0,
        prixVente: parseFloat(data.prixVente) || 0,
        image: data.image || null,
        quantiteStock: parseInt(data.stock) || 0,
        // Utilisation des IDs parsés
        categorieId: catId,
        fournisseurId: fournId,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Erreur détaillée Prisma:", error);
    return NextResponse.json(
      { error: "Erreur de création", details: error.message },
      { status: 500 }
    );
  }
}