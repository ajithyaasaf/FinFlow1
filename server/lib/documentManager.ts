import { adminStorage } from "../firebaseAdmin";

/**
 * Document Manager - Handles permanent document storage with on-demand URL generation
 * 
 * Strategy: Store only file paths in Firestore. Generate fresh signed URLs when needed.
 * This prevents URL expiration issues and provides better security control.
 */

export interface DocumentMetadata {
  name: string;
  path: string; // Storage path (permanent)
  type: string;
  contentType: string;
  uploadedAt: Date;
}

/**
 * Generate a fresh download URL for a stored document
 * URLs are valid for 24 hours - client should request new URL if expired
 */
export async function generateDocumentDownloadUrl(path: string): Promise<string> {
  const bucket = adminStorage.bucket();
  const file = bucket.file(path);
  
  // Check if file exists
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error("Document not found");
  }
  
  // Generate signed URL valid for 24 hours
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  
  return url;
}

/**
 * Generate fresh download URLs for multiple documents
 */
export async function generateDocumentDownloadUrls(
  paths: string[]
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  
  await Promise.all(
    paths.map(async (path) => {
      try {
        const url = await generateDocumentDownloadUrl(path);
        urlMap.set(path, url);
      } catch (error) {
        console.error(`Failed to generate URL for ${path}:`, error);
        // Don't fail the entire operation if one file is missing
      }
    })
  );
  
  return urlMap;
}

/**
 * Delete a document from storage
 */
export async function deleteDocument(path: string): Promise<void> {
  const bucket = adminStorage.bucket();
  const file = bucket.file(path);
  
  const [exists] = await file.exists();
  if (exists) {
    await file.delete();
  }
}

/**
 * Get document metadata from storage
 */
export async function getDocumentMetadata(path: string): Promise<{
  size: number;
  contentType: string;
  updated: Date;
}> {
  const bucket = adminStorage.bucket();
  const file = bucket.file(path);
  
  const [metadata] = await file.getMetadata();
  
  return {
    size: parseInt(metadata.size || "0"),
    contentType: metadata.contentType || "application/octet-stream",
    updated: new Date(metadata.updated),
  };
}
