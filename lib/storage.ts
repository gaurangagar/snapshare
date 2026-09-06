import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

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
  const extension = path.extname(originalFilename) || ".jpg";
  const uniqueId = crypto.randomUUID();
  const safeBaseName = path
    .basename(originalFilename, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "_");
  const storedFilename = `${safeBaseName}_${uniqueId}${extension}`;

  // Check if S3 / Cloudflare R2 credentials are provided
  const s3Bucket = process.env.S3_BUCKET_NAME;
  const s3AccessKey = process.env.AWS_ACCESS_KEY_ID;
  const s3SecretKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (s3Bucket && s3AccessKey && s3SecretKey) {
    // Cloud S3 / R2 Upload
    try {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
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

      const publicUrlBase = process.env.S3_PUBLIC_URL || `https://${s3Bucket}.s3.amazonaws.com`;
      const storageUrl = `${publicUrlBase}/${key}`;

      return {
        storageUrl,
        filename: originalFilename,
        fileSize: fileBuffer.length,
        mimeType,
      };
    } catch (s3Error) {
      console.warn("Cloud storage upload failed, falling back to local storage:", s3Error);
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
