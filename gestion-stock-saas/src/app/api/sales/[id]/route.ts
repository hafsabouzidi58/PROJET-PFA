// src/app/api/sales/[id]/route.ts
import { NextResponse } from "next/server";
import { VenteService } from "@/services/VenteService";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await req.json();
    const { items, total } = body;

    const updatedVente = await VenteService.updateSale(id, items, parseFloat(total));
    return NextResponse.json(updatedVente);
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur modification", details: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    await VenteService.deleteSale(id);
    return NextResponse.json({ message: "Vente supprimée et stocks restaurés avec succès." });
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur suppression", details: error.message }, { status: 400 });
  }
}