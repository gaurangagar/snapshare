import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

const createEventSchema = z.object({
  name: z.string().min(2, "Event name is required"),
  description: z.string().optional(),
  eventDate: z.string().optional(),
  location: z.string().optional(),
  coverPhotoUrl: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let events;
    if (user.role === Role.ADMIN) {
      // Admin sees all events
      events = await prisma.event.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          assignments: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
          },
          galleries: {
            select: { id: true, slug: true, title: true, isPublished: true, publishedAt: true },
          },
          _count: {
            select: { photos: true, assignments: true },
          },
        },
      });
    } else {
      // Team Member sees ONLY assigned events
      events = await prisma.event.findMany({
        where: {
          assignments: {
            some: {
              userId: user.id,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, name: true } },
          assignments: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
          galleries: {
            select: { id: true, slug: true, title: true, isPublished: true },
          },
          _count: {
            select: { photos: true },
          },
        },
      });
    }

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Fetch events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role-based check: Only ADMIN can create events
    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can create events" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { name, description, eventDate, location, coverPhotoUrl } = parsed.data;

    const event = await prisma.event.create({
      data: {
        name,
        description,
        eventDate: eventDate ? new Date(eventDate) : null,
        location,
        coverPhotoUrl,
        createdById: user.id,
      },
    });

    return NextResponse.json({ message: "Event created successfully", event }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
