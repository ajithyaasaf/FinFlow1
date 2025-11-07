import type { Express, Response } from "express";
import { adminDb } from "../firebaseAdmin";
import { createClientSchema, updateClientSchema } from "../lib/validation";
import type { Client } from "@shared/firestoreTypes";

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

export function registerClientRoutes(app: Express, verifyToken: any) {
  // GET /api/clients - Get all clients
  app.get("/api/clients", verifyToken, async (req: any, res: Response) => {
    try {
      const { status, assignedAgent, search } = req.query;
      
      let query = adminDb.collection("clients");
      
      // Filter by status if provided
      if (status && status !== "all") {
        query = query.where("status", "==", status) as any;
      }
      
      // Filter by assigned agent if provided
      if (assignedAgent) {
        query = query.where("assignedAgent", "==", assignedAgent) as any;
      }
      
      const snapshot = await query.get();
      let clients = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Client[];
      
      // Client-side search filtering (Firestore doesn't support full-text search)
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        clients = clients.filter(client => 
          client.name.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          client.phone.includes(search)
        );
      }
      
      res.json(clients);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/clients/:id - Get a single client
  app.get("/api/clients/:id", verifyToken, async (req: any, res: Response) => {
    try {
      const doc = await adminDb.collection("clients").doc(req.params.id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      res.json({ ...doc.data(), id: doc.id });
    } catch (error: any) {
      console.error("Error fetching client:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/clients - Create a new client
  app.post("/api/clients", verifyToken, async (req: any, res: Response) => {
    try {
      // Validate request body
      const validatedData = createClientSchema.parse(req.body);
      
      // Get user profile for agent name
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      const clientData: Omit<Client, "id"> = {
        ...validatedData,
        documents: [],
        assignedAgent: req.user.uid,
        createdBy: req.user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await adminDb.collection("clients").add(clientData);
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "created_client",
        entityType: "client",
        entityId: docRef.id,
        timestamp: new Date(),
      });
      
      res.status(201).json({ ...clientData, id: docRef.id });
    } catch (error: any) {
      console.error("Error creating client:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/clients/:id - Update a client
  app.patch("/api/clients/:id", verifyToken, async (req: any, res: Response) => {
    try {
      const validatedData = updateClientSchema.parse(req.body);
      
      const docRef = adminDb.collection("clients").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const updateData = {
        ...validatedData,
        updatedAt: new Date(),
      };
      
      await docRef.update(updateData);
      
      // Get user profile for audit log
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "updated_client",
        entityType: "client",
        entityId: req.params.id,
        changes: validatedData,
        timestamp: new Date(),
      });
      
      const updated = await docRef.get();
      res.json({ ...updated.data(), id: updated.id });
    } catch (error: any) {
      console.error("Error updating client:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/clients/:id - Delete a client (Admin only)
  app.delete("/api/clients/:id", verifyToken, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can delete clients" });
      }
      
      const docRef = adminDb.collection("clients").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      await docRef.delete();
      
      // Get user profile for audit log
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "deleted_client",
        entityType: "client",
        entityId: req.params.id,
        timestamp: new Date(),
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting client:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/clients/:id/documents - Add document to client
  app.post("/api/clients/:id/documents", verifyToken, async (req: any, res: Response) => {
    try {
      const { name, url, type } = req.body;
      
      const docRef = adminDb.collection("clients").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const document = {
        name,
        url,
        type,
        uploadedAt: new Date(),
      };
      
      await docRef.update({
        documents: [...(doc.data()?.documents || []), document],
        updatedAt: new Date(),
      });
      
      res.json({ success: true, document });
    } catch (error: any) {
      console.error("Error adding document:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
