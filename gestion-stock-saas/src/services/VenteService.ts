// src/services/VenteService.ts
import { prisma } from "@/lib/prisma";

export const VenteService = {
  // 🏢 LOGIQUE MÉTIER : Récupérer les ventes avec filtres
  async getAllSales(userRole: string, currentUserId: number, dateParam: string | null) {
    let conditionsDeFiltrage: any = {};

    if (dateParam) {
      const debutJournee = new Date(dateParam);
      debutJournee.setHours(0, 0, 0, 0);

      const finJournee = new Date(dateParam);
      finJournee.setHours(23, 59, 59, 999);

      conditionsDeFiltrage.date = {
        gte: debutJournee,
        lte: finJournee,
      };
    }

    // Restriction : Un rôle non-admin/manager ne voit que ses propres ventes
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      conditionsDeFiltrage.vendeurId = currentUserId;
    }

    return await prisma.vente.findMany({
      where: conditionsDeFiltrage,
      include: {
        vendeur: {
          select: { nom: true, prenom: true }
        }
      },
      orderBy: { date: 'desc' }
    });
  },

  // 🏢 LOGIQUE MÉTIER : Créer une vente et décrémenter le stock
  async createSale(vendeurId: number, items: any[], total: number) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validation métier : Vérifier la disponibilité des stocks avant de valider
      for (const item of items) {
        const produit = await tx.produit.findUnique({
          where: { id: parseInt(item.produitId) }
        });
        if (!produit) throw new Error(`Produit ID ${item.produitId} introuvable.`);
        if (produit.quantiteStock < parseInt(item.quantite)) {
          throw new Error(`Stock insuffisant pour le produit "${produit.nom}". Disponible: ${produit.quantiteStock}`);
        }
      }

      // 2. Création de la vente
      const ringUp = await tx.vente.create({
        data: {
          total: total,
          articles: items,
          vendeurId: vendeurId,
        },
      });

      // 3. Décrémentation des stocks
      for (const item of items) {
        await tx.produit.update({
          where: { id: parseInt(item.produitId) },
          data: {
            quantiteStock: { decrement: parseInt(item.quantite) }
          },
        });
      }

      return ringUp;
    });
  },

  // 🏢 LOGIQUE MÉTIER : Modifier une vente (Réajustement des anciens et nouveaux stocks)
  async updateSale(venteId: number, newItems: any[], newTotal: number) {
    return await prisma.$transaction(async (tx) => {
      // 1. Récupérer l'ancienne vente pour connaître les anciennes quantités
      const ancienneVente = await tx.vente.findUnique({ where: { id: venteId } });
      if (!ancienneVente) throw new Error("Vente introuvable.");

      const anciensArticles = (ancienneVente.articles as any[]) || [];

      // 2. Restaurer temporairement l'ancien stock
      for (const ancienItem of anciensArticles) {
        await tx.produit.update({
          where: { id: parseInt(ancienItem.produitId) },
          data: { quantiteStock: { increment: parseInt(ancienItem.quantite) } }
        });
      }

      // 3. Vérifier si le nouveau stock permet la modification
      for (const newItem of newItems) {
        const produit = await tx.produit.findUnique({ where: { id: parseInt(newItem.produitId) } });
        if (!produit) throw new Error(`Produit ID ${newItem.produitId} introuvable.`);
        if (produit.quantiteStock < parseInt(newItem.quantite)) {
          throw new Error(`Ajustement impossible. Stock insuffisant pour "${produit.nom}". Disponible: ${produit.quantiteStock}`);
        }
      }

      // 4. Appliquer la nouvelle décrémentation
      for (const newItem of newItems) {
        await tx.produit.update({
          where: { id: parseInt(newItem.produitId) },
          data: { quantiteStock: { decrement: parseInt(newItem.quantite) } }
        });
      }

      // 5. Mettre à jour l'enregistrement de la vente
      return await tx.vente.update({
        where: { id: venteId },
        data: {
          total: newTotal,
          articles: newItems,
        },
      });
    });
  },

  // 🏢 LOGIQUE MÉTIER : Annuler/Supprimer une vente (Restitution obligatoire des stocks)
  async deleteSale(venteId: number) {
    return await prisma.$transaction(async (tx) => {
      const vente = await tx.vente.findUnique({ where: { id: venteId } });
      if (!vente) throw new Error("Vente introuvable.");

      const articles = (vente.articles as any[]) || [];

      // Règle métier : On recrédite le stock des produits vendus avant de supprimer l'historique
      for (const item of articles) {
        await tx.produit.update({
          where: { id: parseInt(item.produitId) },
          data: { quantiteStock: { increment: parseInt(item.quantite) } }
        });
      }

      return await tx.vente.delete({ where: { id: venteId } });
    });
  }
};