// src/app/api/sales/route.ts
import { NextResponse } from "next/server";
import { VenteService } from "@/services/VenteService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const currentUserId = parseInt((session.user as any).id);
    
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    const sales = await VenteService.getAllSales(userRole, currentUserId, dateParam);
    return NextResponse.json(sales);
  } catch (err: any) {
    return NextResponse.json({ error: "Erreur de récupération", details: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Session introuvable. Veuillez vous reconnecter." }, { status: 401 });
    }

    const vendeurId = (session.user as any).id;
    const body = await req.json();
    const { items, total } = body;

    if (!items || !total) {
      return NextResponse.json({ error: "Données de vente incomplètes" }, { status: 400 });
    }

    const result = await VenteService.createSale(
      parseInt(vendeurId),
      items,
      parseFloat(total)
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur lors de la vente", details: error.message }, { status: 400 });
  }
}