# Treasure-Home School Management System

## Overview
Treasure-Home is a full-stack web application for K-12 schools, providing role-based dashboards for students, teachers, administrators, and parents, plus a public website. Its core purpose is to streamline school administration and enhance the educational experience through a unified, secure, and user-friendly platform. Key capabilities include managing enrollment, attendance, grades, announcements, communication, and a robust online exam system. The project uses a modern monorepo architecture, shared schema definitions, and a comprehensive authentication system with role-based access control.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (October 2025)
- **Automatic Account Activation**: Removed manual approval requirement for new user accounts. All new users are now automatically activated with status set to 'active' upon registration, eliminating the need for admin approval. The PendingApprovals page and related approval endpoints have been removed from the system.
- **Unified Login System**: Removed separate SuperAdminLogin page. All users (students, teachers, admins, parents, and super admins) now use the single unified login page at `/login`. The system automatically routes users to their appropriate portal based on their role after authentication.
- **Automatic Roles Seeding**: Added automatic creation of all required roles (Super Admin, Admin, Teacher, Student, Parent) on server startup. All roles are created with appropriate permissions if they don't exist, ensuring admin creation always works.
- **Automatic Super Admin Seeding**: Added automatic super admin account creation on server startup. The super admin user is created if it doesn't exist, with secure password requirements and mandatory password change on first login.
- **Security Enhancement**: Improved password logging security - credentials are never logged in plaintext after initial setup.
- **Password Change Enforcement**: All newly created users (admins, teachers, students, parents) are now required to change their password on first login. This applies to users created through any method: invites, CSV import, manual creation, or bulk provisioning. The `mustChangePassword` flag is automatically set to `true` for all new accounts to ensure maximum security.

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