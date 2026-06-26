// src/services/ArrivageService.ts
import { prisma } from "@/lib/prisma";

export const ArrivageService = {
  // 🏢 REQUÊTE : Récupérer les arrivages avec filtrage par rôle
  async getAllArrivages(userRole: string, currentUserId: number) {
    let conditionWhere = {};

    // Les agents simples ne voient que les arrivages qu'ils ont saisis eux-mêmes
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      conditionWhere = { agentId: currentUserId };
    }

    return await prisma.arrivage.findMany({
      where: conditionWhere,
      include: {
        produit: { select: { nom: true, quantiteStock: true } },
        fournisseur: { select: { nom: true } },
        agent: { select: { nom: true, prenom: true } }
      },
      orderBy: { dateArrivee: "desc" }
    });
  },

  // 🏢 CRÉATION : Enregistrer l'arrivage et incrémenter le stock
  async createArrivage(data: { produitId: number; fournisseurId: number; quantiteRecue: number; agentId: number }) {
    if (data.quantiteRecue <= 0) {
      throw new Error("La quantité reçue doit être strictement supérieure à 0.");
    }

    return await prisma.$transaction(async (tx) => {
      const produitExistant = await tx.produit.findUnique({ where: { id: data.produitId } });
      if (!produitExistant) throw new Error(`Le produit avec l'ID ${data.produitId} n'existe pas.`);

      const fournisseurExistant = await tx.fournisseur.findUnique({ where: { id: data.fournisseurId } });
      if (!fournisseurExistant) throw new Error(`Le fournisseur avec l'ID ${data.fournisseurId} n'existe pas.`);

      // A. Création de la ligne d'arrivage
      const nouvelArrivage = await tx.arrivage.create({
        data: {
          produitId: data.produitId,
          fournisseurId: data.fournisseurId,
          quantiteRecue: data.quantiteRecue,
          agentId: data.agentId,
        },
      });

      // B. Augmentation automatique du stock du produit
      await tx.produit.update({
        where: { id: data.produitId },
        data: { quantiteStock: { increment: data.quantiteRecue } }
      });

      return nouvelArrivage;
    });
  },

  // 🏢 MODIFICATION : Réajuster dynamiquement les stocks et gérer le délai de 15 min
  async updateArrivage(arrivageId: number, currentUserId: number, userRole: string, body: any) {
    const quantiteRecue = parseInt(body.quantiteRecue);
    const fournisseurId = parseInt(body.fournisseurId);
    const produitId = parseInt(body.produitId);

    return await prisma.$transaction(async (tx) => {
      const arrivageExistant = await tx.arrivage.findUnique({ where: { id: arrivageId } });
      if (!arrivageExistant) throw new Error("Arrivage introuvable.");

      // 🛡️ Règle des 15 minutes pour les agents simples
      if (userRole !== "ADMIN" && userRole !== "MANAGER") {
        if (arrivageExistant.agentId !== currentUserId) {
          throw new Error("Accès refusé : Vous ne pouvez pas modifier le travail d'un autre agent.");
        }

        const maintenant = new Date();
        const dateCreation = new Date(arrivageExistant.dateArrivee);
        const differenceEnMinutes = (maintenant.getTime() - dateCreation.getTime()) / 1000 / 60;

        if (differenceEnMinutes > 15) {
          throw new Error("Délai de modification dépassé (15 min maximum). Veuillez contacter un administrateur.");
        }
      }

      // 🔄 Réajustement mathématique des stocks
      if (arrivageExistant.produitId === produitId) {
        const differenceQuantite = quantiteRecue - arrivageExistant.quantiteRecue;

        const produit = await tx.produit.findUnique({ where: { id: produitId } });
        if (produit && (produit.quantiteStock + differenceQuantite) < 0) {
          throw new Error(`Ajustement impossible. Le stock actuel de "${produit.nom}" (${produit.quantiteStock}) est trop bas.`);
        }

        await tx.produit.update({
          where: { id: produitId },
          data: { quantiteStock: { increment: differenceQuantite } }
        });
      } else {
        // Changement de produit : on décrémente l'ancien et on incrémente le nouveau
        const ancienProduit = await tx.produit.findUnique({ where: { id: arrivageExistant.produitId } });
        if (ancienProduit && (ancienProduit.quantiteStock - arrivageExistant.quantiteRecue) < 0) {
          throw new Error(`Correction impossible. Le stock du produit d'origine "${ancienProduit.nom}" est insuffisant pour annuler cet arrivage.`);
        }

        await tx.produit.update({
          where: { id: arrivageExistant.produitId },
          data: { quantiteStock: { decrement: arrivageExistant.quantiteRecue } }
        });

        await tx.produit.update({
          where: { id: produitId },
          data: { quantiteStock: { increment: quantiteRecue } }
        });
      }

      return await tx.arrivage.update({
        where: { id: arrivageId },
        data: { quantiteRecue, fournisseurId, produitId }
      });
    });
  }
};