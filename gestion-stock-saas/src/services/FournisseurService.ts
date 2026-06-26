// src/services/FournisseurService.ts
import { prisma } from "@/lib/prisma";

export const FournisseurService = {
  // 🏢 LOGIQUE MÉTIER : Récupérer tous les fournisseurs
  async getAllProviders() {
    return await prisma.fournisseur.findMany({
      orderBy: { nom: "asc" }, // Trié par ordre alphabétique, c'est plus propre
    });
  },

  // 🏢 LOGIQUE MÉTIER : Créer un fournisseur avec vérification des doublons
  async createProvider(data: { nom: string; contact?: string; telephone?: string; adresse?: string }) {
    // Règle métier : Le nom est obligatoire
    if (!data.nom || data.nom.trim() === "") {
      throw new Error("Le nom du fournisseur est obligatoire.");
    }

    // Règle métier : Éviter les doublons sur le nom
    const nomExiste = await prisma.fournisseur.findFirst({
      where: { nom: { equals: data.nom.trim(), mode: 'insensitive' } }
    });
    if (nomExiste) {
      throw new Error(`Le fournisseur "${data.nom}" existe déjà dans l'application.`);
    }

    // Règle métier : Éviter les doublons sur le téléphone (si renseigné)
    if (data.telephone && data.telephone.trim() !== "") {
      const telExiste = await prisma.fournisseur.findFirst({
        where: { telephone: data.telephone.trim() }
      });
      if (telExiste) {
        throw new Error(`Le numéro de téléphone ${data.telephone} est déjà attribué à un autre fournisseur.`);
      }
    }

    return await prisma.fournisseur.create({
      data: {
        nom: data.nom.trim(),
        contact: data.contact?.trim(),
        telephone: data.telephone?.trim(),
        adresse: data.adresse?.trim(),
      },
    });
  },

  // 🏢 LOGIQUE MÉTIER : Modifier un fournisseur
  async updateProvider(id: number, data: any) {
    if (!data.nom || data.nom.trim() === "") {
      throw new Error("Le nom du fournisseur ne peut pas être vide.");
    }

    // Vérifier si le nouveau nom n'est pas déjà pris par UN AUTRE fournisseur
    const doublonNom = await prisma.fournisseur.findFirst({
      where: {
        nom: { equals: data.nom.trim(), mode: 'insensitive' },
        NOT: { id: id }
      }
    });
    if (doublonNom) {
      throw new Error(`Un autre fournisseur porte déjà le nom "${data.nom}".`);
    }

    return await prisma.fournisseur.update({
      where: { id },
      data: {
        nom: data.nom.trim(),
        contact: data.contact?.trim(),
        telephone: data.telephone?.trim(),
        adresse: data.adresse?.trim(),
      },
    });
  },

  // 🏢 LOGIQUE MÉTIER : Sécuriser la suppression
  async deleteProvider(id: number) {
    // Règle métier critique : Est-ce que ce fournisseur est lié à des produits existants ?
    const produitLie = await prisma.produit.findFirst({
      where: { fournisseurId: id }
    });

    if (produitLie) {
      throw new Error("Impossible de supprimer ce fournisseur car des produits de votre catalogue lui sont encore associés. Supprimez ou modifiez d'abord ces produits.");
    }

    // Optionnel : Si tu as une table 'Arrivage' ou 'Approvisionnement', il faudrait ajouter cette vérification :
    // const arrivageLie = await prisma.arrivage.findFirst({ where: { fournisseurId: id } });
    // if (arrivageLie) { throw new Error("Impossible de supprimer ce fournisseur car il possède un historique d'arrivages."); }

    return await prisma.fournisseur.delete({
      where: { id },
    });
  }
};