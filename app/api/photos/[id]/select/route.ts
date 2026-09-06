import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const toggleSelectSchema = z.object({
  isSelected: z.boolean(),
});

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN can select photos for publishing
    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can select photos for gallery publishing" },
        { status: 403 }
      );
    }

    const { id: photoId } = await params;
    const body = await req.json();
    const parsed = toggleSelectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid selection state" }, { status: 400 });
    }

    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: { isSelected: parsed.data.isSelected },
    });

    return NextResponse.json({ message: "Photo selection updated", photo }, { status: 200 });
  } catch (error) {
    console.error("Update photo selection error:", error);
    return NextResponse.json({ error: "Failed to update photo selection" }, { status: 500 });
  }
}
