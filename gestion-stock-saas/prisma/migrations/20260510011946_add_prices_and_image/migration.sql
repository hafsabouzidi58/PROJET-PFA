/*
  Warnings:

  - You are about to drop the column `prix` on the `Produit` table. All the data in the column will be lost.
  - Added the required column `prixAchat` to the `Produit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prixVente` to the `Produit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Produit" DROP COLUMN "prix",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "prixAchat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "prixVente" DOUBLE PRECISION NOT NULL;
