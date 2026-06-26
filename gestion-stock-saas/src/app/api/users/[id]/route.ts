// src/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { UserService } from "@/services/UserService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé. Rôle ADMIN requis." }, { status: 403 });
    }

    const { id } = await params;
    const currentAdminId = parseInt((session.user as any).id);

    await UserService.deactivateUser(parseInt(id), currentAdminId);
    return NextResponse.json({ message: "Utilisateur désactivé avec succès." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const currentUserId = parseInt((session.user as any).id);
    const currentUserRole = (session.user as any).role;
    const body = await req.json();

    const updatedUser = await UserService.updateUser(
      parseInt(id),
      currentUserRole,
      currentUserId,
      body
    );

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}