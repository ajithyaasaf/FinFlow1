import { auth } from "./firebase";
import type { Client, Quotation, Loan, Attendance } from "@shared/firestoreTypes";

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Client API
export const clientsApi = {
  getAll: (params?: {status?: string; assignedAgent?: string; search?: string}) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.assignedAgent) queryParams.append("assignedAgent", params.assignedAgent);
    if (params?.search) queryParams.append("search", params.search);
    
    const query = queryParams.toString();
    return apiRequest<Client[]>(`/api/clients${query ? `?${query}` : ""}`);
  },
  
  getOne: (id: string) => apiRequest<Client>(`/api/clients/${id}`),
  
  create: (data: Omit<Client, "id" | "documents" | "createdBy" | "createdAt" | "updatedAt">) => 
    apiRequest<Client>("/api/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Client>) =>
    apiRequest<Client>(`/api/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiRequest<{success: boolean}>(`/api/clients/${id}`, {
      method: "DELETE",
    }),
  
  addDocument: (id: string, document: {name: string; url: string; type: string}) =>
    apiRequest<{success: boolean; document: any}>(`/api/clients/${id}/documents`, {
      method: "POST",
      body: JSON.stringify(document),
    }),
};

// Quotation API
export const quotationsApi = {
  getAll: (params?: {status?: string; agentId?: string; isHighValue?: boolean}) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.agentId) queryParams.append("agentId", params.agentId);
    if (params?.isHighValue) queryParams.append("isHighValue", "true");
    
    const query = queryParams.toString();
    return apiRequest<Quotation[]>(`/api/quotations${query ? `?${query}` : ""}`);
  },
  
  getOne: (id: string) => apiRequest<Quotation>(`/api/quotations/${id}`),
  
  create: (data: {
    clientId: string;
    clientName: string;
    loanType: "personal" | "business" | "vehicle" | "home" | "other";
    loanAmount: number;
    interestRate: number;
    tenure: number;
    processingFee?: number;
    notes?: string;
  }) => 
    apiRequest<Quotation>("/api/quotations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Quotation>) =>
    apiRequest<Quotation>(`/api/quotations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  
  updateStatus: (id: string, status: string) =>
    apiRequest<Quotation>(`/api/quotations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  
  delete: (id: string) =>
    apiRequest<{success: boolean}>(`/api/quotations/${id}`, {
      method: "DELETE",
    }),
  
  downloadPDF: async (id: string): Promise<Blob> => {
    const authHeaders = await getAuthHeaders(); // Get Firebase ID token
    // Strip Content-Type for blob download (only need Authorization)
    const { "Content-Type": _, ...headers } = authHeaders;
    const response = await fetch(`/api/quotations/${id}/pdf`, {
      headers,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to download PDF: ${text || response.statusText}`);
    }
    return response.blob();
  },
};

// Loan API
export const loansApi = {
  getAll: (params?: {status?: string; agentId?: string; clientId?: string}) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.agentId) queryParams.append("agentId", params.agentId);
    if (params?.clientId) queryParams.append("clientId", params.clientId);
    
    const query = queryParams.toString();
    return apiRequest<Loan[]>(`/api/loans${query ? `?${query}` : ""}`);
  },
  
  getOne: (id: string) => apiRequest<Loan>(`/api/loans/${id}`),
  
  create: (data: {
    clientId: string;
    clientName: string;
    loanType: "personal" | "business" | "vehicle" | "home" | "other";
    loanAmount: number;
    interestRate: number;
    tenure: number;
    quotationId?: string;
  }) =>
    apiRequest<Loan>("/api/loans", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  updateStage: (id: string, data: {
    stage: string;
    remarks?: string;
    completed: boolean;
  }) =>
    apiRequest<Loan>(`/api/loans/${id}/stage`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  
  disburse: (id: string, disbursementAmount?: number) =>
    apiRequest<Loan>(`/api/loans/${id}/disburse`, {
      method: "PATCH",
      body: JSON.stringify({ disbursementAmount }),
    }),
  
  getTopUpEligible: () =>
    apiRequest<Loan[]>("/api/loans/topup-eligible"),
};

// Attendance API
export const attendanceApi = {
  getAll: (params?: {agentId?: string; date?: string; startDate?: string; endDate?: string}) => {
    const queryParams = new URLSearchParams();
    if (params?.agentId) queryParams.append("agentId", params.agentId);
    if (params?.date) queryParams.append("date", params.date);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    
    const query = queryParams.toString();
    return apiRequest<Attendance[]>(`/api/attendance${query ? `?${query}` : ""}`);
  },
  
  getOne: (id: string) => apiRequest<Attendance>(`/api/attendance/${id}`),
  
  create: (data: {
    workDescription: string;
    latitude: number;
    longitude: number;
    address: string;
    selfieUrl: string;
  }) =>
    apiRequest<Attendance>("/api/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: {
    editReason: string;
    workDescription?: string;
    location?: {latitude: number; longitude: number; address: string};
  }) =>
    apiRequest<Attendance>(`/api/attendance/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string, deleteReason: string) =>
    apiRequest<{success: boolean}>(`/api/attendance/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ deleteReason }),
    }),
  
  getTodayStats: () =>
    apiRequest<{total: number; present: number}>("/api/attendance/stats/today"),
};

// File Upload API
export const uploadApi = {
  getUploadUrl: (data: {
    fileName: string;
    contentType: string;
    resourceId: string;
    fileType: "document" | "image" | "selfie";
  }) =>
    apiRequest<{
      uploadUrl: string;
      path: string;
      maxSizeMB: number;
    }>("/api/upload/url", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  validate: (data: {
    fileName: string;
    fileSize: number;
    fileType: "document" | "image" | "selfie";
  }) =>
    apiRequest<{valid: boolean; error?: string}>("/api/upload/validate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  uploadFile: async (file: File, resourceId: string, fileType: "document" | "image" | "selfie") => {
    // First, get signed upload URL
    const { uploadUrl, path } = await uploadApi.getUploadUrl({
      fileName: file.name,
      contentType: file.type,
      resourceId,
      fileType,
    });
    
    // Upload file to Firebase Storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
    
    if (!uploadResponse.ok) {
      throw new Error("File upload failed");
    }
    
    // Return the storage path (download URLs are generated on-demand)
    return { path };
  },
};

// Document API - Generate fresh download URLs on-demand with authorization
export const documentsApi = {
  // Get download URL for a specific document
  // resourceType: "clients" | "quotations" | "attendance"
  // documentType: "panCard" | "aadharCard" | "selfie" etc.
  getDownloadUrl: (resourceType: string, resourceId: string, documentType: string) =>
    apiRequest<{url: string}>(`/api/documents/${resourceType}/${resourceId}/${documentType}`),
};
