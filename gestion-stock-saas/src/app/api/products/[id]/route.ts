// src/app/api/produit/[id]/route.ts
import { NextResponse } from "next/server";
import { ProduitService } from "@/services/ProduitService";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const data = await req.json();

    const updated = await ProduitService.updateProduct(id, data);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    await ProduitService.deleteProduct(id);
    return NextResponse.json({ message: "Produit supprimé avec succès" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}