// src/services/ApprovisionnementService.ts
import { prisma } from "@/lib/prisma";

export const ApprovisionnementService = {
  // 🏢 LOGIQUE MÉTIER : Récupérer tout l'historique
  async getAllApprovisionnements() {
    return await prisma.approvisionnement.findMany({
      include: { fournisseur: true, magasinier: true },
      orderBy: { date_reception: "desc" },
    });
  },

  // 🏢 LOGIQUE MÉTIER : Création initiale (Stock inchangé)
  async createApprovisionnement(magasinierId: number, fournisseurId: number, articles: any[]) {
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      throw new Error("La liste des articles ne peut pas être vide.");
    }

    return await prisma.approvisionnement.create({
      data: {
        fournisseur: { connect: { id: fournisseurId } },
        magasinier: { connect: { id: magasinierId } },
        date_reception: new Date(),
        etat: "EN_ATTENTE",
        articles: articles,
      }
    });
  },

  // 🏢 LOGIQUE MÉTIER : Modification du bon (Uniquement si EN_ATTENTE)
  async updateApprovisionnement(id: number, fournisseurId: number, articles: any[]) {
    const current = await prisma.approvisionnement.findUnique({ where: { id } });
    if (!current) throw new Error("Bon d'approvisionnement introuvable.");
    
    // Règle métier : Blocage si le bon est déjà validé
    if (current.etat === "TRAITE") {
      throw new Error("Interdiction de modifier un bon d'approvisionnement déjà traité.");
    }

    return await prisma.approvisionnement.update({
      where: { id },
      data: {
        fournisseurId: fournisseurId,
        articles: articles,
      }
    });
  },

  // 🏢 LOGIQUE MÉTIER : Validation physique (Application et incrémentation des stocks)
  async validateReception(id: number) {
    return await prisma.$transaction(async (tx) => {
      const app = await tx.approvisionnement.findUnique({ where: { id } });

      if (!app) throw new Error("Bon d'approvisionnement introuvable.");
      if (app.etat === "TRAITE") throw new Error("Ce bon a déjà été validé et appliqué aux stocks.");

      const articles = app.articles as any[];
      if (!articles || !Array.isArray(articles)) {
        throw new Error("Le format des articles stocké dans le bon est invalide.");
      }

      // Incrémentation des stocks pour chaque produit
      for (const article of articles) {
        const produitId = parseInt(article.produitId);
        const qte = parseInt(article.quantite);

        await tx.produit.update({
          where: { id: produitId },
          data: {
            quantiteStock: { increment: qte },
          },
        });
      }

      // Passage de l'état à TRAITE
      return await tx.approvisionnement.update({
        where: { id },
        data: { etat: "TRAITE" },
      });
    });
  },

  // 🏢 LOGIQUE MÉTIER : Suppression (Avec rollback de sécurité si déjà traité)
  async deleteApprovisionnement(id: number) {
    return await prisma.$transaction(async (tx) => {
      const app = await tx.approvisionnement.findUnique({ where: { id } });
      if (!app) throw new Error("Bon d'approvisionnement inexistant.");

      // Si le bon a déjà été traité, sa suppression implique l'annulation de l'entrée de stock
      if (app.etat === "TRAITE") {
        const articles = app.articles as any[];
        
        // Vérification de sécurité : Est-ce que le rollback va créer un stock négatif ?
        for (const item of articles) {
          const produitId = parseInt(item.produitId);
          const qte = parseInt(item.quantite);

          const produit = await tx.produit.findUnique({ where: { id: produitId } });
          if (produit && (produit.quantiteStock - qte) < 0) {
            throw new Error(`Suppression refusée. Le retrait de ce bon ferait passer le stock de "${produit.nom}" en négatif (${produit.quantiteStock} - ${qte}).`);
          }
        }

        // Exécution du rollback sur les produits
        for (const item of articles) {
          await tx.produit.update({
            where: { id: parseInt(item.produitId) },
            data: { quantiteStock: { decrement: parseInt(item.quantite) } }
          });
        }
      }

      // Suppression physique de la fiche d'approvisionnement
      return await tx.approvisionnement.delete({ where: { id } });
    });
  }
};