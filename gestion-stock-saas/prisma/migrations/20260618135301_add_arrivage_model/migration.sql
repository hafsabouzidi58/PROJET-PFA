-- CreateTable
CREATE TABLE "Arrivage" (
    "id" SERIAL NOT NULL,
    "dateArrivee" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "produitId" INTEGER NOT NULL,
    "quantiteRecue" INTEGER NOT NULL,
    "prixAchatUnitaire" DOUBLE PRECISION NOT NULL,
    "fournisseurId" INTEGER NOT NULL,
    "agentId" INTEGER NOT NULL,

    CONSTRAINT "Arrivage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Arrivage" ADD CONSTRAINT "Arrivage_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrivage" ADD CONSTRAINT "Arrivage_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrivage" ADD CONSTRAINT "Arrivage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
