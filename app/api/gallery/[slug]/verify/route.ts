import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyPassword, createGalleryAccessToken, setGalleryAccessCookie } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const pinSchema = z.object({
  pin: z.string().min(1, "PIN is required"),
});

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = pinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    const { pin } = parsed.data;

    const gallery = await prisma.gallery.findUnique({
      where: { slug },
    });

    if (!gallery || !gallery.isPublished) {
      return NextResponse.json(
        { error: "Gallery not found or is currently unpublished" },
        { status: 404 }
      );
    }

    const isMatch = await verifyPassword(pin, gallery.pinHash);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect PIN. Access denied." },
        { status: 401 }
      );
    }

    // Create signed access token and cookie
    const token = await createGalleryAccessToken(gallery.id, gallery.slug);
    await setGalleryAccessCookie(slug, token);

    return NextResponse.json(
      {
        message: "PIN verified successfully",
        accessGranted: true,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json({ error: "Failed to verify PIN" }, { status: 500 });
  }
}
