import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET() {
  try {
    // On récupère tous les produits
    // Remplace .product par .produit si ta table est en français
    const products = await (prisma as any).produit.findMany();
    
    const alerts = products.filter((p: any) => {
      // Si stockMinimum n'est pas défini, on prend 5 par défaut
      const seuil = p.stockMinimum !== undefined && p.stockMinimum !== null ? p.stockMinimum : 5;
      return p.quantiteStock <= seuil;
    });

    console.log("Nombre d'alertes trouvées:", alerts.length);
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}