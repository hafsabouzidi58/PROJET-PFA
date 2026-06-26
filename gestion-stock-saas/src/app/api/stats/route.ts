// src/app/api/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Récupérer toutes les ventes et tous les produits (pour avoir les prix d'achat actuels)
    const ventes = await prisma.vente.findMany();
    const produits = await prisma.produit.findMany({
      select: { id: true, prixAchat: true }
    });

    // Créer un dictionnaire pour retrouver le prix d'achat d'un produit en O(1)
    const prixAchatMap = new Map(produits.map(p => [p.id, p.prixAchat]));

    let caTotal = 0;
    let coutAchatTotal = 0;

    // 2. Parcourir chaque vente et chaque article pour calculer le CA et le Coût d'Achat
    for (const vente of ventes) {
      const articles = (vente.articles as any[]) || [];

      for (const art of articles) {
        const qte = parseInt(art.quantite ?? 0);
        const prixVenteUnitaire = parseFloat(art.prixVente ?? art.prix ?? 0);
        
        // Trouver le prix d'achat : soit stocké dans le JSON de la vente, soit dans la table Produit
        const produitId = parseInt(art.produitId ?? art.idProduit);
        const prixAchatUnitaire = parseFloat(art.prixAchat ?? prixAchatMap.get(produitId) ?? 0);

        // Cumul des totaux
        caTotal += (prixVenteUnitaire * qte);
        coutAchatTotal += (prixAchatUnitaire * qte);
      }
    }

    // 3. Calcul du bénéfice net (La vraie rentabilité)
    const beneficeNet = caTotal - coutAchatTotal;
    const nbVentes = ventes.length;

    // 4. Traitement des alertes de stock
    const tousLesProduits = await prisma.produit.findMany({
      select: { id: true, nom: true, quantiteStock: true, stockMinimum: true }
    });
    const produitsCritiques = tousLesProduits.filter(p => p.quantiteStock <= (p.stockMinimum ?? 0));

    // 5. Envoi de toutes les données financières au Front-end
    return NextResponse.json({
      caTotal: parseFloat(caTotal.toFixed(2)),
      coutAchatTotal: parseFloat(coutAchatTotal.toFixed(2)),
      beneficeNet: parseFloat(beneficeNet.toFixed(2)), // 🟢 Le vrai gain !
      nbVentes,
      alertesStock: produitsCritiques.length,
      produitsCritiques,
    });

  } catch (error: any) {
    console.error("Erreur calcul financier stats:", error.message);
    return NextResponse.json({ error: "Erreur lors du calcul des indicateurs financiers" }, { status: 500 });
  }
}