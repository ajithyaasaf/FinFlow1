import { z } from "zod";

// Client validation schemas
export const createClientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[+]?[\d\s-()]+$/, "Invalid phone number"),
  alternatePhone: z.string().regex(/^[+]?[\d\s-()]+$/, "Invalid phone number").optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  
  // KYC Details (optional)
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number").optional().or(z.literal("")),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits").optional().or(z.literal("")),
  
  // Employment Details
  employmentType: z.enum(["salaried", "self_employed", "business", "other"]).optional(),
  companyName: z.string().optional(),
  monthlyIncome: z.number().positive().optional(),
  
  // Loan Preference
  loanType: z.enum(["personal", "business", "vehicle", "home", "other"]).optional(),
  requestedAmount: z.number().positive().optional(),
  
  // Tracking
  status: z.enum(["new", "contacted", "in_progress", "converted", "not_converted"]).default("new"),
  notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Quotation validation schemas
export const createQuotationSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  clientName: z.string().min(1, "Client name is required"),
  loanType: z.enum(["personal", "business", "vehicle", "home", "other"]),
  loanAmount: z.number().positive("Loan amount must be positive"),
  interestRate: z.number().min(0).max(100, "Interest rate must be between 0-100"),
  tenure: z.number().int().positive("Tenure must be a positive integer"),
  processingFee: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updateQuotationSchema = createQuotationSchema.partial();

// Loan validation schemas
export const createLoanSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  clientName: z.string().min(1, "Client name is required"),
  loanType: z.enum(["personal", "business", "vehicle", "home", "other"]),
  loanAmount: z.number().positive("Loan amount must be positive"),
  interestRate: z.number().min(0).max(100),
  tenure: z.number().int().positive(),
  quotationId: z.string().optional(),
});

export const updateLoanStageSchema = z.object({
  stage: z.enum([
    "application_submitted",
    "document_verification",
    "credit_appraisal",
    "sanction",
    "agreement_signed",
    "disbursement_ready"
  ]),
  remarks: z.string().optional(),
  completed: z.boolean(),
});

// Attendance validation schemas
export const createAttendanceSchema = z.object({
  workDescription: z.string().min(5, "Work description must be at least 5 characters"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(5, "Address is required"),
});

export const updateAttendanceSchema = z.object({
  editReason: z.string().min(5, "Edit reason is required"),
  workDescription: z.string().min(5).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(5),
  }).optional(),
});

export const deleteAttendanceSchema = z.object({
  deleteReason: z.string().min(5, "Delete reason is required"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanStageInput = z.infer<typeof updateLoanStageSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type DeleteAttendanceInput = z.infer<typeof deleteAttendanceSchema>;
