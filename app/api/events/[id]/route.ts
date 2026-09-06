import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        galleries: {
          select: {
            id: true,
            slug: true,
            title: true,
            isPublished: true,
            publishedAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: { photos: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Security check: Team Member can only view events they are assigned to
    if (user.role === Role.TEAM_MEMBER) {
      const isAssigned = event.assignments.some((a) => a.userId === user.id);
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Forbidden: You are not assigned to this event" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error("Get event error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can delete events" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
