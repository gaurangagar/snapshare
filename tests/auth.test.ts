import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  createGalleryAccessToken,
  verifyGalleryAccessToken,
} from "@/lib/auth";
import { Role } from "@prisma/client";

describe("Authentication & Cryptography Layer", () => {
  it("should securely hash and verify passwords", async () => {
    const rawPassword = "SuperSecurePassword123!";
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword("WrongPassword123!", hash);
    expect(isWrong).toBe(false);
  });

  it("should create and verify valid JWT session tokens", async () => {
    const user = {
      id: "usr_test123",
      name: "Test Admin",
      email: "admin@test.com",
      role: Role.ADMIN,
    };

    const token = await createSessionToken(user);
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(user.id);
    expect(decoded?.email).toBe(user.email);
    expect(decoded?.role).toBe(Role.ADMIN);
  });

  it("should reject tampered or invalid session tokens", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token";
    const result = await verifySessionToken(invalidToken);
    expect(result).toBeNull();
  });

  it("should create and verify customer gallery access tokens", async () => {
    const galleryId = "gal_test456";
    const slug = "wedding-2026";

    const token = await createGalleryAccessToken(galleryId, slug);
    expect(typeof token).toBe("string");

    const decoded = await verifyGalleryAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.galleryId).toBe(galleryId);
    expect(decoded?.slug).toBe(slug);
    expect(decoded?.accessGranted).toBe(true);
  });
});
