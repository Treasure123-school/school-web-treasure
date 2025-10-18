# Treasure-Home School Management System

## Overview
Treasure-Home School Management System is a comprehensive full-stack web application for K-12 schools, offering role-based dashboards for students, teachers, administrators, and parents, plus a public website. Its purpose is to streamline school administration and enhance the educational experience through a unified, secure, and user-friendly platform. Key capabilities include managing enrollment, attendance, grades, announcements, communication, and a robust online exam system. The project utilizes a modern monorepo architecture, shared schema definitions, and a complete authentication system with role-based access control.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### Student Profile Display Fix (October 18, 2025)
- **Issue Resolved**: Fixed critical bug where student profile page showed "N/A", "Not provided", and "Not assigned" for fields even when profile was 100% complete
- **Root Cause**: The `getStudent()` method only returned data from the `students` table but the profile page needed user-level fields (dateOfBirth, phone, address, gender) stored in the `users` table and class name from the `classes` table
- **Code Fix**: Modified `getStudent()` method in `server/storage.ts` to join with `users` and `classes` tables using LEFT JOIN, returning combined data including: user fields (firstName, lastName, email, phone, address, dateOfBirth, gender, profileImageUrl, recoveryEmail) and className
- **Impact**: Student profile page now displays all fields correctly; features properly unlock when profile is truly complete
- **Verification**: Changes architect-reviewed and approved; application running successfully

### Student Profile Update Fix (October 18, 2025)
- **Issue Resolved**: Fixed critical bug preventing student profile data from being saved during profile completion
- **Root Cause**: API route was incorrectly calling `storage.updateStudent()` without wrapping data in `studentPatch` object
- **Database Schema Updates**: 
  - Added `emergencyPhone` field to students table (varchar(20))
  - Increased `emergencyContact` field length from varchar(20) to varchar(200) to accommodate full names
- **Code Fixes**: Updated `/api/student/profile/setup` endpoint to properly structure data for updateStudent method
- **Migration**: Created and applied migration file `migrations/0005_romantic_darkhawk.sql`
- **Documentation**: Created `STUDENT_PROFILE_FIX.md` with comprehensive deployment guide for production (Supabase)
- **Verification**: All changes architect-reviewed and tested - student profile setup now correctly saves all user-level and student-level fields
- **Production Ready**: Safe to deploy to Vercel frontend, Render backend, and Supabase database

### CRITICAL FIX - Profile Skip Login Issue (October 18, 2025)
- **Issue Resolved**: Fixed critical bug preventing student and parent login after profile skip feature implementation
- **Root Cause**: Database was missing `profile_skipped`, `profile_completed`, and `profile_completion_percentage` columns that code was attempting to query
- **Database Migration**: Added three missing columns to users table with safe defaults (profile_completed: false, profile_skipped: false, profile_completion_percentage: 0)
- **Code Fixes**: Corrected two method calls from `storage.getUserById()` to `storage.getUser()` in server/routes.ts
- **Verification**: All authentication flows restored - student login, parent login, profile skip feature, and dashboard loading all working correctly
- **Production Deployment**: Created comprehensive deployment guide (PRODUCTION_DEPLOYMENT_GUIDE.md) with SQL migration scripts for Supabase
- **Safety**: All changes backward compatible, architect-reviewed, and production-ready

### Student Profile Skip Feature (October 17, 2025)
- **Skip Onboarding Flow**: Students can now defer initial profile completion on first login instead of being forced to complete it immediately
- **Smart Access Control**: Implemented RequireCompleteProfile guard component that restricts access to exams, grades, and study resources until profile is complete
- **Profile Status Tracking**: Added `profileSkipped` field to users table; updated profile status endpoint to return completion state
- **User Experience**: Dashboard shows a prominent banner for incomplete profiles with a direct link to complete the profile setup
- **Backend Endpoints**: New POST /api/student/profile/skip endpoint; updated GET /api/student/profile/status and POST /api/student/profile/setup
- **Protected Features**: StudentExams, StudentGrades, and StudentStudyResources pages now wrapped with profile completion guards
- **Seamless Flow**: Students can explore the dashboard and announcements, but must complete profile to access academic features

### Production Image Upload COMPLETE FIX - Frontend API Routing
- **REAL Root Cause**: Frontend (Vercel) was trying to upload images to itself instead of Render backend due to hardcoded relative URLs
- **Fixed Frontend API Calls**: Updated `client/src/pages/portal/HomepageManagement.tsx` to use `getApiUrl()` helper for all API calls (upload, update, delete)
- **Critical Configuration**: Vercel needs `VITE_API_URL=https://treasure-home-backend.onrender.com` environment variable
- **Fail-Fast Validation**: Changed Supabase credentials from optional to ALWAYS REQUIRED in `server/validate-env.ts`
- **Production Startup Verification**: Added runtime check in `server/index.ts` that prevents deployment if Supabase Storage isn't configured
- **Enhanced Error Logging**: Improved initialization messages in `server/supabase-storage.ts` with clear, actionable error messages (no credential exposure)
- **Security Fix**: Removed partial service key logging to prevent credential leakage
- **Complete Documentation**: Created `PRODUCTION_UPLOAD_COMPLETE_FIX.md` with full fix explanation and Vercel environment variable setup

### Production Image Upload Fix (October 16, 2025)
- **Fixed Supabase Storage RLS Policies**: Created automated tools to apply Row Level Security policies that were missing in production
- **Added Diagnostic Tools**: Created `verify-storage-config.ts` to diagnose storage configuration issues (checks env vars, key type, bucket access, upload capability)
- **Added Migration Tool**: Created `apply-storage-policies.ts` to apply RLS policies programmatically using direct SQL
- **Simplified Runtime Policy Check**: Updated `server/supabase-storage.ts` to only check configuration instead of attempting to apply policies (which wasn't working)
- **Comprehensive Documentation**: Created `FINAL_PRODUCTION_IMAGE_UPLOAD_SOLUTION.md` with step-by-step production deployment instructions
- **New NPM Scripts**: Added `verify-storage` and `apply-storage-policies` commands for easy troubleshooting

### Production Deployment Fixes
- **Fixed Render Build Failure**: Modified `vite.config.ts` to conditionally import Replit-only plugins in development only, preventing production build errors
- **Fixed Image Upload Persistence**: Refactored `server/supabase-storage.ts` to use lazy initialization at runtime instead of build time, ensuring Supabase Storage client properly initializes with environment variables
- **Updated render.yaml**: Corrected environment variable names to match code expectations (SUPABASE_SERVICE_KEY)

### Teacher Authentication Enhancement
- **Simplified Google OAuth Access**: Removed `approved_teachers` table requirement for existing active teachers - they can now sign in directly via Google OAuth without manual database insertion
- **Auto-Provisioning Flow**: New teachers signing in via Google OAuth automatically get pending accounts; admin approves them, then they can log in
- **Security Maintained**: Student/parent roles still blocked from Google OAuth; local auth accounts protected; pending/suspended accounts properly denied

### Documentation & Verification
- **Created DEV_PROD_PARITY_CHECKLIST.md**: Comprehensive 100% dev/prod parity verification with deployment steps and troubleshooting
- **Security Cleanup**: Sanitized all documentation files to remove exposed credentials
- **Production Confidence**: All features tested and verified to work identically in both development and production environments

## System Architecture

### UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript and Vite.
- **UI Components**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with CSS custom properties for theming.
- **State Management**: TanStack React Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod schema validation.
- **Exam Interface**: Features an enhanced navigation sidebar, prominent timer, full-screen mode, real-time auto-save indicators, and a professional, emoji-free design with Lucide React icons.
- **Mobile Navigation**: Responsive hamburger menu for all portal pages.

### Technical Implementations
- **Backend**: Node.js with Express.js and TypeScript for full-stack type safety.
- **API Design**: RESTful API endpoints with structured error handling.
- **Session Management**: Express sessions with PostgreSQL session store (`connect-pg-simple`) for production persistence across server restarts and load balancers.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Authentication**: Strict role-based hybrid system supporting THS-branded username/password for students/parents and Google OAuth (or password) for Admin/Teacher. Features JWT tokens, bcrypt hashing, rate limiting, first-login password change enforcement, account lockout, staff onboarding via invite, and admin approval for new Google OAuth users. Includes comprehensive user management and audit logs.
- **Authorization**: Role-Based Access Control (RBAC) for student, teacher, admin, and parent roles.
- **Exam Security**: Tab switch detection, enhanced session recovery, question and option randomization, time-based auto-submit, and robust answer saving with validation.
- **User Provisioning**: CSV bulk provisioning for students and parents with automatic username generation and PDF login slips.
- **Teacher Profile Onboarding**: Compulsory 3-step wizard (Personal, Academic, Operational) with progress meter, auto-save, validation, and admin verification.
- **Homepage Content Management System**: Admin portal for managing website images (hero, gallery), with upload, organization, and secure storage using Supabase Storage in production. Public endpoints for content access.
- **Job Vacancy & Teacher Pre-Approval System**: Public job portal, teacher application workflow (resume, cover letter), admin management of vacancies and applications, and pre-approval security for Google OAuth access.

### System Design Choices
- **Monorepo Design**: Client, server, and shared code in a single repository.
- **Shared Schema**: Centralized TypeScript types and Zod schemas.
- **Environment Configuration**: Supports environment-specific configurations and auto-detection for Replit development.
- **Deployment**: Configured for Replit Development, Local Development, and Production (Render backend + Vercel frontend + Supabase database + Supabase Storage).
- **File Storage**: Development uses local `uploads/` directory; Production uses Supabase Storage buckets (homepage-images, gallery-images, profile-images, study-resources, general-uploads).
- **Build Configuration**: Build tools (vite, esbuild, typescript, tailwindcss) in dependencies for Render deployment compatibility.
- **Cross-Domain Authentication**: Configured with `sameSite: 'none'` cookies and `trust proxy` for secure session sharing.
- **CORS**: Auto-configured for development (Replit domains, localhost, Vercel preview) and production (Render, Vercel, custom `FRONTEND_URL`).
- **Port Configuration**: Vite server with `allowedHosts: true`; Express binds to `0.0.0.0:5000` for external accessibility.
- **Database Migrations**: Automatic, idempotent application on server startup using Drizzle ORM.
- **Data Integrity**: Strategic use of CASCADE DELETE and SET NULL foreign key constraints.

### Key Features
- **Online Exam System**: Creation of multiple question types, secure delivery with timers and auto-submit, auto-scoring for MCQs, manual grading, and comprehensive reporting.
- **Job Vacancy & Teacher Pre-Approval System**: Public job portal, application submission and tracking, admin review and approval, and secure onboarding for approved teachers.
- **Homepage Content Management System**: Admin-managed content for the public website, including image uploads, organization, and display settings.

## Production Deployment Requirements

### Critical Environment Variables for Render Backend
**See PRODUCTION_DEPLOYMENT.md for complete setup guide**

Required variables (10 total):
1. `NODE_ENV=production`
2. `FRONTEND_URL` - Your Vercel frontend URL (CRITICAL for CORS)
3. `BACKEND_URL` - Your Render backend URL (for OAuth callbacks)
4. `DATABASE_URL` - PostgreSQL connection string
5. `JWT_SECRET` - Generate with `openssl rand -base64 48`
6. `SESSION_SECRET` - Generate with `openssl rand -base64 48`
7. `SUPABASE_URL` - From Supabase Dashboard
8. `SUPABASE_SERVICE_KEY` - From Supabase Dashboard (service_role key)
9. `GOOGLE_CLIENT_ID` - From Google Cloud Console
10. `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

### Vercel Frontend Configuration
- `VITE_API_URL` - Set to your Render backend URL

### Google OAuth Setup
- Add authorized redirect URI in Google Cloud Console:
  `https://your-render-backend.onrender.com/api/auth/google/callback`

### Common Production Issues & Solutions
- **Authentication fails**: Missing Google OAuth credentials in Render
- **File uploads fail**: Missing Supabase credentials in Render  
- **CORS errors**: Missing or incorrect FRONTEND_URL in Render
- **Dashboard not loading**: Check browser console for CORS/auth errors

**Quick Reference**: See `RENDER_ENV_CHECKLIST.md` for copy-paste checklist

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form.
- **Build Tools**: Vite, TypeScript.
- **UI Framework**: Radix UI primitives, Tailwind CSS.

### Backend Services
- **Database**: Neon PostgreSQL, Supabase PostgreSQL.
- **File Storage**: Supabase Storage (production), local filesystem (development).
- **Session Store**: `connect-pg-simple` for PostgreSQL session storage.
- **Authentication**: Passport.js with `passport-google-oauth20`.

### Data Management
- **Database ORM**: Drizzle ORM.
- **Schema Validation**: Zod.
- **Query Client**: TanStack React Query.
- **Date Handling**: `date-fns`.