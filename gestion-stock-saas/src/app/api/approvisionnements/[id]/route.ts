// src/app/api/approvisionnements/[id]/route.ts
import { NextResponse } from "next/server";
import { ApprovisionnementService } from "@/services/ApprovisionnementService";

// PATCH : Validation physique et application au stock
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params; 
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const result = await ApprovisionnementService.validateReception(id);
    return NextResponse.json({ message: "Réception validée et stocks incrémentés", result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT : Modifier le bon (Uniquement si en attente)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const { fournisseurId, articles } = await req.json();
    const updated = await ApprovisionnementService.updateApprovisionnement(id, parseInt(fournisseurId), articles);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE : Supprimer (Avec rollback automatique sécurisé si traité)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    await ApprovisionnementService.deleteApprovisionnement(id);
    return NextResponse.json({ message: "Bon d'approvisionnement supprimé avec succès." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}