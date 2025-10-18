# Treasure-Home School Management System

## Overview
Treasure-Home is a full-stack web application designed for K-12 schools, offering role-based dashboards for students, teachers, administrators, and parents, alongside a public website. Its primary goal is to streamline school administration and enrich the educational experience through a unified, secure, and user-friendly platform. The system manages enrollment, attendance, grades, announcements, communication, and includes a robust online exam system. The project features a modern monorepo architecture, shared schema definitions, and a comprehensive authentication system with role-based access control.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### Student Profile Display & Authentication Fix (October 18, 2025)
- **Issue Resolved**: Fixed critical bug where student profile page showed "N/A", "Not provided", and "Not assigned" for all fields even when profile was 100% complete, and profile page returned 401 Unauthorized errors
- **Root Causes**:
  1. Backend: The `getStudent()` method only returned data from the `students` table but the profile page needed user-level fields (dateOfBirth, phone, address, gender) stored in the `users` table and class name from the `classes` table
  2. Frontend: The StudentProfile component was using raw `fetch()` without Authorization header instead of the `apiRequest()` helper that includes the JWT token
- **Code Fixes**:
  1. Modified `getStudent()` method in `server/storage.ts` to join with `users` and `classes` tables using LEFT JOIN, returning combined data including: user fields (firstName, lastName, email, phone, address, dateOfBirth, gender, profileImageUrl, recoveryEmail) and className
  2. Updated `client/src/pages/portal/StudentProfile.tsx` to use `apiRequest()` instead of raw `fetch()` for all API calls (data fetching and profile updates)
- **Impact**: Student profile page now displays all fields correctly, authenticates properly, and features unlock correctly when profile is truly complete
- **Verification**: Changes architect-reviewed and approved; application running successfully

## System Architecture

### UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript and Vite.
- **UI Components**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with CSS custom properties for theming.
- **State Management**: TanStack React Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod schema validation.
- **Exam Interface**: Features an enhanced navigation sidebar, prominent timer, full-screen mode, real-time auto-save indicators, and a professional design with Lucide React icons.
- **Mobile Navigation**: Responsive hamburger menu for all portal pages.

### Technical Implementations
- **Backend**: Node.js with Express.js and TypeScript.
- **API Design**: RESTful API endpoints with structured error handling.
- **Session Management**: Express sessions with PostgreSQL session store (`connect-pg-simple`).
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Authentication**: Role-based hybrid system supporting username/password for students/parents and Google OAuth (or password) for Admin/Teacher. Features JWT tokens, bcrypt hashing, rate limiting, and account lockout. Includes user management and audit logs.
- **Authorization**: Role-Based Access Control (RBAC) for student, teacher, admin, and parent roles.
- **Exam Security**: Tab switch detection, session recovery, question/option randomization, time-based auto-submit, and robust answer saving with validation.
- **User Provisioning**: CSV bulk provisioning for students and parents with automatic username generation and PDF login slips.
- **Teacher Profile Onboarding**: Compulsory 3-step wizard (Personal, Academic, Operational) with progress meter, auto-save, validation, and admin verification.
- **Homepage Content Management System**: Admin portal for managing website images (hero, gallery) with upload, organization, and secure storage using Supabase Storage in production. Public endpoints for content access.
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