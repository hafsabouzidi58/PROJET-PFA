// src/services/ProduitService.ts
import { prisma } from "@/lib/prisma";

export const ProduitService = {
  // 🏢 LOGIQUE MÉTIER : Modifier un produit (avec gardes-fous financiers)
  async updateProduct(id: number, data: any) {
    const prixAchat = parseFloat(data.prixAchat) || 0;
    const prixVente = parseFloat(data.prixVente) || 0;

    if (prixVente < prixAchat) {
      throw new Error(`Règle financière : Le prix de vente (${prixVente} DH) ne peut pas être inférieur au prix d'achat (${prixAchat} DH).`);
    }

    return await prisma.produit.update({
      where: { id },
      data: {
        nom: data.nom,
        description: data.description,
        prixAchat: prixAchat,
        prixVente: prixVente,
        image: data.image,
        quantiteStock: parseInt(data.stock) || 0,
        categorieId: parseInt(data.categorieId),
        fournisseurId: parseInt(data.fournisseurId),
      },
    });
  },

  // 🏢 LOGIQUE MÉTIER : Appliquer une promotion sécurisée (Mise à jour et synchronisation)
// 🏢 LOGIQUE MÉTIER : Version de secours (Sans modification de schéma nécessaires)
  async applyPromotion(produitId: number, prixPromotionnel: number | string, dateFinPromo?: string) {
    const prixPromo = typeof prixPromotionnel === "string" ? parseFloat(prixPromotionnel) : prixPromotionnel;

    if (isNaN(prixPromo)) {
      throw new Error("Le prix promotionnel calculé est invalide.");
    }

    const produit = await prisma.produit.findUnique({ where: { id: produitId } });
    if (!produit) throw new Error("Produit introuvable.");

    if (prixPromo < produit.prixAchat) {
      throw new Error(`Règle Promotion : Le nouveau prix (${prixPromo.toFixed(2)} DH) vendrait à perte par rapport au prix d'achat (${produit.prixAchat.toFixed(2)} DH).`);
    }

    // On met à jour UNIQUEMENT le prix de vente pour contourner l'erreur Prisma
    return await prisma.produit.update({
      where: { id: produitId },
      data: {
        prixVente: prixPromo,
        // Les lignes problématiques sont retirées ou commentées :
        // enPromotion: true,
        // dateFinPromo: dateFinPromo ? new Date(dateFinPromo) : null,
      },
    });
  },

  // 🏢 LOGIQUE MÉTIER : Ajuster le seuil d'alerte de stock
  async updateStockMinimum(id: number, stockMinimum: number) {
    if (stockMinimum < 0) {
      throw new Error("Le seuil d'alerte minimum ne peut pas être négatif.");
    }

    return await prisma.produit.update({
      where: { id },
      data: { stockMinimum },
    });
  },

  // 🏢 LOGIQUE MÉTIER : Suppression 100% Blindée et Débuggée
  async deleteProduct(id: number) {
    const toutesLesVentes = await prisma.vente.findMany({
      select: { id: true, articles: true }
    });

    const estVendu = toutesLesVentes.some((vente) => {
      const articles = (vente.articles as any[]) || [];
      return articles.some((item) => {
        const itemProduitId = item.produitId ?? item.idProduit ?? item.productId ?? item.id;
        if (itemProduitId !== undefined && itemProduitId !== null) {
          return parseInt(itemProduitId) === id;
        }
        return false;
      });
    });

    if (estVendu) {
      throw new Error("Impossible de supprimer définitivement ce produit car il possède un historique de ventes.");
    }

    const lieAUnArrivage = await prisma.arrivage.findFirst({
      where: { produitId: id }
    });

    if (lieAUnArrivage) {
      throw new Error("Impossible de supprimer ce produit car il est lié à un historique d'arrivages matériels.");
    }

    return await prisma.produit.delete({
      where: { id: id },
    });
  }
};