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
- **Deployment**: Configured for three deployment modes:
  - **Replit Development**: Auto-configured with `REPLIT_DEV_DOMAIN` detection, binds to `0.0.0.0:5000`
  - **Local Development**: Full-stack on localhost, CORS pre-configured for `localhost:5000` and `localhost:5173`
  - **Production Setup**: Render (backend) + Vercel (frontend) + Supabase (database)
  - **Cross-Domain Authentication**: Configured with `sameSite: 'none'` cookies and `trust proxy` for secure session sharing
  - **CORS**: Auto-configured for all environments:
    - Development: Replit domains (`*.replit.dev`), localhost, Vercel preview
    - Production: Render (`*.render.com`), Vercel (`*.vercel.app`), custom FRONTEND_URL
- **Port Configuration**: 
  - Vite server with `allowedHosts: true` for Replit dev URL access
  - Express binds to `0.0.0.0:5000` for external accessibility
  - Port 5000 → 80 mapping in `.replit` for public access
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

- **Homepage Content Management System**:
    - **Admin Portal**: Dedicated page at `/portal/admin/homepage-management` for managing website images.
    - **Image Upload**: Upload hero images, gallery previews, and other homepage content with alt text and captions.
    - **Content Organization**: Set display order and toggle active/inactive status for each content item.
    - **Secure Storage**: Images stored in `uploads/homepage/` directory with 5MB size limit.
    - **API Endpoints**: Full CRUD operations (POST, GET, PUT, DELETE) with admin-only authentication.
    - **Content Types**: Support for hero images, gallery previews, and other homepage sections.

## Recent Changes (October 2025)

### Google OAuth Frontend Redirect Fix (October 15, 2025 - Latest)
- ✅ **CRITICAL FIX**: Fixed Google OAuth redirecting to production Vercel URL in Replit development
- ✅ Updated OAuth callback frontend redirect to be environment-aware (`server/routes.ts` line 2343-2351):
  - Development (Replit): Redirects to `REPLIT_DEV_DOMAIN` after OAuth success
  - Production (Render/Vercel): Redirects to `FRONTEND_URL` (Vercel production URL)
  - Local: Falls back to localhost
- ✅ Added console logging to track OAuth redirect URLs for debugging
- ✅ **Result**: Replit development now stays within Replit; Production uses proper Vercel + Render separation

### Environment Configuration Fix (October 15, 2025)
- ✅ **CRITICAL FIX**: Resolved development environment incorrectly using Render production URLs
- ✅ Fixed Google OAuth callback URL to prioritize Replit domain in development:
  - Development (Replit): Uses `REPLIT_DEV_DOMAIN` for OAuth callbacks
  - Production (Render): Uses `BACKEND_URL` for OAuth callbacks
  - Local: Uses localhost for OAuth callbacks
- ✅ Updated `vite.config.ts` to auto-configure VITE_API_URL:
  - Development: Uses empty string (same-origin requests)
  - Production: Uses VITE_API_URL env var (Render backend URL)
- ✅ Enhanced CORS configuration to allow 127.0.0.1 origins for Replit iframe access
- ✅ Created comprehensive environment configuration documentation
- ✅ **Result**: Development now correctly uses Replit URLs; Production uses Vercel + Render

### Homepage Image Upload Fix (October 15, 2025)
- ✅ Fixed multer error handling to return proper JSON responses
- ✅ Fixed authentication token validation in upload components
- ✅ Added error handling middleware for file upload errors (size limits, file types)
- ✅ Enhanced token validation to prevent "Bearer null/undefined" headers
- ✅ Created comprehensive fix documentation (HOMEPAGE_IMAGE_UPLOAD_FIX.md)

### Homepage Management Feature (October 15, 2025)
- ✅ Implemented complete homepage content management system for admins
- ✅ Added secure API endpoints with admin-only authentication:
  - POST /api/upload/homepage - Upload homepage images with metadata
  - GET /api/homepage-content - Retrieve homepage content (admin-only)
  - PUT /api/homepage-content/:id - Update content metadata
  - DELETE /api/homepage-content/:id - Remove content
- ✅ Configured multer for homepage image uploads (5MB limit, uploads/homepage directory)
- ✅ Added "Homepage Management" link to admin navigation sidebar
- ✅ Integrated with existing HomepageManagement.tsx page for UI
- ✅ Security verified: All endpoints protected with authenticateUser + authorizeRoles(ROLES.ADMIN)

### Application Setup and Verification (October 15, 2025 - Latest)
- ✅ Installed all npm dependencies (578 packages) including tsx, vite, and production dependencies
- ✅ Verified all critical environment variables are set and working:
  - DATABASE_URL, JWT_SECRET, SESSION_SECRET: ✅ Confirmed set
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: ✅ Confirmed set (OAuth enabled per logs)
  - BACKEND_URL, FRONTEND_URL: ✅ Confirmed set
- ✅ Confirmed database connection and system initialization (from startup logs):
  - PostgreSQL 17.6 connection established to Supabase
  - 3 academic terms seeded successfully
  - Google OAuth authentication enabled
  - Background services confirmed running:
    * Auto-publish service: Checking scheduled exams every 1 minute
    * Timeout cleanup service: Cleaning expired sessions every 3 minutes
- ✅ Configured VM deployment for Replit:
  - Build command: `npm run build`
  - Run command: `npm run start`
  - Deployment target: VM (stateful, always-running)
- ✅ Verified application running successfully:
  - Server running on port 5000
  - Frontend displaying correctly with full navigation and homepage content

### Deployment Configuration Update (October 15, 2025)
- ✅ Enhanced CORS configuration to support Replit development, localhost, and production
- ✅ Auto-detection of Replit environment using `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS`
- ✅ Added support for three deployment modes: Replit, localhost, and Render+Vercel
- ✅ Updated environment variable configuration with clear separation for dev/prod
- ✅ Created comprehensive deployment guide (see `DEPLOYMENT_SETUP_GUIDE.md`)
- ✅ Verified Vite `allowedHosts: true` configuration for Replit dev URL access
- ✅ Port configuration optimized for both local and Replit development

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