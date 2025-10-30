# Treasure-Home School Management System

## ⚠️ CRITICAL NOTICE FOR ALL REPLIT AGENTS ⚠️

**DATABASE STORAGE REQUIREMENT - READ THIS FIRST:**

🔴 **ALL DATA AND INFORMATION MUST BE STORED EXCLUSIVELY IN THE SUPABASE DATABASE** 🔴

- **NEVER** use in-memory storage (MemStorage)
- **NEVER** use local file storage for persistent data
- **ALWAYS** use the Supabase PostgreSQL database for ALL data persistence
- The database connection is configured via `DATABASE_URL` environment variable
- Storage implementation is in `server/storage.ts` using Drizzle ORM
- All CRUD operations MUST go through the database storage interface

**If you need to add new features:**
1. Add the necessary tables/columns to `shared/schema.ts`
2. Update `server/storage.ts` interface and implementation
3. Run `npm run db:push` to sync schema changes to Supabase
4. NEVER create alternative storage solutions

This project is configured for **Production Supabase Database Only** - do not deviate from this architecture.

---

## Overview
Treasure-Home is a full-stack web application for K-12 schools, providing role-based dashboards for students, teachers, administrators, and parents, plus a public website. Its core purpose is to streamline school administration and enhance the educational experience through a unified, secure, and user-friendly platform. Key capabilities include managing enrollment, attendance, grades, announcements, communication, and a robust online exam system. The project uses a modern monorepo architecture, shared schema definitions, and a comprehensive authentication system with role-based access control.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (October 2025)

### Bug Fixes
**Student Deletion Not Working (October 29, 2025)**
- **Issue**: DELETE requests for students returned 200 OK but students were not being removed from the system
- **Root Cause**: Missing DELETE endpoint for `/api/students/:id` - requests were falling through to catch-all handler
- **Fix**: Implemented DELETE endpoint with proper authorization (Admin/Super Admin only), UUID validation, existence checks, and soft deletion (sets `isActive = false`)
- **Impact**: Students can now be properly deleted through the admin interface, preserving referential integrity for attendance, exams, and other related data

### Phase 1: Multi-Class & Multi-Subject Teacher Assignment System ✅ COMPLETED
**Backend Implementation (October 26, 2025)**
- **Database Schema**: Added `teacher_class_assignments` table with full audit trail support (migration 0017)
- **API Endpoints**: Complete CRUD operations for teacher-to-class-subject assignments
  - POST /api/teacher-assignments - Create assignments (Admin/Super Admin only)
  - GET /api/teacher-assignments - Get assignments with role-based filtering
  - GET /api/classes/:classId/subjects/:subjectId/teachers - Get teachers for class/subject
  - GET /api/teachers/:teacherId/assignments - Get teacher's assignments
  - PUT /api/teacher-assignments/:id - Update assignments (Admin/Super Admin only)
  - DELETE /api/teacher-assignments/:id - Delete assignments (Admin/Super Admin only)
- **Security**: Implemented role-based authorization - Admins can manage all assignments, teachers can only view their own, students/parents have no access
- **Audit Trail**: All assignments track `assigned_by` field for accountability
- **Status**: Backend complete and architect-approved. Ready for frontend implementation.

### System Enhancements
- **Global Optimistic UI Updates (October 30, 2025)**: Implemented comprehensive optimistic UI updates across the entire application for instant user feedback on all actions. Every mutation (verify, unverify, suspend, unsuspend, delete, update, approve, reject, publish, unpublish, activate, deactivate, create) now provides immediate on-screen feedback before backend confirmation. Enhanced `client/src/lib/optimisticUpdates.ts` with reusable helper functions for common patterns: `optimisticStatusChange`, `optimisticPublishToggle`, `optimisticVerifyToggle`, `optimisticApprovalStatusChange`, and `optimisticActiveToggle`. All mutations include proper rollback logic to restore previous state on errors. Implemented across ALL major modules: AcademicTermsManagement (create, update, delete, mark as current), AttendanceManagement (attendance submission), SubjectsManagement (create, update, delete), TeachersManagement (create, update, delete), ClassesManagement (create, update, delete), HomepageManagement (update, delete content), VacancyManagement (create, close vacancies, approve/reject applications), TeacherProfileVerification (approve/reject profiles), SuperAdminManagement, UserManagement, StudentManagement, ExamManagement, and AnnouncementsManagement. Combined with Supabase Realtime integration (added to AcademicTermsManagement, SubjectsManagement, and other key modules) for instant cross-client synchronization. Result: Modern, professional feel with zero perceived lag on user actions across the entire system.
- **Real-time Synchronization with Auto-Recovery (October 28-29, 2025)**: Implemented Supabase Realtime integration for instant data synchronization across all connected clients. All CRUD operations (create, update, delete) now reflect immediately on all user devices without requiring page reloads. Implementation uses a custom `useSupabaseRealtime` hook that listens to database changes and automatically invalidates React Query cache. The system scales to Supabase's free tier limits (200+ concurrent connections) and includes automatic graceful degradation with recovery - when connection limits are reached, the system seamlessly falls back to polling-based updates (30-second intervals) without service interruption, then automatically attempts to restore real-time connections after a 1-minute recovery window. Recovery system checks every 10 seconds for recovery conditions and notifies all connected components to retry connections. Super Admins can monitor connection health and test fallback behavior via the Real-time Connection Health dashboard. Real-time updates are integrated into key pages: Student Management, User Management, Announcements, Attendance, Exams, Super Admin Management, Teacher Management, Teacher Profile Verification, Classes Management, and Vacancy Management. **Configuration Required**: Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables to enable real-time functionality (see Environment Variables section below).
- **Automatic Account Activation**: Removed manual approval requirement for new user accounts. All new users are now automatically activated with status set to 'active' upon registration, eliminating the need for admin approval. The PendingApprovals page and related approval endpoints have been removed from the system.
- **Unified Login System**: Removed separate SuperAdminLogin page. All users (students, teachers, admins, parents, and super admins) now use the single unified login page at `/login`. The system automatically routes users to their appropriate portal based on their role after authentication.
- **Automatic Roles Seeding**: Added automatic creation of all required roles (Super Admin, Admin, Teacher, Student, Parent) on server startup. All roles are created with appropriate permissions if they don't exist, ensuring admin creation always works.
- **Automatic Super Admin Seeding**: Added automatic super admin account creation on server startup. The super admin user is created if it doesn't exist, with secure password requirements and mandatory password change on first login.
- **Security Enhancement**: Improved password logging security - credentials are never logged in plaintext after initial setup.
- **Password Change Enforcement**: All newly created users (admins, teachers, students, parents) are now required to change their password on first login. This applies to users created through any method: invites, CSV import, manual creation, or bulk provisioning. The `mustChangePassword` flag is automatically set to `true` for all new accounts to ensure maximum security.
- **Admin Account Visibility Control**: Implemented comprehensive security control for admin account visibility. Regular Admins can no longer view, modify, or delete Super Admin and Admin accounts in user management. This protection is enforced across ALL user management endpoints (list, update, delete, verify, suspend). Super Admins have complete control through a toggle in the system settings (`hideAdminAccountsFromAdmins`, default: enabled). Only Super Admins can manage admin-level accounts, ensuring proper privilege separation and preventing unauthorized access.

## System Architecture

### UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript and Vite.
- **UI Components**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with CSS custom properties for theming, focusing on a clean, simple aesthetic with blue-only gradients.
- **State Management**: TanStack React Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod schema validation.
- **Exam Interface**: Features an enhanced navigation sidebar, prominent timer, full-screen mode, real-time auto-save indicators, and a professional, minimalist design with Lucide React icons.
- **Mobile Navigation**: Responsive hamburger menu for all portal pages.
- **Portal Dashboards**: All dashboards (Super Admin, Admin, Teacher, Parent) redesigned to match the modern student portal style with gradient stats cards, professional animations, and visual consistency (e.g., `shadow-xl`, `hover:-translate-y-1`).

### Technical Implementations
- **Backend**: Node.js with Express.js and TypeScript.
- **API Design**: RESTful API endpoints with structured error handling.
- **Session Management**: Express sessions with PostgreSQL session store.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Authentication**: Role-based hybrid system supporting username/password for students/parents and Google OAuth (or password) for Admin/Teacher. Features JWT tokens, bcrypt hashing, rate limiting, and account lockout. Includes user management and audit logs.
- **Authorization**: Role-Based Access Control (RBAC) for student, teacher, admin, and parent roles.
- **Exam Security**: Tab switch detection, session recovery, question/option randomization, time-based auto-submit, and robust answer saving with validation.
- **User Provisioning**: CSV bulk provisioning for students and parents with automatic, simplified username generation (e.g., `THS-STU-###`) and PDF login slips. Automated username and temporary password generation for all user creation flows with secure credential display and one-time viewing.
- **Teacher Profile Onboarding**: Compulsory 3-step wizard with progress meter, auto-save, validation, and admin verification.
- **Homepage Content Management System**: Admin portal for managing website images (hero, gallery) with upload, organization, and secure storage. Public endpoints for content access.
- **Job Vacancy & Teacher Pre-Approval System**: Public job portal, teacher application workflow, admin management of vacancies and applications, and pre-approval security for Google OAuth access.

### System Design Choices
- **Monorepo Design**: Client, server, and shared code in a single repository.
- **Shared Schema**: Centralized TypeScript types and Zod schemas.
- **Environment Configuration**: Supports environment-specific configurations and auto-detection for Replit development.
- **Deployment**: Configured for Replit Development, Local Development, and Production (Render backend + Vercel frontend + Supabase database + Supabase Storage).
- **File Storage**: Development uses local `uploads/` directory; Production uses Supabase Storage buckets.
- **Build Configuration**: Build tools (vite, esbuild, typescript, tailwindcss) in dependencies for Render deployment compatibility.
- **Cross-Domain Authentication**: Configured with `sameSite: 'none'` cookies and `trust proxy` for secure session sharing.
- **CORS**: Auto-configured for development (Replit domains, localhost, Vercel preview) and production (Render, Vercel, custom `FRONTEND_URL`).
- **Port Configuration**: Vite server with `allowedHosts: true`; Express binds to `0.0.0.0:5000`.
- **Database Migrations**: Automatic, idempotent application on server startup using Drizzle ORM.
- **Data Integrity**: Strategic use of CASCADE DELETE and SET NULL foreign key constraints.

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form.
- **Build Tools**: Vite, TypeScript.
- **UI Framework**: Radix UI primitives, Tailwind CSS.

### Backend Services
- **Database**: Neon PostgreSQL, Supabase PostgreSQL.
- **File Storage**: Supabase Storage.
- **Session Store**: `connect-pg-simple`.
- **Authentication**: Passport.js with `passport-google-oauth20`.

### Data Management
- **Database ORM**: Drizzle ORM.
- **Schema Validation**: Zod.
- **Query Client**: TanStack React Query.
- **Date Handling**: `date-fns`.

## Environment Variables

### Required for Real-time Functionality
To enable real-time synchronization across all connected clients, you need to configure the following environment variables:

- **VITE_SUPABASE_URL**: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
  - This is the public URL for your Supabase project
  - Used by the frontend to establish Realtime connections
  
- **VITE_SUPABASE_ANON_KEY**: Your Supabase anonymous/public API key
  - This is a public key safe to use in the frontend
  - Provides read access and enables Realtime subscriptions
  - Note: This is NOT the service role key (which is kept private on the backend)

These variables should already be set in your Replit environment if you've configured Supabase. If real-time updates are not working, check that both variables are set correctly in the Replit Secrets panel.

### Backend Environment Variables
- **DATABASE_URL**: PostgreSQL connection string (Supabase or Neon)
- **JWT_SECRET**: Secret for JWT token signing
- **SESSION_SECRET**: Secret for Express session encryption
- **SUPABASE_URL**: Same as VITE_SUPABASE_URL but for backend use
- **SUPABASE_SERVICE_KEY**: Service role key for backend operations (private, not exposed to frontend)
