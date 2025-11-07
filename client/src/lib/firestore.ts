// Firestore helper functions for CRUD operations
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Client,
  Quotation,
  Loan,
  Attendance,
  Employee,
  PolicyConfig,
  Notification,
  AuditLog,
} from "@shared/firestoreTypes";

// Collection references
export const collections = {
  users: "users",
  clients: "clients",
  quotations: "quotations",
  loans: "loans",
  attendance: "attendance",
  employees: "employees",
  policies: "policies",
  notifications: "notifications",
  auditLogs: "audit_logs",
};

// Generic CRUD operations
export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: Omit<T, "id">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

export async function updateDocument<T extends Partial<DocumentData>>(
  collectionName: string,
  id: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

// Client-specific operations
export async function getClientsByAgent(agentId: string): Promise<Client[]> {
  return getDocuments<Client>(collections.clients, [
    where("assignedAgent", "==", agentId),
    orderBy("createdAt", "desc"),
  ]);
}

export async function getClientsByStatus(status: string): Promise<Client[]> {
  return getDocuments<Client>(collections.clients, [
    where("status", "==", status),
    orderBy("createdAt", "desc"),
  ]);
}

// Quotation-specific operations
export async function getHighValueQuotations(): Promise<Quotation[]> {
  return getDocuments<Quotation>(collections.quotations, [
    where("isHighValue", "==", true),
    orderBy("createdAt", "desc"),
    limit(20),
  ]);
}

export async function getQuotationsByAgent(agentId: string): Promise<Quotation[]> {
  return getDocuments<Quotation>(collections.quotations, [
    where("agentId", "==", agentId),
    orderBy("createdAt", "desc"),
  ]);
}

// Loan-specific operations
export async function getTopUpEligibleLoans(): Promise<Loan[]> {
  const today = Timestamp.now();
  return getDocuments<Loan>(collections.loans, [
    where("topUpEligibleDate", "<=", today),
    where("topUpNotified", "==", false),
    where("status", "==", "active"),
  ]);
}

export async function getLoansByClient(clientId: string): Promise<Loan[]> {
  return getDocuments<Loan>(collections.loans, [
    where("clientId", "==", clientId),
    orderBy("createdAt", "desc"),
  ]);
}

// Attendance-specific operations
export async function getTodayAttendance(): Promise<Attendance[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return getDocuments<Attendance>(collections.attendance, [
    where("checkInTime", ">=", Timestamp.fromDate(today)),
    where("checkInTime", "<", Timestamp.fromDate(tomorrow)),
    where("isDeleted", "!=", true),
    orderBy("checkInTime", "desc"),
  ]);
}

export async function getAttendanceByAgent(agentId: string, startDate: Date, endDate: Date): Promise<Attendance[]> {
  return getDocuments<Attendance>(collections.attendance, [
    where("agentId", "==", agentId),
    where("checkInTime", ">=", Timestamp.fromDate(startDate)),
    where("checkInTime", "<=", Timestamp.fromDate(endDate)),
    where("isDeleted", "!=", true),
    orderBy("checkInTime", "desc"),
  ]);
}

// Notification-specific operations
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  return getDocuments<Notification>(collections.notifications, [
    where("userId", "==", userId),
    where("read", "==", false),
    orderBy("createdAt", "desc"),
  ]);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  return updateDocument(collections.notifications, notificationId, {
    read: true,
  });
}

// Audit log operations
export async function createAuditLog(
  userId: string,
  userName: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: any
): Promise<void> {
  await createDocument<AuditLog>(collections.auditLogs, {
    userId,
    userName,
    action,
    entityType: entityType as any,
    entityId,
    changes,
    timestamp: Timestamp.now(),
  });
}

// Policy operations
export async function getPolicyConfig(): Promise<PolicyConfig | null> {
  const policies = await getDocuments<PolicyConfig>(collections.policies, [limit(1)]);
  return policies.length > 0 ? policies[0] : null;
}

export async function getDefaultPolicyConfig(): Promise<PolicyConfig> {
  return {
    id: "default",
    highValueThresholds: {
      loanAmount: 1000000, // ₹10L
      minInterestRate: 12, // 12%
      maxTenure: 60, // 60 months
    },
    topUpEligibilityMonths: 12,
    emailNotifications: true,
    smsNotifications: false,
    updatedBy: "system",
    updatedAt: Timestamp.now(),
  };
}
