// src/app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { CategorieService } from "@/services/CategorieService";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await CategorieService.updateCategory(parseInt(id), body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await CategorieService.deleteCategory(parseInt(id));
    return NextResponse.json({ message: "Catégorie supprimée avec succès" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}