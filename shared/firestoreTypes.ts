import { Timestamp } from "firebase/firestore";

// User and Authentication
export type UserRole = "admin" | "agent" | "md";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  branch?: string;
  phone?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Client Management
export type ClientStatus = "new" | "contacted" | "in_progress" | "converted" | "not_converted";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  // KYC Details
  panNumber?: string;
  aadharNumber?: string;
  
  // Employment Details
  employmentType?: "salaried" | "self_employed" | "business" | "other";
  companyName?: string;
  monthlyIncome?: number;
  
  // Loan Preference
  loanType?: "personal" | "business" | "vehicle" | "home" | "other";
  requestedAmount?: number;
  
  // Documents
  documents: {
    name: string;
    url: string;
    type: string;
    uploadedAt: Date | Timestamp;
  }[];
  
  // Tracking
  status: ClientStatus;
  assignedAgent?: string; // UID of assigned agent
  createdBy: string; // UID of creator
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  lastContactDate?: Date | Timestamp;
  notes?: string;
}

// Quotations
export type QuotationStatus = "draft" | "finalized" | "sent" | "accepted" | "rejected";

export interface Quotation {
  id: string;
  quotationNumber: string; // Q-2024-00001
  
  // Client and Agent
  clientId: string;
  clientName: string;
  agentId: string;
  agentName: string;
  
  // Loan Details
  loanType: "personal" | "business" | "vehicle" | "home" | "other";
  loanAmount: number;
  interestRate: number; // percentage
  tenure: number; // in months
  processingFee?: number;
  emi?: number; // calculated EMI
  
  // High-Value Flagging
  isHighValue: boolean;
  highValueReasons?: string[]; // e.g., ["amount_exceeds_threshold", "low_interest_rate"]
  
  // Status and Tracking
  status: QuotationStatus;
  pdfUrl?: string; // URL to generated PDF in Firebase Storage
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  sentAt?: Date | Timestamp;
  
  // Notes
  notes?: string;
}

// Loans
export type LoanStage = 
  | "application_submitted" 
  | "document_verification" 
  | "credit_appraisal" 
  | "sanction" 
  | "agreement_signed" 
  | "disbursement_ready";

export interface LoanStageDetail {
  stage: LoanStage;
  label: string;
  completed: boolean;
  completedAt?: Date | Timestamp;
  remarks?: string;
  documents?: {
    name: string;
    url: string;
    uploadedAt: Date | Timestamp;
  }[];
}

export interface Loan {
  id: string;
  loanNumber: string; // L-2024-00001
  
  // Client and Agent
  clientId: string;
  clientName: string;
  agentId: string;
  agentName: string;
  
  // Loan Details
  loanType: "personal" | "business" | "vehicle" | "home" | "other";
  loanAmount: number;
  approvedAmount?: number;
  interestRate: number;
  tenure: number;
  emi: number;
  
  // Quotation Reference
  quotationId?: string;
  
  // Progress Tracking
  currentStage: LoanStage;
  stages: LoanStageDetail[];
  
  // Disbursement
  disbursementDate?: Date | Timestamp;
  disbursementAmount?: number;
  
  // Top-up Eligibility
  topUpEligibleDate?: Date | Timestamp; // Date when top-up becomes available
  topUpNotified?: boolean;
  
  // Status
  status: "active" | "closed" | "defaulted";
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Attendance
export interface Attendance {
  id: string;
  
  // Agent Details
  agentId: string;
  agentName: string;
  
  // Attendance Data
  checkInTime: Date | Timestamp;
  selfieUrl: string; // Firebase Storage URL
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  workDescription: string;
  
  // Admin Actions
  editedBy?: string; // UID of admin who edited
  editedAt?: Date | Timestamp;
  editReason?: string;
  deletedBy?: string;
  deletedAt?: Date | Timestamp;
  deleteReason?: string;
  isDeleted?: boolean;
  
  createdAt: Date | Timestamp;
}

// Employees
export interface Employee {
  uid: string; // Same as auth UID
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  
  // Employment Details
  employeeId?: string;
  branch?: string;
  joinDate?: Date | Timestamp;
  
  // Performance Metrics
  loansProcessed?: number;
  totalLoanAmount?: number;
  conversionRate?: number; // percentage
  
  // Targets
  monthlyTarget?: number;
  
  // Status
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Policy Configuration
export interface PolicyConfig {
  id: string;
  
  // Quotation Thresholds
  highValueThresholds: {
    loanAmount: number; // e.g., 1000000 for ₹10L
    minInterestRate: number; // e.g., 12 for 12%
    maxTenure: number; // e.g., 60 for 60 months
  };
  
  // Top-up Configuration
  topUpEligibilityMonths: number; // e.g., 12 for 12 months
  
  // Attendance Configuration
  attendanceGeoFenceRadius?: number; // in meters
  
  // Other Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  
  updatedBy: string; // UID of who updated
  updatedAt: Date | Timestamp;
}

// Notifications
export interface Notification {
  id: string;
  userId: string; // UID of recipient
  type: "top_up" | "high_value_quotation" | "loan_stage_update" | "attendance" | "general";
  title: string;
  message: string;
  read: boolean;
  
  // Related Data
  relatedId?: string; // ID of related loan, quotation, etc.
  relatedType?: "loan" | "quotation" | "client" | "attendance";
  
  createdAt: Date | Timestamp;
}

// Audit Logs
export interface AuditLog {
  id: string;
  userId: string; // UID of user who performed action
  userName: string;
  action: string; // e.g., "created_client", "updated_loan", "deleted_attendance"
  entityType: "client" | "quotation" | "loan" | "attendance" | "employee" | "policy";
  entityId: string;
  changes?: any; // JSON of what changed
  timestamp: Date | Timestamp;
}
