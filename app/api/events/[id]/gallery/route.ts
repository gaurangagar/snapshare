import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const publishGallerySchema = z.object({
  title: z.string().min(2, "Gallery title is required"),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be between 4 and 8 digits (recommended 6 digits)"),
  slug: z.string().min(3).regex(/^[a-zA-Z0-9-_]+$/, "Slug can only contain letters, numbers, hyphens, and underscores").optional(),
});

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    const gallery = await prisma.gallery.findFirst({
      where: { eventId },
      include: {
        _count: {
          select: { galleryPhotos: true },
        },
      },
    });

    return NextResponse.json({ gallery }, { status: 200 });
  } catch (error) {
    console.error("Fetch gallery error:", error);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN can publish galleries
    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden: Team members are not authorized to publish galleries" },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    const body = await req.json();
    const parsed = publishGallerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid gallery configuration" },
        { status: 400 }
      );
    }

    const { title, pin } = parsed.data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        photos: {
          where: { isSelected: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.photos.length === 0) {
      return NextResponse.json(
        { error: "Cannot publish gallery: Please select at least one photo first" },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug =
      parsed.data.slug ||
      event.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 30) +
        "-" +
        crypto.randomBytes(3).toString("hex");

    const pinHash = await hashPassword(pin);

    // Upsert gallery for this event
    const existingGallery = await prisma.gallery.findFirst({
      where: { eventId },
    });

    let gallery;
    if (existingGallery) {
      // Clear old associations and update
      await prisma.galleryPhoto.deleteMany({
        where: { galleryId: existingGallery.id },
      });

      gallery = await prisma.gallery.update({
        where: { id: existingGallery.id },
        data: {
          title,
          slug,
          pinHash,
          isPublished: true,
          publishedAt: new Date(),
        },
      });
    } else {
      gallery = await prisma.gallery.create({
        data: {
          eventId,
          title,
          slug,
          pinHash,
          isPublished: true,
          publishedAt: new Date(),
        },
      });
    }

    // Associate selected photos to gallery
    await prisma.galleryPhoto.createMany({
      data: event.photos.map((photo, index) => ({
        galleryId: gallery.id,
        photoId: photo.id,
        order: index,
      })),
    });

    return NextResponse.json(
      {
        message: "Gallery published successfully",
        gallery: {
          id: gallery.id,
          slug: gallery.slug,
          title: gallery.title,
          isPublished: gallery.isPublished,
          publishedAt: gallery.publishedAt,
          photoCount: event.photos.length,
          accessPin: pin, // Returned on publish so admin can immediately copy it
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Publish gallery error:", error);
    return NextResponse.json({ error: "Failed to publish gallery" }, { status: 500 });
  }
}
