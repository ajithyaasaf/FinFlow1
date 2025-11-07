import type { Express, Response } from "express";
import { adminDb } from "../firebaseAdmin";
import { verifyToken } from "../middleware/auth";
import { generateDocumentDownloadUrl } from "../lib/documentManager";
import type { AuthRequest } from "../types";

/**
 * Document routes - Handle on-demand download URL generation with authorization
 * Ensures users can only download documents they own or have permission to access
 */
export function registerDocumentRoutes(app: Express) {
  // GET /api/documents/:resourceType/:resourceId/:documentType - Secure document download
  // Example: /api/documents/clients/abc123/panCard
  app.get("/api/documents/:resourceType/:resourceId/:documentType", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
      const { resourceType, resourceId, documentType } = req.params;
      const user = req.user;
      
      // Validate resource type
      if (!["clients", "quotations", "attendance"].includes(resourceType)) {
        return res.status(400).json({ error: "Invalid resource type" });
      }
      
      // Fetch the resource to verify ownership and get document path
      const docRef = adminDb.collection(resourceType).doc(resourceId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Resource not found" });
      }
      
      const data = doc.data();
      if (!data) {
        return res.status(404).json({ error: "Resource data not found" });
      }
      
      // Authorization: Check if user has access to this resource
      // Agents can only access their own resources, admins/MDs can access all
      if (user.role !== "admin" && user.role !== "md") {
        // For clients/quotations, check assignedAgent
        if (resourceType === "clients" || resourceType === "quotations") {
          if (data.assignedAgent !== user.uid) {
            return res.status(403).json({ error: "Access denied" });
          }
        }
        // For attendance, check agentId
        if (resourceType === "attendance") {
          if (data.agentId !== user.uid) {
            return res.status(403).json({ error: "Access denied" });
          }
        }
      }
      
      // Get the document path based on document type
      let documentPath: string | undefined;
      
      if (resourceType === "clients") {
        const documents = data.documents || {};
        documentPath = documents[documentType]?.path;
      } else if (resourceType === "quotations") {
        // Quotations might have attached documents
        const documents = data.documents || {};
        documentPath = documents[documentType]?.path;
      } else if (resourceType === "attendance") {
        // Attendance has selfie
        if (documentType === "selfie") {
          documentPath = data.selfieUrl; // This is actually a path now
        }
      }
      
      if (!documentPath) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Generate fresh signed URL (valid for 24 hours)
      const url = await generateDocumentDownloadUrl(documentPath);
      
      res.json({ url });
    } catch (error: any) {
      console.error("Error generating document URL:", error);
      res.status(500).json({ error: "Failed to generate document URL" });
    }
  });
}
