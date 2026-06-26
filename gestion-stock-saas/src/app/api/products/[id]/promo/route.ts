// src/app/api/products/[id]/promo/route.ts
import { NextResponse } from "next/server";
import { ProduitService } from "@/services/ProduitService";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const produitId = parseInt(rawId);

    if (isNaN(produitId)) {
      return NextResponse.json({ error: "ID de produit invalide" }, { status: 400 });
    }

    const body = await req.json();
    const { prixPromotionnel, dateFinPromo } = body;

    // On délègue toute la logique et les règles financières au ProduitService
    const result = await ProduitService.applyPromotion(
      produitId, 
      prixPromotionnel, 
      dateFinPromo
    );

    return NextResponse.json({
      message: "Promotion appliquée avec succès",
      produit: result
    }, { status: 200 });

  } catch (error: any) {
    console.error("🚨 Erreur API Promo:", error.message);
    // On renvoie le message d'erreur précis (ex: Vente à perte) au Front-end
    return NextResponse.json(
      { error: error.message || "Erreur interne lors de la promotion" }, 
      { status: 400 }
    );
  }
}