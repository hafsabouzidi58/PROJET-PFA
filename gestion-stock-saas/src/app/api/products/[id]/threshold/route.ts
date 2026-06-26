// src/app/api/produit/[id]/stock-minimum/route.ts
import { NextResponse } from "next/server";
import { ProduitService } from "@/services/ProduitService";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { stockMinimum } = await req.json();

    const updatedProduct = await ProduitService.updateStockMinimum(parseInt(id), parseInt(stockMinimum));
    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}