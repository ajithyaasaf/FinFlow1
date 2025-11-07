import type { Express, Response } from "express";
import { generateUploadUrl, validateFileType, validateFileSize, ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES, MAX_DOCUMENT_SIZE_MB, MAX_IMAGE_SIZE_MB } from "../lib/fileUpload";

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

export function registerUploadRoutes(app: Express, verifyToken: any) {
  // POST /api/upload/url - Generate signed upload URL
  app.post("/api/upload/url", verifyToken, async (req: any, res: Response) => {
    try {
      const { fileName, contentType, folder, fileType } = req.body;
      
      if (!fileName || !contentType || !folder) {
        return res.status(400).json({ error: "fileName, contentType, and folder are required" });
      }
      
      // Validate file type based on category
      let allowedTypes: string[];
      let maxSize: number;
      
      if (fileType === "document") {
        allowedTypes = ALLOWED_DOCUMENT_TYPES;
        maxSize = MAX_DOCUMENT_SIZE_MB;
      } else if (fileType === "image" || fileType === "selfie") {
        allowedTypes = ALLOWED_IMAGE_TYPES;
        maxSize = MAX_IMAGE_SIZE_MB;
      } else {
        return res.status(400).json({ error: "Invalid fileType. Must be 'document', 'image', or 'selfie'" });
      }
      
      if (!validateFileType(fileName, allowedTypes)) {
        return res.status(400).json({ 
          error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` 
        });
      }
      
      // Generate upload URL
      const { uploadUrl, downloadUrl, path } = await generateUploadUrl(
        folder,
        fileName,
        contentType
      );
      
      res.json({
        uploadUrl,
        downloadUrl,
        path,
        maxSizeMB: maxSize,
      });
    } catch (error: any) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/upload/validate - Validate file before upload
  app.post("/api/upload/validate", verifyToken, async (req: any, res: Response) => {
    try {
      const { fileName, fileSize, fileType } = req.body;
      
      if (!fileName || !fileSize || !fileType) {
        return res.status(400).json({ 
          error: "fileName, fileSize, and fileType are required" 
        });
      }
      
      let allowedTypes: string[];
      let maxSize: number;
      
      if (fileType === "document") {
        allowedTypes = ALLOWED_DOCUMENT_TYPES;
        maxSize = MAX_DOCUMENT_SIZE_MB;
      } else if (fileType === "image" || fileType === "selfie") {
        allowedTypes = ALLOWED_IMAGE_TYPES;
        maxSize = MAX_IMAGE_SIZE_MB;
      } else {
        return res.status(400).json({ 
          error: "Invalid fileType. Must be 'document', 'image', or 'selfie'" 
        });
      }
      
      const typeValid = validateFileType(fileName, allowedTypes);
      const sizeValid = validateFileSize(fileSize, maxSize);
      
      if (!typeValid) {
        return res.status(400).json({ 
          valid: false,
          error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` 
        });
      }
      
      if (!sizeValid) {
        return res.status(400).json({ 
          valid: false,
          error: `File size exceeds maximum of ${maxSize}MB` 
        });
      }
      
      res.json({ valid: true });
    } catch (error: any) {
      console.error("Error validating file:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
