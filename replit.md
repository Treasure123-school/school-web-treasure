# Treasure-Home School Management System

## Overview
Treasure-Home School Management System is a comprehensive full-stack web application designed for K-12 schools. It provides role-based dashboards for students, teachers, administrators, and parents, alongside a public-facing website. The system manages core school operations such as student enrollment, attendance tracking, grade management, announcements, and communication. It features a modern monorepo architecture with shared schema definitions and a complete authentication system with role-based access control, ensuring distinct permissions and tailored interfaces for various user types. The system includes a robust exam management system with creation, delivery, auto-scoring, manual grading, and secure features like tab-switching detection and question randomization.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript.
- **Build Tool**: Vite for fast development and optimized builds.
- **UI Components**: Shadcn/ui component library built on Radix UI primitives.
- **Styling**: Tailwind CSS with CSS custom properties for theming.
- **State Management**: TanStack React Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod schema validation.
- **Exam Interface**: Enhanced navigation sidebar, prominent timer with visual warnings, full-screen mode, and real-time auto-save indicators.

### Technical Implementations
- **Backend**: Node.js with Express.js.
- **Language**: TypeScript for full-stack type safety.
- **API Design**: RESTful API endpoints with structured error handling.
- **Session Management**: Express sessions with PostgreSQL session store.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Authentication**: Custom email/password with server-side sessions and PostgreSQL storage.
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