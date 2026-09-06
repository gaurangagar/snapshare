import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/storage";
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

    const { id: eventId } = await params;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        assignments: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Role check: If Team Member, must be assigned to this event
    if (user.role === Role.TEAM_MEMBER) {
      const isAssigned = event.assignments.some((a) => a.userId === user.id);
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Forbidden: You are not assigned to this event" },
          { status: 403 }
        );
      }
    }

    const photos = await prisma.photo.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ photos }, { status: 200 });
  } catch (error) {
    console.error("Fetch photos error:", error);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Verify event exists and user access
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { assignments: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Security check: Team member MUST be assigned to this event to upload photos
    if (user.role === Role.TEAM_MEMBER) {
      const isAssigned = event.assignments.some((a) => a.userId === user.id);
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Forbidden: You can only upload photos to events you are assigned to" },
          { status: 403 }
        );
      }
    }

    const formData = await req.formData();
    const files = formData.getAll("photos") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No photos provided for upload" }, { status: 400 });
    }

    const uploadedPhotos = [];
    const errors = [];

    for (const file of files) {
      try {
        if (!file.type.startsWith("image/")) {
          errors.push({ filename: file.name, error: "Only image files are allowed" });
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await saveUploadedFile(buffer, file.name, file.type);

        const photo = await prisma.photo.create({
          data: {
            eventId,
            uploadedById: user.id,
            filename: uploadResult.filename,
            storageUrl: uploadResult.storageUrl,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType,
          },
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
        });

        uploadedPhotos.push(photo);
      } catch (uploadErr) {
        console.error(`Failed to upload ${file.name}:`, uploadErr);
        errors.push({ filename: file.name, error: "Storage upload failed" });
      }
    }

    return NextResponse.json(
      {
        message: `Successfully uploaded ${uploadedPhotos.length} photo(s)`,
        uploadedCount: uploadedPhotos.length,
        photos: uploadedPhotos,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: uploadedPhotos.length > 0 ? 201 : 400 }
    );
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json({ error: "Failed to process photo upload" }, { status: 500 });
  }
}
