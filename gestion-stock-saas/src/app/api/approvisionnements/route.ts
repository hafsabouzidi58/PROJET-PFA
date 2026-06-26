// src/app/api/approvisionnements/route.ts
import { NextResponse } from "next/server";
import { ApprovisionnementService } from "@/services/ApprovisionnementService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const history = await ApprovisionnementService.getAllApprovisionnements();
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur de récupération" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé. Session manquante." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur introuvable dans la session." }, { status: 400 });
    }

    const data = await req.json();
    const { fournisseurId, articles } = data;

    const result = await ApprovisionnementService.createApprovisionnement(
      parseInt(userId),
      parseInt(fournisseurId),
      articles
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}