// src/app/api/arrivages/route.ts
import { NextResponse } from "next/server";
import { ArrivageService } from "@/services/ArrivageService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);
    const userRole = (session.user as any).role;

    const arrivages = await ArrivageService.getAllArrivages(userRole, userId);
    return NextResponse.json(arrivages);
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur de récupération", details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé. Connectez-vous." }, { status: 401 });
    }

    const agentId = (session.user as any).id;
    const body = await req.json();
    
    const pId = parseInt(body.produitId);
    const fId = parseInt(body.fournisseurId);
    const qte = parseInt(body.quantiteRecue);

    if (isNaN(pId) || isNaN(fId) || isNaN(qte)) {
      return NextResponse.json({ error: "Données du formulaire invalides" }, { status: 400 });
    }

    const result = await ArrivageService.createArrivage({
      produitId: pId,
      fournisseurId: fId,
      quantiteRecue: qte,
      agentId: parseInt(agentId)
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}