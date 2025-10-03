# Treasure-Home School Management System

## Overview
Treasure-Home School Management System is a comprehensive full-stack web application designed for K-12 schools. It provides role-based dashboards for students, teachers, administrators, and parents, alongside a public-facing website. The system manages core school operations such as student enrollment, attendance tracking, grade management, announcements, and communication. It features a modern monorepo architecture with shared schema definitions and a complete authentication system with role-based access control, ensuring distinct permissions and tailored interfaces for various user types. The system includes a robust exam management system with creation, delivery, auto-scoring, manual grading, and secure features like tab-switching detection and question randomization.

## Recent Changes
- **October 3, 2025**: Fresh GitHub Import Successfully Configured for Replit Environment
  - ✅ Verified Node.js 20 module already installed
  - ✅ Confirmed all npm dependencies already installed (Express, Vite, React, Drizzle ORM, etc.)
  - ✅ Verified Vite configuration with Replit-specific settings:
    - Host: 0.0.0.0 (required for Replit proxy)
    - Port: 5000 (only non-firewalled port)
    - allowedHosts: true (enables Replit iframe proxy)
  - ✅ Workflow "Start application" properly configured:
    - Command: npm run dev
    - Output type: webview
    - Port: 5000
  - ✅ Database connection verified to Supabase PostgreSQL via DATABASE_URL
  - ✅ Deployment configuration confirmed for autoscale:
    - Build: npm run build
    - Run: npm run start
  - ✅ Application running successfully on port 5000
  - ✅ Database migrations applied (idempotent - already existed)
  - ✅ Public website homepage verified functional
  - ✅ Portal login accessible
  - ✅ Background cleanup service running for exam sessions
  - Note: Google OAuth requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables for admin/teacher login

- **October 2, 2025**: Completed Google OAuth Integration for Admin/Teacher Login
  - ✅ Hybrid authentication system: THS-branded credentials for students/parents, Google OAuth for admin/teacher
  - ✅ Database schema extended: Added `authProvider` (varchar) and `googleId` (varchar) columns to users table
  - ✅ Google OAuth strategy implemented using Passport.js with passport-google-oauth20
  - ✅ OAuth routes configured: `/api/auth/google` (initiate) and `/api/auth/google/callback` (handle response)
  - ✅ Role selection dialog for new OAuth users to choose Admin or Teacher role
  - ✅ THS-branded username auto-generation for OAuth users (e.g., THS-ADM-2025-001, THS-TCH-2025-042)
  - ✅ Error handling for email conflicts: Prevents OAuth login if email already exists with password authentication
  - ✅ Storage methods added: `getUserByGoogleId`, `createUserWithGoogle`, `updateUserGoogleId`
  - ✅ Login page updated with "Sign in with Google (Admin/Teacher)" button
  - ✅ Session-based pendingUser flow for OAuth signup completion
  - ✅ Graceful error messages displayed to users for all OAuth failure scenarios
  - ✅ Architect-approved implementation with proper security and error handling
  - Note: Requires Google OAuth credentials (CLIENT_ID, CLIENT_SECRET) to be configured in environment variables

- **October 2, 2025**: GitHub project successfully imported and configured for Replit environment
  - ✅ Verified all dependencies installed (Node.js 20, all npm packages)
  - ✅ Confirmed Vite configuration with Replit-specific settings (host: 0.0.0.0, port: 5000, allowedHosts: true)
  - ✅ Workflow "Start application" configured with webview output on port 5000
  - ✅ Database connected to Supabase PostgreSQL via DATABASE_URL
  - ✅ Deployment configured for autoscale with proper build and run commands
  - ✅ Application verified running successfully - homepage, login portal, and all routes functional
  - ✅ Migrations applied successfully, all tables operational
  - ✅ Background cleanup service running for exam sessions

- **October 2, 2025**: Completed Chapter 1 - Foundation Authentication System with THS-Branded Credentials
  - ✅ Database schema updated: added `username` (unique varchar 50) and `must_change_password` (boolean) columns to users table
  - ✅ Password reset tokens table: Added with expiry tracking (15-minute timeout) and one-time use validation
  - ✅ THS-branded username generation: Formats like THS-STU-2025-001, THS-TCH-2025-PR3-042, THS-PAR-2025-010
  - ✅ Strict username validation: Enforces numeric suffixes, valid role codes (ADM/TCH/STU/PAR), 4-digit years
  - ✅ Cryptographically secure password generation: 12 characters using crypto.randomBytes (~3.2×10²¹ combinations)
  - ✅ Password format: THS@2025#aB3k9Mx2Pq7R (16+ total characters with upper/lower/digits/special chars)
  - ✅ First-login password change enforcement with frontend dialog
  - ✅ Login system supports both username and email authentication
  - ✅ Password reset flow: Request reset token (POST /api/auth/forgot-password), verify and reset (POST /api/auth/reset-password)
  - ✅ Admin emergency password reset: POST /api/admin/reset-user-password for immediate password resets
  - ✅ CSV bulk provisioning: Upload CSV to create multiple students and parents with automatic THS-branded username generation
  - ✅ Parent-child linking: Automatically established during CSV upload using parentId foreign key
  - ✅ Username uniqueness tracking: Prevents duplicate THS-prefixed usernames within batch uploads
  - ✅ Multer configuration: Separate uploadCSV instance for CSV file uploads (2MB limit)
  - ✅ PDF login slips generation for printable credential distribution
  - ✅ Password change endpoint with proper validation and security
  - ✅ Parent multi-child access support via existing API endpoint
  - ✅ Rate limiting implemented (in-memory, documented for future Redis/Supabase migration)
  - All data stored in Supabase PostgreSQL database
  - All security issues identified and fixed, architect-approved

- **October 1, 2025**: Completed comprehensive online exam system implementation
  - ✅ Mobile-responsive navigation with hamburger menu across all pages
  - ✅ Teacher/Admin exam creation UI (ExamManagement.tsx) with MCQ, essay, and short answer support
  - ✅ Student exam taking page (StudentExams.tsx) with timer, autosave, tab detection, and auto-submit
  - ✅ Teacher grading queue (TeacherGradingQueue.tsx) for manual grading of essays and text answers
  - ✅ Auto-scoring system for objective questions (MCQ, true/false)
  - ✅ Score merging logic combining auto-scored and manually-graded questions
  - ✅ Report card generation with Test 40% + Exam 60% = Total 100% weighting
  - ✅ Student report card viewing page (StudentReportCard.tsx) with PDF export
  - ✅ Parent report card viewing page (ParentReportCards.tsx) for multiple children
  - ✅ Exam analytics and reporting dashboard (ExamReports.tsx)
  - Database schema verified with proper report_cards and report_card_items tables
  - Application running successfully on port 5000 with no errors
  
- **October 1, 2025**: Project successfully imported from GitHub and configured for Replit environment
  - Verified Vite configuration with proper Replit settings (host: 0.0.0.0, port: 5000, allowedHosts: true)
  - Configured workflow to run frontend on port 5000 with webview output
  - Verified database connection to Supabase PostgreSQL
  - Deployment configured for autoscale with proper build and run commands
  - Application running successfully with public website and portal login accessible

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Online Exam System Features
- **Exam Creation**: Teachers/admins can create exams with multiple question types (MCQ, essay, short answer, true/false, fill-in-blank)
- **Exam Delivery**: Students take exams with countdown timer, auto-save every 30 seconds, tab-switch detection, and auto-submit on timeout
- **Auto-Scoring**: MCQs and true/false questions are automatically scored upon submission
- **Manual Grading**: Essays and text answers are queued for teacher review with detailed grading interface
- **Score Merging**: Combined scores from auto-graded and manually-graded questions
- **Report Cards**: Test scores (40%) and exam scores (60%) are combined for final grades with professional formatting
- **Analytics**: Comprehensive exam reports with class performance, grade distribution, and student-level analytics
- **Security Features**: Tab-switch detection, session recovery, question randomization, time-based auto-submit

### UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript.
- **Build Tool**: Vite for fast development and optimized builds.
- **UI Components**: Shadcn/ui component library built on Radix UI primitives.
- **Styling**: Tailwind CSS with CSS custom properties for theming.
- **State Management**: TanStack React Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod schema validation.
- **Exam Interface**: Enhanced navigation sidebar, prominent timer with visual warnings, full-screen mode, and real-time auto-save indicators.
- **Mobile Navigation**: Responsive hamburger menu for all portal pages on mobile devices.

### Technical Implementations
- **Backend**: Node.js with Express.js.
- **Language**: TypeScript for full-stack type safety.
- **API Design**: RESTful API endpoints with structured error handling.
- **Session Management**: Express sessions with PostgreSQL session store.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Authentication**: Hybrid system - THS-branded username/password for students/parents, Google OAuth for admin/teacher, with server-side sessions and PostgreSQL storage.
- **Authorization**: Role-Based Access Control (RBAC) for student, teacher, admin, and parent roles.
- **Exam Security**: Tab switch detection, enhanced session recovery, question and option randomization, and time-based auto-submit.

### System Design Choices
- **Monorepo Design**: Client, server, and shared code in a single repository.
- **Shared Schema**: Centralized TypeScript types and Zod schemas for consistency.
- **Environment Configuration**: Supports environment-specific configurations.
- **Deployment**: Configured for autoscale deployment with `npm run build` and `npm run start` commands.

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form.
- **Build Tools**: Vite, TypeScript, ESBuild.
- **UI Framework**: Radix UI primitives, Tailwind CSS.

### Backend Services
- **Database**: Neon PostgreSQL serverless database.
- **Session Store**: `connect-pg-simple` for PostgreSQL session storage.

### Data Management
- **Database ORM**: Drizzle ORM.
- **Schema Validation**: Zod.
- **Query Client**: TanStack React Query.
- **Date Handling**: `date-fns`.

### Development Tools
- **Linting**: ESLint.
- **CSS Processing**: PostCSS with Autoprefixer.
- **Hot Reload**: Vite HMR.

## Project Status
The Treasure-Home School Management System is **feature-complete** with all core functionalities operational:
- Public website and portal authentication
- Student, teacher, admin, and parent dashboards
- Online exam system (creation, delivery, auto-scoring, manual grading, report cards)
- Mobile-responsive navigation
- Report card generation with weighted scoring (Test 40% + Exam 60%)
- Analytics and reporting
- Background cleanup services for expired exam sessions

Ready for production deployment.
