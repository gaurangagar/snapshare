import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const addMemberSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().optional(),
});

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    const assignments = await prisma.eventAssignment.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // If Admin, also provide list of all available team members not yet assigned
    let availableMembers: { id: string; name: string; email: string }[] = [];
    if (user.role === Role.ADMIN) {
      const assignedUserIds = assignments.map((a) => a.userId);
      availableMembers = await prisma.user.findMany({
        where: {
          role: Role.TEAM_MEMBER,
          id: { notIn: assignedUserIds },
        },
        select: { id: true, name: true, email: true },
      });
    }

    return NextResponse.json({ assignments, availableMembers }, { status: 200 });
  } catch (error) {
    console.error("Fetch event members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN can assign members
    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can assign team members" },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    const body = await req.json();
    const parsed = addMemberSchema.safeParse(body);

    if (!parsed.success || (!parsed.data.email && !parsed.data.userId)) {
      return NextResponse.json(
        { error: "Please provide a valid user email or ID" },
        { status: 400 }
      );
    }

    let targetUser;
    if (parsed.data.userId) {
      targetUser = await prisma.user.findUnique({
        where: { id: parsed.data.userId },
      });
    } else if (parsed.data.email) {
      targetUser = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
      });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already assigned
    const existing = await prisma.eventAssignment.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: targetUser.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already assigned to this event" },
        { status: 409 }
      );
    }

    const assignment = await prisma.eventAssignment.create({
      data: {
        eventId,
        userId: targetUser.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json(
      { message: "Member assigned successfully", assignment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Assign member error:", error);
    return NextResponse.json({ error: "Failed to assign member" }, { status: 500 });
  }
}
