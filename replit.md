# Treasure-Home School Management System

## Overview
Treasure-Home is a full-stack web application designed for K-12 schools, offering role-based dashboards for students, teachers, administrators, and parents, alongside a public website. Its primary goal is to streamline school administration and enrich the educational experience through a unified, secure, and user-friendly platform. The system manages enrollment, attendance, grades, announcements, communication, and includes a robust online exam system. The project features a modern monorepo architecture, shared schema definitions, and a comprehensive authentication system with role-based access control.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### Portal Dashboard Redesign - Modern Student Portal Style (October 19, 2025)
- **Change Made**: Complete visual redesign of Super Admin, Admin, Teacher, and Parent portal dashboards to match the modern student portal design pattern
- **Motivation**: User requested all portals to be styled like the student portal - simple, professional, and modern with gradient cards and animations
- **Key Changes**:
  1. **Modern Gradient Stats Cards**: Replaced legacy `StatsCard` components with modern gradient cards featuring AnimatedCounter components
  2. **Professional Animations**: Added smooth hover transitions, scale effects, and slide-up animations
  3. **Visual Consistency**: All portals now share the same design language - gradient backgrounds, shadow-xl effects, rounded corners
  4. **Responsive Design**: Maintained fully responsive layouts across mobile, tablet, and desktop breakpoints
- **Updated Portals**:
  - **Super Admin**: Gradient cards with AnimatedCounter for system-wide stats (users, schools, system health)
  - **Admin**: Modern blue/emerald/purple/amber gradient cards for students, teachers, classes, attendance stats
  - **Teacher**: Gradient cards for total students, classes, exams, and pending grades
  - **Parent**: Modern cards for children count, attendance, GPA, and messages
- **Design Pattern Features**:
  - `border-none shadow-xl hover:shadow-2xl` for professional card depth
  - `hover:-translate-y-1` for subtle lift effect on hover
  - `bg-gradient-to-br from-{color}-500 via-{color}-600 to-{color}-600` for vibrant gradients
  - `AnimatedCounter` component for smooth number animations
  - `bg-white/20 backdrop-blur-sm rounded-2xl` for icon backgrounds
- **Files Modified**: `client/src/pages/portal/SuperAdminDashboard.tsx`, `client/src/pages/portal/AdminDashboard.tsx`, `client/src/pages/portal/TeacherDashboard.tsx`, `client/src/pages/portal/ParentDashboard.tsx`
- **Impact**: Unified, professional, and modern design across all portal dashboards with consistent user experience
- **Verification**: Architect-reviewed and approved; application running successfully on port 5000

### Username Structure Simplification (October 19, 2025)
- **Change Made**: Completely redesigned the username generation system to use a simplified, shorter format across all user roles
- **Motivation**: User requested shorter, more user-friendly usernames that are still unique and identifiable by role
- **New Username Format**:
  - Students: `THS-STU-###` (e.g., THS-STU-021)
  - Parents: `THS-PAR-###` (e.g., THS-PAR-012)
  - Teachers: `THS-TCH-###` (e.g., THS-TCH-005)
  - Admins: `THS-ADM-###` (e.g., THS-ADM-001)
- **Old Username Format** (deprecated but still supported for backwards compatibility):
  - Students: `THS-STU-2025-PR3-001`
  - Parents: `THS-PAR-2025-001`
  - Teachers: `THS-TCH-2025-MTH-002`
  - Admins: `THS-ADM-2025-001`
- **Technical Implementation**:
  1. **Schema Update**: Modified `counters` table to support role-based sequential numbering (`roleCode` column)
  2. **Username Generator**: Completely rewrote `server/username-generator.ts` with new simplified generation functions for all roles
  3. **Auth Utils**: Updated `server/auth-utils.ts` to support both old and new username formats
  4. **Validation**: Both old and new username formats are accepted during login for backwards compatibility
  5. **CSV Import**: Updated `server/csv-import-service.ts` to use new simplified username generation
  6. **Database Migration**: Automatic roleCode column addition on server startup via SQL
  7. **Migration Script**: Created `server/migrate-usernames.ts` (ESM-compatible) to update existing usernames
- **Key Features**:
  - Atomic counter-based sequential numbering using PostgreSQL ON CONFLICT for race-condition safety
  - No more year or class code in usernames - just role prefix + sequential number
  - All username generation functions work consistently across roles
  - Existing users can still login with old format usernames
- **Files Modified**: `shared/schema.ts`, `server/username-generator.ts`, `server/auth-utils.ts`, `server/csv-import-service.ts`, `server/routes.ts`, `server/index.ts`, `server/migrate-usernames.ts`
- **Impact**: Significantly shorter, cleaner usernames that are easier for users to remember and type while maintaining uniqueness and role identification
- **Migration Status**: Database schema updated, new username generation active, old format still supported for login

### Student Exam Interface Redesign (October 18, 2025)
- **Change Made**: Completely redesigned the student exam-taking interface to be simple, clean, and minimalist
- **Motivation**: User requested a lighter, simpler exam page without heavy blue boxes or complex portal header - "fine and simple, not too heavy looking"
- **Key Changes**:
  1. **Standalone Full Page**: Removed PortalLayout wrapper from active exam view - exam now displays on its own full page
  2. **Simplified Header**: Clean header showing only "Treasure-Home School - Online Examination Portal" with school logo
  3. **Minimal Progress Indicator**: Replaced heavy progress cards with small text line showing "Question X of Y" and timer
  4. **Clean Question Display**: Removed blue rectangle boxes, now using simple white card with minimal borders
  5. **Streamlined Navigation**: Simple Previous/Next buttons with small question grid at bottom for quick navigation
  6. **Removed Complexity**: Eliminated sidebar, welcome header, and complex progress visualizations during exam
- **Files Modified**: `client/src/pages/portal/StudentExams.tsx`
- **Impact**: Much cleaner, less distracting exam experience that focuses on the questions; easier to use and less visually overwhelming
- **Technical Note**: Fixed JSX syntax errors caused by duplicate code block (368 lines) that was preventing compilation

### UI Color Scheme Simplification (October 18, 2025)
- **Change Made**: Replaced all blue-purple and blue-indigo gradient combinations with simple blue-only gradients across the entire application
- **Motivation**: User requested a cleaner, simpler look that is "fine and simple, not too heavy looking" to match the hero section's blue gradient styling
- **Scope**: Updated gradients in all portal dashboards (Student, Teacher, Parent, Admin), profile pages, login/onboarding pages, and public homepage
- **Details**:
  - Dark gradients: Changed from `from-blue-600 to-purple-600` → `from-blue-600 to-blue-700`
  - Light backgrounds: Changed from `from-blue-50 to-indigo-50` → `from-blue-50 to-blue-100`
  - Header text: Changed from `from-blue-600 to-purple-600` → `from-blue-600 to-blue-700`
  - Updated both light and dark mode variants
  - Preserved other color schemes (orange, green, yellow, emerald, teal) that were intentionally different
- **Files Modified**: PortalLayout, StudentDashboard, ParentDashboard, StudentProfileSetup, TeacherProfileSetup, Login, StudentExams, TeacherProfile, ParentReportCards, StudentReportCard, Home, ForgotPassword, ProfileOnboarding
- **Impact**: Cleaner, more cohesive blue color scheme throughout the application without purple/indigo mixing
- **Verification**: Architect-reviewed and approved; confirmed no blue-purple/indigo gradient tokens remain via repo-wide search

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