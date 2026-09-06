import fs from "fs";
import path from "path";

// Load .env if not loaded
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function runTest() {
  console.log("=== Testing AWS S3 Configuration ===");
  console.log("S3_BUCKET_NAME:", process.env.S3_BUCKET_NAME);
  console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
  console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? `${process.env.AWS_SECRET_ACCESS_KEY.slice(0, 4)}...${process.env.AWS_SECRET_ACCESS_KEY.slice(-4)}` : "NOT_SET");
  console.log("AWS_REGION:", process.env.AWS_REGION);
  console.log("AWS_ENDPOINT:", process.env.AWS_ENDPOINT || "(default AWS)");
  console.log("S3_PUBLIC_URL:", process.env.S3_PUBLIC_URL || "(default AWS S3 URL)");

  const { S3Client, ListObjectsV2Command, HeadBucketCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  const s3Client = new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  // Step 1: Check bucket existence / access
  console.log("\n--- Step 1: Checking Bucket Access (HeadBucket) ---");
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET_NAME }));
    console.log("✅ HeadBucket succeeded! Bucket exists and credentials have access.");
  } catch (err: any) {
    console.error("❌ HeadBucket failed:", err.name, "-", err.message);
    if (err.$metadata) console.error("HTTP Status Code:", err.$metadata.httpStatusCode);
  }

  // Step 2: Try Listing Objects
  console.log("\n--- Step 2: Listing Objects (ListObjectsV2) ---");
  try {
    const listRes = await s3Client.send(new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 5,
    }));
    console.log("✅ ListObjectsV2 succeeded! Key count:", listRes.KeyCount);
    if (listRes.Contents && listRes.Contents.length > 0) {
      console.log("Sample objects in bucket:", listRes.Contents.map(c => c.Key));
    }
  } catch (err: any) {
    console.error("❌ ListObjectsV2 failed:", err.name, "-", err.message);
  }

  // Step 3: Test Upload via saveUploadedFile in lib/storage.ts
  console.log("\n--- Step 3: Testing saveUploadedFile from lib/storage.ts ---");
  let uploadedUrl = "";
  let uploadedKey = "";
  try {
    const { saveUploadedFile } = await import("../lib/storage");
    const testBuffer = Buffer.from("SnapShare AWS S3 Test: " + new Date().toISOString());
    const uploadRes = await saveUploadedFile(testBuffer, "test-verify.txt", "text/plain");
    uploadedUrl = uploadRes.storageUrl;
    console.log("Upload result:", uploadRes);

    if (uploadRes.storageUrl.startsWith("http")) {
      console.log("✅ S3 upload successful! File hosted at:", uploadRes.storageUrl);
      uploadedKey = `events/${path.basename(uploadRes.storageUrl)}`;
    } else {
      console.warn("⚠️ Upload did not go to S3, fell back to local storage URL:", uploadRes.storageUrl);
    }
  } catch (err: any) {
    console.error("❌ saveUploadedFile failed:", err);
  }

  // Step 4: Test Public HTTP access
  if (uploadedUrl.startsWith("http")) {
    console.log("\n--- Step 4: Testing Public HTTP Access (Browser/Client fetching photo) ---");
    try {
      const httpRes = await fetch(uploadedUrl);
      console.log("HTTP Status Code:", httpRes.status, httpRes.statusText);
      if (httpRes.ok) {
        const text = await httpRes.text();
        console.log("✅ Public read access is working! Content preview:", text.slice(0, 50));
      } else {
        const errText = await httpRes.text();
        console.warn("⚠️ Public read returned status", httpRes.status);
        if (errText.includes("AccessDenied")) {
          console.warn("⚠️ Reason: S3 Bucket Block Public Access or Bucket Policy is preventing public reads!");
        }
      }
    } catch (err: any) {
      console.error("❌ HTTP fetch failed:", err.message);
    }
  }

  // Step 5: Test SDK GetObject & DeleteObject (Cleanup)
  if (uploadedKey) {
    console.log("\n--- Step 5: Testing SDK GetObject & DeleteObject (Cleanup) ---");
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    try {
      const getRes = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: uploadedKey,
      }));
      console.log("✅ SDK GetObject succeeded! ContentType:", getRes.ContentType);
    } catch (err: any) {
      console.error("❌ SDK GetObject failed:", err.name, "-", err.message);
    }

    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: uploadedKey,
      }));
      console.log("✅ SDK DeleteObject succeeded! Cleaned up test file.");
    } catch (err: any) {
      console.error("❌ SDK DeleteObject failed:", err.name, "-", err.message);
    }
  }
}

runTest().catch(console.error);
