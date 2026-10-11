import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface UploadResult {
  storageUrl: string;
  filename: string;
  fileSize: number;
  mimeType: string;
}

export async function saveUploadedFile(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<UploadResult> {

  console.log("[Storage:debug] saveUploadedFile called with:", {
    originalFilename,
    mimeType,
    bufferLength: fileBuffer?.length,
  });

  const extension = path.extname(originalFilename) || ".jpg";
  const uniqueId = crypto.randomUUID();
  const safeBaseName = path
    .basename(originalFilename, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "_");
  const storedFilename = `${safeBaseName}_${uniqueId}${extension}`;

  console.log("[Storage:debug] Generated filename details:", {
    extension,
    uniqueId,
    safeBaseName,
    storedFilename,
  });

  // Check if S3 / Cloudflare R2 credentials are provided
  const s3Bucket = process.env.S3_BUCKET_NAME;
  const s3AccessKey = process.env.AWS_ACCESS_KEY_ID;
  const s3SecretKey = process.env.AWS_SECRET_ACCESS_KEY;

  console.log("[Storage:debug] Checking cloud storage credentials:", {
    hasBucket: Boolean(s3Bucket),
    bucketName: s3Bucket || null,
    hasAccessKey: Boolean(s3AccessKey),
    hasSecretKey: Boolean(s3SecretKey),
    region: process.env.AWS_REGION || "auto",
    customEndpoint: process.env.AWS_ENDPOINT || null,
  });

  if (s3Bucket && s3AccessKey && s3SecretKey) {
    // Cloud S3 / R2 Upload
    try {
      console.log("[Storage] Attempting Cloud S3/R2 upload...");

      const s3Client = new S3Client({
        region: process.env.AWS_REGION || "auto",
        endpoint: process.env.AWS_ENDPOINT, // Optional custom endpoint for Cloudflare R2 / MinIO
        credentials: {
          accessKeyId: s3AccessKey,
          secretAccessKey: s3SecretKey,
        },
      });

      const key = `events/${storedFilename}`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
        })
      );

      const region = process.env.AWS_REGION;
      const defaultHost =
        region && region !== "auto" && region !== "us-east-1"
          ? `https://${s3Bucket}.s3.${region}.amazonaws.com`
          : `https://${s3Bucket}.s3.amazonaws.com`;
      const publicUrlBase = process.env.S3_PUBLIC_URL || defaultHost;
      const storageUrl = `${publicUrlBase}/${key}`;

      return {
        storageUrl,
        filename: originalFilename,
        fileSize: fileBuffer.length,
        mimeType,
      };
    } catch (s3Error) {
      console.warn("[Storage] Cloud storage upload failed, falling back to local storage:", s3Error);
    }
  }

  // Fallback / Default Local Object Storage (public/uploads)
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, storedFilename);
  await fs.writeFile(filePath, fileBuffer);

  const storageUrl = `/uploads/${storedFilename}`;

  return {
    storageUrl,
    filename: originalFilename,
    fileSize: fileBuffer.length,
    mimeType,
  };
}