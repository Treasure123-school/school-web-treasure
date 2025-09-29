# Treasure-Home School Management System

## Overview

This is a comprehensive school management portal for Treasure-Home School, built as a full-stack web application. The system provides role-based dashboards for students, teachers, administrators, and parents, along with a public-facing website. It manages core school operations including student enrollment, attendance tracking, grade management, announcements, and communication between stakeholders.

The application follows a modern monorepo architecture with shared schema definitions and implements a complete authentication system with role-based access control. The system is designed to handle multiple user types with distinct permissions and interfaces tailored to their specific needs.

## Recent Changes

### September 29, 2025 - Fresh GitHub Clone Import Completed
- ✅ Successfully set up fresh GitHub clone in Replit environment
- ✅ Verified existing project structure (Express + React + TypeScript + PostgreSQL)
- ✅ Confirmed Vite configuration already properly configured for Replit:
  - Host: 0.0.0.0 (required for Replit proxy)
  - allowedHosts: true (critical for iframe preview)
  - Port: 5000 (only non-firewalled port)
- ✅ Database connection verified (Supabase PostgreSQL via DATABASE_URL)
- ✅ Database migrations applied successfully with idempotency handling
- ✅ Workflow configured and started:
  - Name: "Start application"
  - Command: `npm run dev`
  - Output type: webview (for frontend preview)
  - Port: 5000 with wait_for_port enabled
- ✅ Deployment configuration verified:
  - Target: autoscale (stateless web app)
  - Build: `npm run build` (Vite + ESBuild)
  - Run: `npm run start` (production Express server)
- ✅ Application running and tested:
  - Server started successfully on port 5000
  - Homepage loads with school branding and navigation
  - Vite HMR connected and working
  - No LSP errors detected
- ✅ Environment modules confirmed:
  - nodejs-20 installed
  - postgresql-16 available
  - Integrations: Supabase + Database configured

### September 27, 2025 - Critical Exam Scoring Display Fix
- 🐛 **Issue Identified**: Students were seeing "Manual grading will be performed" instead of their actual exam scores
- 🔍 **Root Cause**: Field name mismatch between frontend and backend - frontend expected `data.result.score` but backend was sending `data.result.totalScore`
- ⚡ **Solution Implemented**: Updated both response paths in `server/routes.ts` submit endpoint:
  - Main success path now sends both `score` and `totalScore` fields for compatibility
  - Rescue/fallback path also fixed with same dual-field pattern
  - Cleaned up duplicate auto-scoring functions to avoid confusion
- ✅ **Technical Details**: Backend was calculating scores correctly but frontend couldn't read them due to field name mismatch
- ✅ **Architect Reviewed**: Changes confirmed to be correct, comprehensive, and secure with no impact on other functionality
- 📊 **Impact**: Students now see their automatic exam scores immediately after submission - the scoring system was already working, just the display was broken

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod schema validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful API endpoints with structured error handling
- **Session Management**: Express sessions with PostgreSQL session store
- **File Serving**: Static file serving with Vite integration in development

### Database Layer
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Centralized schema definitions in shared directory
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Connection pooling with @neondatabase/serverless

### Authentication & Authorization
- **Authentication Strategy**: Custom email/password authentication
- **Session Storage**: Server-side sessions stored in PostgreSQL
- **Role-Based Access**: Four distinct user roles (student, teacher, admin, parent)
- **Client-Side Auth**: React context for authentication state management
- **Route Protection**: Role-based route access control

### Project Structure
- **Monorepo Design**: Client, server, and shared code in single repository
- **Shared Schema**: Common TypeScript types and Zod schemas
- **Path Aliases**: Configured aliases for clean import statements
- **Environment Configuration**: Environment-specific configurations

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form
- **Build Tools**: Vite, TypeScript, ESBuild for production builds
- **UI Framework**: Radix UI primitives, Tailwind CSS, class-variance-authority

### Backend Services
- **Database**: Neon PostgreSQL serverless database
- **Session Store**: connect-pg-simple for PostgreSQL session storage
- **Development**: Replit integration with cartographer and runtime error overlay

### Data Management
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod for runtime type validation
- **Query Client**: TanStack React Query for API state management
- **Date Handling**: date-fns for date manipulation

### Development Tools
- **TypeScript**: Full-stack type safety
- **Linting**: ESLint configuration
- **PostCSS**: CSS processing with Autoprefixer
- **Hot Reload**: Vite HMR for development experience