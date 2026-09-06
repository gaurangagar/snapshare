import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGalleryAccessCookie, verifyGalleryAccessToken } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const gallery = await prisma.gallery.findUnique({
      where: { slug },
      include: {
        event: {
          select: {
            name: true,
            description: true,
            eventDate: true,
            location: true,
            coverPhotoUrl: true,
          },
        },
        _count: {
          select: { galleryPhotos: true },
        },
      },
    });

    if (!gallery || !gallery.isPublished) {
      return NextResponse.json({ error: "Gallery not found or not published" }, { status: 404 });
    }

    // Check if customer already has a verified PIN session
    let isUnlocked = false;
    const cookieToken = await getGalleryAccessCookie(slug);
    if (cookieToken) {
      const payload = await verifyGalleryAccessToken(cookieToken);
      if (payload && payload.slug === slug) {
        isUnlocked = true;
      }
    }

    return NextResponse.json(
      {
        gallery: {
          id: gallery.id,
          slug: gallery.slug,
          title: gallery.title,
          eventName: gallery.event.name,
          eventDate: gallery.event.eventDate,
          location: gallery.event.location,
          photoCount: gallery._count.galleryPhotos,
          coverPhotoUrl: gallery.event.coverPhotoUrl,
          isUnlocked,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch gallery info error:", error);
    return NextResponse.json({ error: "Failed to fetch gallery details" }, { status: 500 });
  }
}
