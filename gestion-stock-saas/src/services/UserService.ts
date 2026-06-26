// src/services/UserService.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const UserService = {
  // 🏢 LOGIQUE MÉTIER : Récupérer la liste des collaborateurs
  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        actif: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // 🏢 LOGIQUE MÉTIER : Création sécurisée d'un collaborateur
  async createUser(data: { nom: string; prenom: string; email: string; motDePasse: string; role?: string }) {
    // 1. Vérification d'existence
    const userExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) {
      throw new Error("Cet email est déjà utilisé par un autre collaborateur.");
    }

    // 2. Hachage sécurisé du mot de passe
    const hashedPassword = await bcrypt.hash(data.motDePasse, 10);

    // 3. Persistance en BDD
    return await prisma.user.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        motDePasse: hashedPassword,
        role: (data.role as any) || "VENDEUR",
      },
    });
  },

  // 🏢 LOGIQUE MÉTIER : Modification d'un compte
  async updateUser(userIdToUpdate: number, initiatorRole: string, currentUserId: number, inputData: any) {
    // Règle métier : Si ce n'est pas un ADMIN et qu'il n'édite pas son propre profil -> Bloquer
    if (initiatorRole !== "ADMIN" && userIdToUpdate !== currentUserId) {
      throw new Error("Accès refusé. Privilèges insuffisants pour modifier ce profil.");
    }

    const updateData: any = {
      nom: inputData.nom,
      prenom: inputData.prenom,
      email: inputData.email,
    };

    // Règle métier : Seul l'ADMIN peut modifier le rôle et le statut actif
    if (initiatorRole === "ADMIN") {
      if (inputData.role) updateData.role = inputData.role;
      if (inputData.actif !== undefined) updateData.actif = inputData.actif;
    }

    // Règle métier : Gestion du changement de mot de passe facultatif
    if (inputData.motDePasse && inputData.motDePasse.trim() !== "") {
      updateData.motDePasse = await bcrypt.hash(inputData.motDePasse, 10);
    }

    return await prisma.user.update({
      where: { id: userIdToUpdate },
      data: updateData,
    });
  },

  // 🏢 LOGIQUE MÉTIER : Désactivation (Soft Delete) sécurisée
  async deactivateUser(userIdToDelete: number, currentAdminId: number) {
    // Règle anti-suicide : Un admin ne peut pas se désactiver lui-même
    if (userIdToDelete === currentAdminId) {
      throw new Error("Action interdite : Vous ne pouvez pas désactiver votre propre compte.");
    }

    return await prisma.user.update({
      where: { id: userIdToDelete },
      data: { actif: false },
    });
  }
};