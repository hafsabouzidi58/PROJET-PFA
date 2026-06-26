import { NextResponse } from "next/server";
import { FournisseurService } from "@/services/FournisseurService";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const fournisseurs = await prisma.fournisseur.findMany({
      select: {
        id: true,
        nom: true,
        contact: true,   // ✅ Ajouté
        telephone: true, // ✅ Ajouté
        adresse: true,   // ✅ Ajouté
      },
      orderBy: {
        nom: "asc"
      }
    });

    // Renvoie le tableau brut attendu par le front-end
    return NextResponse.json(fournisseurs);
  } catch (error: any) {
    console.error("Erreur API Fournisseurs :", error);
    return NextResponse.json(
      { error: "Impossible de récupérer la liste des fournisseurs" }, 
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const provider = await FournisseurService.createProvider(data);
    return NextResponse.json(provider, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}