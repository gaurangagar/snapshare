import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGalleryAccessCookie, verifyGalleryAccessToken } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Check authorization: Cookie first, then Authorization header
    let token = await getGalleryAccessCookie(slug);

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Forbidden: PIN verification is required to view this gallery" },
        { status: 403 }
      );
    }

    const payload = await verifyGalleryAccessToken(token);
    if (!payload || payload.slug !== slug || !payload.accessGranted) {
      return NextResponse.json(
        { error: "Forbidden: Invalid or expired gallery access PIN session" },
        { status: 403 }
      );
    }

    const gallery = await prisma.gallery.findUnique({
      where: { slug },
      include: {
        event: {
          select: { name: true, eventDate: true, location: true },
        },
        galleryPhotos: {
          orderBy: { order: "asc" },
          include: {
            photo: {
              select: {
                id: true,
                filename: true,
                storageUrl: true,
                fileSize: true,
                mimeType: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!gallery || !gallery.isPublished) {
      return NextResponse.json(
        { error: "Gallery not found or is no longer published" },
        { status: 404 }
      );
    }

    // Return ONLY photos published in this gallery
    const photos = gallery.galleryPhotos.map((gp) => gp.photo);

    return NextResponse.json(
      {
        gallery: {
          title: gallery.title,
          eventName: gallery.event.name,
          eventDate: gallery.event.eventDate,
          location: gallery.event.location,
          publishedAt: gallery.publishedAt,
        },
        photos,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch published photos error:", error);
    return NextResponse.json({ error: "Failed to fetch gallery photos" }, { status: 500 });
  }
}
