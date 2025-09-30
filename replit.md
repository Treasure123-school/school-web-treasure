# Treasure-Home School Management System

## Overview

This is a comprehensive school management portal for Treasure-Home School, built as a full-stack web application. The system provides role-based dashboards for students, teachers, administrators, and parents, along with a public-facing website. It manages core school operations including student enrollment, attendance tracking, grade management, announcements, and communication between stakeholders.

The application follows a modern monorepo architecture with shared schema definitions and implements a complete authentication system with role-based access control. The system is designed to handle multiple user types with distinct permissions and interfaces tailored to their specific needs.

## Recent Changes

### September 30, 2025 - Fresh GitHub Clone Import Successfully Configured
- ✅ Successfully imported and configured fresh GitHub clone in Replit environment
- ✅ Verified all existing project configurations are Replit-compatible:
  - Express + React + TypeScript + PostgreSQL stack confirmed working
  - Vite configuration already has `allowedHosts: true` (line 34 in vite.config.ts)
  - Server configured with `host: "0.0.0.0"` and port 5000 (server/index.ts lines 147-149)
  - Both dev and production configurations properly set
- ✅ Database connection validated:
  - Supabase PostgreSQL connected via DATABASE_URL
  - Migrations applied successfully with idempotency handling
  - Connection pooling configured (max=20, idle_timeout=300s)
- ✅ Workflow properly configured:
  - Name: "Start application"
  - Command: `npm run dev`
  - Output type: webview
  - Port: 5000 with wait_for_port enabled
- ✅ Deployment configuration confirmed:
  - Target: autoscale (for stateless web app)
  - Build: `npm run build` (Vite + ESBuild)
  - Run: `npm run start` (production Express server)
- ✅ Application tested and verified:
  - Server running successfully on port 5000
  - Homepage loads correctly with school branding
  - Login page accessible and functional
  - Vite HMR connected and working
  - No LSP diagnostics errors
- ✅ Environment modules verified:
  - nodejs-20 installed and active
  - postgresql-16 available
  - Integrations: Supabase + Database configured
- ✅ Import completed successfully - application ready to use

### September 29, 2025 - Student Exam Interface Enhancements Completed
- ✅ Implemented enhanced question navigation sidebar with:
  - Real-time progress tracking (answered/total questions)
  - Visual question grid with color-coded status indicators
  - Blue highlight for current question, green checkmarks for answered, gray for unanswered
  - Yellow pulse indicator for questions currently being saved
  - Visual legend explaining status colors
- ✅ Added enhanced timer display with visual warnings:
  - Large prominent countdown in gradient card
  - Color-coded warnings: green (>10 min), yellow (5-10 min), red with pulse (<5 min)
  - Visual progress bar showing time remaining
  - Alert message when less than 5 minutes remain
- ✅ Implemented full-screen exam mode for distraction-free experience:
  - Toggle button to enter/exit full-screen
  - Fixed overlay that hides portal navigation
  - Better focus and concentration for students during exams
- ✅ Enhanced auto-save indicators with real-time visual feedback:
  - Saving, saved, and failed states clearly displayed
  - Yellow pulse for active saves
  - Green checkmarks for completed saves
  - Red indicators with retry button for failures
- ✅ Improved layout with sidebar + main content structure:
  - Sidebar (w-64) with sticky positioning for navigation
  - Main content area (flex-1) for exam questions
  - Responsive grid layout for question numbers
- ✅ Architect reviewed - all functionality verified working correctly
- ✅ All data confirmed storing in Supabase database (no in-memory storage)

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