# Treasure-Home School Management System

## Overview
Treasure-Home School Management System is a comprehensive full-stack web application designed for K-12 schools. It provides role-based dashboards for students, teachers, administrators, and parents, alongside a public-facing website. The system aims to streamline school administration and enrich the educational experience through a unified, secure, and user-friendly platform. Key functionalities include managing enrollment, attendance, grades, announcements, communication, and a robust online exam system. The project is built on a modern monorepo architecture, utilizing shared schema definitions and a complete authentication system with role-based access control.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **UI Components**: Shadcn/ui library built on Radix UI primitives.
- **Styling**: Tailwind CSS with CSS custom properties for theming.
- **State Management**: TanStack React Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod schema validation.
- **Exam Interface**: Features an enhanced navigation sidebar, prominent timer, full-screen mode, real-time auto-save indicators, and a professional, emoji-free design with Lucide React icons.
- **Mobile Navigation**: Responsive hamburger menu for all portal pages.

### Technical Implementations
- **Backend**: Node.js with Express.js.
- **Language**: TypeScript for full-stack type safety.
- **API Design**: RESTful API endpoints with structured error handling.
- **Session Management**: Express sessions with PostgreSQL session store.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Authentication**: Strict role-based hybrid system:
    - Students/Parents: THS-branded username/password.
    - Admin/Teacher: Google OAuth (or password if authProvider='local').
    - Backend enforces `authProvider` validation.
    - JWT tokens (24hr expiry), bcrypt password hashing (12 rounds), rate limiting.
    - First-login password change enforcement, account lockout, staff onboarding via invite system.
    - Admin approval workflow for new Google OAuth users.
    - Comprehensive User Management for admin actions (Approve, Suspend, Delete, Change Role, etc.) with Audit Logs.
    - Parent-child linking.
- **Authorization**: Role-Based Access Control (RBAC) for student, teacher, admin, and parent roles.
- **Exam Security**: Tab switch detection, enhanced session recovery, question and option randomization, and time-based auto-submit. Includes robust answer saving with question, option, and session validation.
- **User Provisioning**: CSV bulk provisioning for students and parents with automatic username generation and PDF login slips.
- **Teacher Profile Onboarding**: Compulsory 3-step wizard (Personal, Academic, Operational) with progress meter, auto-save, validation, and admin verification.

### System Design Choices
- **Monorepo Design**: Client, server, and shared code in a single repository.
- **Shared Schema**: Centralized TypeScript types and Zod schemas for consistency.
- **Environment Configuration**: Supports environment-specific configurations.
- **Deployment**: Configured for autoscale deployment with Replit or production deployment to Render/Vercel.
  - **Production Setup**: Render (backend) + Vercel (frontend) + Supabase (database)
  - **Cross-Domain Authentication**: Configured with `sameSite: 'none'` cookies and `trust proxy` for secure session sharing
  - **CORS**: Properly configured to allow credentials between Render and Vercel domains
- **Database Migrations**: Automatic, idempotent application on server startup using Drizzle ORM.
- **Data Integrity**: Strategic use of CASCADE DELETE and SET NULL foreign key constraints for efficient user deletion and audit trail preservation.

### Key Features
- **Online Exam System**:
    - **Creation**: Multiple question types.
    - **Delivery**: Countdown timer, auto-save, tab-switch detection, auto-submit, and secure answer submission.
    - **Scoring**: Auto-scoring for MCQs/true/false, manual grading for essays, score merging.
    - **Reporting**: Report cards combining test and exam scores, comprehensive analytics.

- **Job Vacancy & Teacher Pre-Approval System**:
    - **Public Job Portal**: Accessible at `/job-vacancy` with active vacancy listings and application form.
    - **Teacher Applications**: Resume upload, cover letter submission, and qualification tracking.
    - **Admin Management**: Dedicated portal at `/portal/admin/job-vacancies` for creating vacancies and reviewing applications.
    - **Pre-Approval Security**: Google OAuth restricted to teachers approved through the application system.
    - **Application Workflow**: Submit → Admin Review → Approve/Reject → Auto-add to approved_teachers table.
    - **Vacancy Lifecycle**: Create (open) → Close → Remove from public listing.
    - **Notifications**: Automated notifications for admins on new applications and applicants on approval.

## Recent Changes (October 2025)

### Authentication Fix for Render + Vercel Deployment
- ✅ Fixed cross-domain authentication issues between Render (backend) and Vercel (frontend)
- ✅ Added `trust proxy` setting for Render's reverse proxy
- ✅ Configured session cookies with `sameSite: 'none'` for cross-domain support
- ✅ Enhanced CORS configuration with explicit headers and exposed `Set-Cookie`
- ✅ Updated Google OAuth callback URL to use `BACKEND_URL` environment variable
- ✅ Created comprehensive deployment guides (see `RENDER_VERCEL_DEPLOYMENT_GUIDE.md` and `AUTHENTICATION_FIX_SUMMARY.md`)

### Environment Variables for Production
**Render Backend:**
- `DATABASE_URL`: Supabase connection string
- `JWT_SECRET`: Secure secret key for JWT tokens
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `BACKEND_URL`: Render backend URL (e.g., https://your-backend.onrender.com)
- `FRONTEND_URL`: Vercel frontend URL (e.g., https://your-app.vercel.app)
- `NODE_ENV=production`, `PORT=10000`

**Vercel Frontend:**
- `VITE_API_URL`: Render backend URL (e.g., https://your-backend.onrender.com)

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form.
- **Build Tools**: Vite, TypeScript.
- **UI Framework**: Radix UI primitives, Tailwind CSS.

### Backend Services
- **Database**: Neon PostgreSQL serverless database, Supabase PostgreSQL.
- **Session Store**: `connect-pg-simple` for PostgreSQL session storage.
- **Authentication**: Passport.js with `passport-google-oauth20`.

### Data Management
- **Database ORM**: Drizzle ORM.
- **Schema Validation**: Zod.
- **Query Client**: TanStack React Query.
- **Date Handling**: `date-fns`.

### Development Tools
- **Linting**: ESLint.
- **CSS Processing**: PostCSS with Autoprefixer.