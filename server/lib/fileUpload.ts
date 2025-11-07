import { adminStorage } from "../firebaseAdmin";
import { randomUUID } from "crypto";

export interface UploadedFile {
  url: string;
  path: string;
  name: string;
  contentType: string;
}

/**
 * Generate a signed upload URL for direct client uploads to Firebase Storage
 * This allows secure uploads without exposing storage credentials to clients
 */
export async function generateUploadUrl(
  folder: string,
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; downloadUrl: string; path: string }> {
  const bucket = adminStorage.bucket();
  const uniqueId = randomUUID();
  const extension = fileName.split('.').pop();
  const path = `${folder}/${uniqueId}.${extension}`;
  const file = bucket.file(path);

  // Generate signed upload URL (valid for 15 minutes)
  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  // Generate public download URL
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;

  return { uploadUrl, downloadUrl, path };
}

/**
 * Upload a file buffer directly to Firebase Storage (for server-side uploads)
 */
export async function uploadFileBuffer(
  buffer: Buffer,
  folder: string,
  fileName: string,
  contentType: string
): Promise<UploadedFile> {
  const bucket = adminStorage.bucket();
  const uniqueId = randomUUID();
  const extension = fileName.split('.').pop();
  const path = `${folder}/${uniqueId}.${extension}`;
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: {
      contentType,
    },
  });

  // Make file publicly accessible
  await file.makePublic();

  const url = `https://storage.googleapis.com/${bucket.name}/${path}`;

  return {
    url,
    path,
    name: fileName,
    contentType,
  };
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const bucket = adminStorage.bucket();
  const file = bucket.file(path);
  await file.delete();
}

/**
 * Validate file type for uploads
 */
export function validateFileType(
  fileName: string,
  allowedTypes: string[]
): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(
  size: number,
  maxSizeInMB: number
): boolean {
  const maxBytes = maxSizeInMB * 1024 * 1024;
  return size <= maxBytes;
}

export const ALLOWED_DOCUMENT_TYPES = ['pdf', 'jpg', 'jpeg', 'png'];
export const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png'];
export const MAX_DOCUMENT_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_MB = 5;
