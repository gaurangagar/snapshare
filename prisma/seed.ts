import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Create Demo Admin
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@snapshare.com" },
    update: { passwordHash: adminPasswordHash, role: Role.ADMIN },
    create: {
      name: "Gaurang Lead Admin",
      email: "admin@snapshare.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // 2. Create Demo Team Members
  const memberPasswordHash = await bcrypt.hash("Photo@123456", 10);
  const photographer1 = await prisma.user.upsert({
    where: { email: "photographer1@snapshare.com" },
    update: { passwordHash: memberPasswordHash, role: Role.TEAM_MEMBER },
    create: {
      name: "Arjun Photographer",
      email: "photographer1@snapshare.com",
      passwordHash: memberPasswordHash,
      role: Role.TEAM_MEMBER,
    },
  });

  const photographer2 = await prisma.user.upsert({
    where: { email: "photographer2@snapshare.com" },
    update: { passwordHash: memberPasswordHash, role: Role.TEAM_MEMBER },
    create: {
      name: "Simran Videographer",
      email: "photographer2@snapshare.com",
      passwordHash: memberPasswordHash,
      role: Role.TEAM_MEMBER,
    },
  });
  console.log(`✅ Team members created: ${photographer1.email}, ${photographer2.email}`);

  // 3. Create Demo Event: Arjun & Priya Wedding (as shown in challenge document)
  const weddingEvent = await prisma.event.upsert({
    where: { id: "cl_wedding_event_001" },
    update: {},
    create: {
      id: "cl_wedding_event_001",
      name: "Arjun & Priya Wedding",
      description: "Grand palace wedding celebration capturing every royal moment and ritual.",
      eventDate: new Date("2026-10-15T18:30:00Z"),
      location: "The Leela Palace, Udaipur",
      coverPhotoUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
      createdById: admin.id,
    },
  });

  // Assign photographer1 to weddingEvent
  await prisma.eventAssignment.upsert({
    where: {
      eventId_userId: {
        eventId: weddingEvent.id,
        userId: photographer1.id,
      },
    },
    update: {},
    create: {
      eventId: weddingEvent.id,
      userId: photographer1.id,
    },
  });
  console.log(`✅ Event & assignment seeded: ${weddingEvent.name}`);

  // 4. Seed sample high-resolution photos
  const samplePhotos = [
    {
      filename: "wedding_ceremony_mandap.jpg",
      storageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      fileSize: 3420000,
      mimeType: "image/jpeg",
      isSelected: true,
    },
    {
      filename: "couple_portrait_sunset.jpg",
      storageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
      fileSize: 4200000,
      mimeType: "image/jpeg",
      isSelected: true,
    },
    {
      filename: "rings_exchange_macro.jpg",
      storageUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80",
      fileSize: 2100000,
      mimeType: "image/jpeg",
      isSelected: true,
    },
    {
      filename: "baraat_celebration_dance.jpg",
      storageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      fileSize: 3900000,
      mimeType: "image/jpeg",
      isSelected: true,
    },
    {
      filename: "royal_decor_reception.jpg",
      storageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
      fileSize: 2800000,
      mimeType: "image/jpeg",
      isSelected: true,
    },
    {
      filename: "unselected_test_shot.jpg",
      storageUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80",
      fileSize: 1500000,
      mimeType: "image/jpeg",
      isSelected: false, // Intentionally unselected to verify access restriction!
    },
  ];

  const createdPhotos = [];
  for (const p of samplePhotos) {
    const photo = await prisma.photo.create({
      data: {
        eventId: weddingEvent.id,
        uploadedById: photographer1.id,
        filename: p.filename,
        storageUrl: p.storageUrl,
        fileSize: p.fileSize,
        mimeType: p.mimeType,
        isSelected: p.isSelected,
      },
    });
    createdPhotos.push(photo);
  }
  console.log(`✅ Seeded ${createdPhotos.length} photos (${createdPhotos.filter(p => p.isSelected).length} selected)`);

  // 5. Create Published Gallery with PIN 482917 (matching PDF exact specs)
  const pinHash = await bcrypt.hash("482917", 10);
  const gallery = await prisma.gallery.upsert({
    where: { slug: "abc123" },
    update: {
      pinHash,
      isPublished: true,
      publishedAt: new Date(),
    },
    create: {
      eventId: weddingEvent.id,
      title: "Arjun & Priya Wedding Highlights",
      slug: "abc123", // exactly from page 3 of spec: "Gallery URL: https://your-domain.com/gallery/abc123"
      pinHash,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  // Link selected photos to gallery
  const selectedPhotos = createdPhotos.filter((p) => p.isSelected);
  await prisma.galleryPhoto.deleteMany({ where: { galleryId: gallery.id } });
  await prisma.galleryPhoto.createMany({
    data: selectedPhotos.map((p, idx) => ({
      galleryId: gallery.id,
      photoId: p.id,
      order: idx,
    })),
  });

  console.log(`✅ Published Gallery seeded!`);
  console.log(`   URL: /gallery/${gallery.slug}`);
  console.log(`   Access PIN: 482917`);
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
