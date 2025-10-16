# Treasure-Home School Management System

## Overview
Treasure-Home School Management System is a comprehensive full-stack web application for K-12 schools, offering role-based dashboards for students, teachers, administrators, and parents, plus a public website. Its purpose is to streamline school administration and enhance the educational experience through a unified, secure, and user-friendly platform. Key capabilities include managing enrollment, attendance, grades, announcements, communication, and a robust online exam system. The project utilizes a modern monorepo architecture, shared schema definitions, and a complete authentication system with role-based access control.

## User Preferences
Preferred communication style: Simple, everyday language.

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