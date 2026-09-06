import { describe, it, expect } from "vitest";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

describe("Gallery PIN Security & Photo Publication Isolation", () => {
  it("should successfully verify correct 6-digit gallery PIN", async () => {
    const gallery = await prisma.gallery.findUnique({
      where: { slug: "abc123" },
    });

    expect(gallery).not.toBeNull();
    expect(gallery?.isPublished).toBe(true);

    const isCorrect = await verifyPassword("482917", gallery!.pinHash);
    expect(isCorrect).toBe(true);
  });

  it("should strictly reject incorrect gallery PINs", async () => {
    const gallery = await prisma.gallery.findUnique({
      where: { slug: "abc123" },
    });

    const isWrong1 = await verifyPassword("000000", gallery!.pinHash);
    expect(isWrong1).toBe(false);

    const isWrong2 = await verifyPassword("123456", gallery!.pinHash);
    expect(isWrong2).toBe(false);
  });

  it("should only expose selected photos in published gallery and exclude unpublished photos", async () => {
    const gallery = await prisma.gallery.findUnique({
      where: { slug: "abc123" },
      include: {
        galleryPhotos: {
          include: { photo: true },
        },
      },
    });

    expect(gallery).not.toBeNull();
    const publishedPhotos = gallery!.galleryPhotos.map((gp) => gp.photo);

    // Verify all published photos have isSelected === true
    for (const photo of publishedPhotos) {
      expect(photo.isSelected).toBe(true);
    }

    // Verify unselected photo is NOT in published gallery
    const unselectedPhoto = await prisma.photo.findFirst({
      where: {
        eventId: gallery!.eventId,
        isSelected: false,
      },
    });

    expect(unselectedPhoto).not.toBeNull();
    const isLeaked = publishedPhotos.some((p) => p.id === unselectedPhoto?.id);
    expect(isLeaked).toBe(false);
  });
});
