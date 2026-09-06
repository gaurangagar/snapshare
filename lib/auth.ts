import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "snapshare-super-secret-jwt-key-2026-production-ready";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface GalleryAccessTokenPayload {
  galleryId: string;
  slug: string;
  accessGranted: boolean;
}

const AUTH_COOKIE_NAME = "snapshare_session";
const GALLERY_COOKIE_PREFIX = "snapshare_gal_";

// --- Password Hashing ---
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// --- Session JWT ---
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

// --- Gallery Customer Access JWT ---
export async function createGalleryAccessToken(galleryId: string, slug: string): Promise<string> {
  return new SignJWT({
    galleryId,
    slug,
    accessGranted: true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
}

export async function verifyGalleryAccessToken(token: string): Promise<GalleryAccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      galleryId: payload.galleryId as string,
      slug: payload.slug as string,
      accessGranted: Boolean(payload.accessGranted),
    };
  } catch {
    return null;
  }
}

// --- Cookie and Server Helpers ---
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function setGalleryAccessCookie(slug: string, token: string) {
  const cookieStore = await cookies();
  cookieStore.set(`${GALLERY_COOKIE_PREFIX}${slug}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function getGalleryAccessCookie(slug: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(`${GALLERY_COOKIE_PREFIX}${slug}`)?.value;
}
