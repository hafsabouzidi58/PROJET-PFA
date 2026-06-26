// src/services/CategorieService.ts
import { prisma } from "@/lib/prisma";

export const CategorieService = {
  // 🏢 LOGIQUE MÉTIER : Récupérer toutes les catégories
  async getAllCategories() {
    return await prisma.categorie.findMany({
      include: {
        _count: {
          select: { produits: true } // Utilise 'product' ou 'produit' selon ton schema.prisma
        }
      },
      orderBy: { nom: "asc" }
    });
  },

  // 🏢 LOGIQUE MÉTIER : Créer une catégorie sans doublons
  async createCategory(data: { nom: string; description?: string }) {
    if (!data.nom || data.nom.trim() === "") {
      throw new Error("Le nom de la catégorie est obligatoire.");
    }

    // Règle métier : Insensible à la casse (ex: "Boissons" === "boissons")
    const existeDeja = await prisma.categorie.findFirst({
      where: {
        nom: { equals: data.nom.trim(), mode: "insensitive" }
      }
    });

    if (existeDeja) {
      throw new Error(`La catégorie "${data.nom}" existe déjà.`);
    }

    return await prisma.categorie.create({
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim(),
        est_active: true
      },
    });
  },

  // 🏢 LOGIQUE MÉTIER : Modifier une catégorie
  async updateCategory(id: number, data: { nom: string; description?: string; est_active?: boolean }) {
    if (!data.nom || data.nom.trim() === "") {
      throw new Error("Le nom de la catégorie ne peut pas être vide.");
    }

    // Règle métier : Vérifier que le nouveau nom n'écrase pas une AUTRE catégorie
    const doublon = await prisma.categorie.findFirst({
      where: {
        nom: { equals: data.nom.trim(), mode: "insensitive" },
        NOT: { id: id }
      }
    });

    if (doublon) {
      throw new Error(`Une autre catégorie porte déjà le nom "${data.nom}".`);
    }

    return await prisma.categorie.update({
      where: { id },
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim(),
        est_active: data.est_active
      },
    });
  },

  // 🏢 LOGIQUE MÉTIER : Supprimer de manière sécurisée
  async deleteCategory(id: number) {
    // Règle métier critique : Est-ce qu'il y a des produits dans cette catégorie ?
    const categorieAvecProduits = await prisma.categorie.findUnique({
      where: { id },
      include: {
        _count: {
          select: { produits: true } // Ajuste le nom du champ de relation si nécessaire
        }
      }
    });

    if (!categorieAvecProduits) {
      throw new Error("Catégorie introuvable.");
    }

    if (categorieAvecProduits._count.produits > 0) {
      throw new Error(`Impossible de supprimer cette catégorie car elle contient encore ${categorieAvecProduits._count.produits} produit(s). Veuillez d'abord réassigner ou supprimer ces produits.`);
    }

    return await prisma.categorie.delete({ where: { id } });
  }
};