# Treasure-Home School Management System

## Overview

This is a comprehensive school management portal for Treasure-Home School, built as a full-stack web application. The system provides role-based dashboards for students, teachers, administrators, and parents, along with a public-facing website. It manages core school operations including student enrollment, attendance tracking, grade management, announcements, and communication between stakeholders.

The application follows a modern monorepo architecture with shared schema definitions and implements a complete authentication system with role-based access control. The system is designed to handle multiple user types with distinct permissions and interfaces tailored to their specific needs.

## Recent Changes

### September 27, 2025 - Project Import from GitHub Completed
- ✅ Successfully imported project from GitHub repository
- ✅ Analyzed existing project structure (Express + React + PostgreSQL)
- ✅ Verified Vite configuration with proper Replit proxy settings (host: 0.0.0.0, allowedHosts: true)
- ✅ Confirmed database connection to Supabase PostgreSQL 
- ✅ Migrations applied successfully with proper error handling
- ✅ Workflow configured for frontend development with webview output on port 5000
- ✅ Deployment settings configured for autoscale mode
- ✅ Application tested and running successfully with all core features working
- ✅ Homepage loading correctly with school branding and navigation

### September 27, 2025 - Critical Exam Scoring Bug Fix
- 🐛 **Issue Identified**: Students were seeing "Manual grading will be performed" instead of their actual exam scores
- 🔍 **Root Cause**: Database schema mismatch - the `auto_scored` column was missing from the actual `exam_results` table despite being defined in schema
- ⚡ **Solution Implemented**: Modified `getExamResultsByStudent` function in `server/storage.ts` to:
  - Always derive `autoScored` field from `recordedBy` field using SQL CASE expression
  - Fixed `maxScore` calculation by joining with `exams` table to get proper `totalMarks`
  - Used consistent `this.db` instead of module-scoped `db` for better reliability
- ✅ **Technical Details**: Auto-scored exams use sentinel `recordedBy` value `'00000000-0000-0000-0000-000000000001'` to distinguish from manually graded exams
- ✅ **Architect Reviewed**: Changes confirmed to resolve the UI issue and ensure accurate score/percentage calculations
- 📊 **Impact**: Students can now see their automatic exam scores immediately after submission instead of manual grading messages

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