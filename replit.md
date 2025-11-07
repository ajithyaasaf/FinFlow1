# FinFlow - Enterprise Loan Finance Management System

## Project Overview
FinFlow is a comprehensive enterprise-level loan finance management system built for companies offering multiple types of loans. The system manages client onboarding, loan tracking, quotations, field agent operations, payroll, and attendance with role-based access for Admin, Agent, and Managing Director (MD) roles.

## Technology Stack
- **Frontend**: React with TypeScript, Wouter (routing), TanStack Query, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication with role-based access control
- **Storage**: Firebase Storage for documents and images
- **Currency**: INR (₹) with Indian numbering format (Lakhs/Crores)

## User Roles
1. **Agent**: Field agents who onboard clients, create quotations, mark attendance
2. **Admin**: Manages all operations, approves/reviews quotations, manages employees
3. **Managing Director (MD)**: Executive oversight, views all metrics and flagged quotations

## Core Features Implemented

### Authentication & Authorization ✅
- Firebase Authentication with email/password and Google Sign-In
- Role-based access control (RBAC) with custom claims
- Token verification middleware
- Protected routes on frontend and backend

### Client Management ✅
- Full CRUD operations for clients
- KYC details (PAN, Aadhar)
- Employment details and income tracking
- Document uploads (PDF, JPG, PNG)
- Client status tracking (New/Contacted/In Progress/Converted/Not Converted)
- Search and filter capabilities

### Quotation Management ✅
- Create, edit, and track quotations
- Automatic EMI calculation
- High-value quotation flagging based on thresholds
- PDF generation capability
- Instant download for agents (field usability)
- Admin/MD visibility for high-value quotations
- Status management (Draft/Finalized/Sent/Accepted/Rejected)

### Loan Management ✅
- Loan creation (Admin only)
- 6-stage loan progress tracking:
  1. Application Submitted
  2. Document Verification
  3. Credit Appraisal
  4. Sanction
  5. Agreement Signed
  6. Disbursement Ready
- Top-up eligibility tracking
- Disbursement management

### Attendance Management ✅
- Agent check-in with GPS location
- Selfie capture (camera only)
- Work description logging
- Admin edit/delete with reason tracking
- Soft delete functionality
- Daily statistics

### File Management ✅
- Secure file uploads to Firebase Storage
- Pre-signed URL generation
- File type and size validation
- Document download with authorization

## Features In Progress / TODO

### Missing Critical Features (Per PRD)
1. **Employees Module** - Employee management with performance metrics
2. **Payroll Module** - Attendance-linked payroll with salary slips
3. **Reports & Analytics** - Comprehensive reporting system
4. **Notifications System** - Real-time alerts for various events
5. **Policy Configuration** - Admin-configurable thresholds and settings
6. **MD Executive Dashboard** - Specialized dashboard for MD role
7. **Top-up Reminders** - Automated notifications for eligible clients
8. **Enhanced PDF Generation** - Professional quotation PDFs with branding

### UI Enhancements Needed
- Replace mock data with real Firestore queries
- Add role-specific UI elements
- Create dedicated MD dashboard
- Build comprehensive reports page
- Add employee management UI
- Implement payroll interface

## Current Data Models (Firestore Collections)

### users
- uid, email, displayName, role, branch, phone
- Performance metrics: loansProcessed, totalLoanAmount, conversionRate
- createdAt, updatedAt

### clients
- Personal info, KYC details, employment details
- Loan preferences, documents
- Status tracking, assigned agent
- Audit fields

### quotations
- Client and agent references
- Loan details (amount, rate, tenure, EMI)
- High-value flagging
- PDF URL, status tracking

### loans
- Client and agent references
- Loan details, approval amount
- Stage tracking with history
- Disbursement tracking
- Top-up eligibility

### attendance
- Agent ID, check-in time
- Location (GPS + address)
- Selfie URL, work description
- Admin edit/delete tracking

### audit_logs (Partial Implementation)
- User actions tracking
- Entity changes
- Timestamps

## Missing Collections to Implement
- employees (detailed employee records)
- payroll (salary records)
- policy_config (system configuration)
- notifications (user notifications)

## Recent Changes
- Updated Firebase Admin SDK to properly use service account credentials
- Fixed initialization to support both GOOGLE_APPLICATION_CREDENTIALS and individual secret-based auth

## Development Guidelines
- Follow fullstack_js development patterns
- Use dark blue corporate theme consistently
- Implement proper error handling and validation
- Add data-testid attributes for all interactive elements
- Maintain audit trails for sensitive operations
- Format all currency as INR with proper separators

## Next Steps
1. Complete employee management module
2. Build payroll system
3. Implement comprehensive reporting
4. Add notification system
5. Create MD executive dashboard
6. Replace all mock data
7. Enhance security and compliance features
