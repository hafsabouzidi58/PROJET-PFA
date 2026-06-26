// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import { CategorieService } from "@/services/CategorieService";

export async function GET() {
  try {
    const categories = await CategorieService.getAllCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const categorie = await CategorieService.createCategory(body);
    return NextResponse.json(categorie, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}