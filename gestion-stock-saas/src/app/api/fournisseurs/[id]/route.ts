// src/app/api/fournisseurs/[id]/route.ts
import { NextResponse } from "next/server";
import { FournisseurService } from "@/services/FournisseurService";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params; 
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const data = await req.json();
    const updatedProvider = await FournisseurService.updateProvider(id, data);

    return NextResponse.json(updatedProvider);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    await FournisseurService.deleteProvider(id);
    return NextResponse.json({ message: "Fournisseur supprimé avec succès" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}