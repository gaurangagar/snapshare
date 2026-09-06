import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: photoId } = await params;

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Role check: Admins can delete any photo; Team Members can ONLY delete photos they uploaded
    if (user.role !== Role.ADMIN && photo.uploadedById !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot delete another member's photo" },
        { status: 403 }
      );
    }

    await prisma.photo.delete({ where: { id: photoId } });

    return NextResponse.json({ message: "Photo deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete photo error:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
