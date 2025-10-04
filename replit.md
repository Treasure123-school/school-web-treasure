# Treasure-Home School Management System

## Overview
Treasure-Home School Management System is a comprehensive full-stack web application for K-12 schools, offering role-based dashboards for students, teachers, administrators, and parents, plus a public website. It manages core school operations like enrollment, attendance, grade management, announcements, and communication. The system features a modern monorepo architecture with shared schema definitions, a complete authentication system with role-based access control, and a robust exam management system including creation, delivery, auto-scoring, manual grading, and secure features like tab-switching detection and question randomization. The project's ambition is to streamline school administration and enhance the educational experience through a unified, secure, and user-friendly platform.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Online Exam System Features
- **Exam Creation**: Teachers/admins can create exams with multiple question types (MCQ, essay, short answer, true/false, fill-in-blank).
- **Exam Delivery**: Students take exams with a countdown timer, auto-save every 30 seconds, tab-switch detection, and auto-submit on timeout.
- **Auto-Scoring**: MCQs and true/false questions are automatically scored upon submission.
- **Manual Grading**: Essays and text answers are queued for teacher review with a detailed grading interface.
- **Score Merging**: Combines scores from auto-graded and manually-graded questions.
- **Report Cards**: Test scores (40%) and exam scores (60%) are combined for final grades with professional formatting.
- **Analytics**: Comprehensive exam reports with class performance, grade distribution, and student-level analytics.
- **Security Features**: Tab-switch detection, session recovery, question randomization, time-based auto-submit.

### UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
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
- **Authentication**: Strict role-based hybrid system:
  - Students/Parents: THS-branded username/password ONLY.
  - Admin/Teacher: Google OAuth (or password if authProvider='local') ONLY.
  - Backend enforces `authProvider` validation to prevent cross-role login methods.
  - Clear error messages guide users to correct authentication method.
  - JWT tokens (24hr expiry), bcrypt password hashing (12 rounds), rate limiting (5 attempts/15 min).
  - First-login password change enforcement with dialog-based UI flow.
  - Account lockout mechanism after 3 rate limit violations within 1 hour, with admin unlock capabilities.
  - Staff onboarding via invite system.
  - **Chapter One - The Gatekeepers of Access** (THS Story Plan - IMPLEMENTED):
    - All new Google OAuth users (admin/teacher) start with 'pending' status
    - Professional status-based messaging for login attempts (different messages for staff vs students/parents)
    - Clear, situation-specific error messages:
      * Invalid credentials: "Invalid login. Please check your username or password."
      * Pending approval: "Welcome to THS Portal. Your account is awaiting Admin approval. You will be notified once verified."
      * Suspended account: "Access denied: Your account has been suspended by THS Admin." (staff) or "Your account is suspended. Contact your class teacher or Admin." (students/parents)
    - Admin approval workflow with dedicated PendingApprovals page showing new signups
    - Comprehensive UserManagement page for managing all users (pending/active/suspended/disabled)
    - Admin actions: Approve, Suspend, Unsuspend, Unverify (move back to pending), Disable
    - Automatic notification creation when new pending users sign up
    - Real-time pending count badge on admin dashboard
    - Status-based access control enforced on login
    - Parent-child linking: Parents can select which child's records to view
- **Authorization**: Role-Based Access Control (RBAC) for student, teacher, admin, and parent roles.
- **Exam Security**: Tab switch detection, enhanced session recovery, question and option randomization, and time-based auto-submit.
- **User Provisioning**: CSV bulk provisioning for students and parents with automatic THS-branded username generation and parent-child linking. PDF login slips generation.

### System Design Choices
- **Monorepo Design**: Client, server, and shared code in a single repository.
- **Shared Schema**: Centralized TypeScript types and Zod schemas for consistency.
- **Environment Configuration**: Supports environment-specific configurations.
- **Deployment**: Configured for autoscale deployment with `npm run build` and `npm run start` commands.

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

## Replit Environment Setup

### Project Status (Latest Update: October 4, 2025 - 1:28 PM)
✅ **Successfully Re-Imported and Running** - The application has been freshly cloned from GitHub and is fully operational in the Replit environment.

#### Fresh Import Setup Completed (October 4, 2025 - 1:28 PM)
- ✅ GitHub repository successfully cloned to Replit
- ✅ All npm dependencies installed and up-to-date (Node.js 20.x)
- ✅ PostgreSQL database provisioned via Replit (Supabase-backed)
- ✅ Database schema pushed successfully (all tables created)
- ✅ Migration error handling improved (benign "already exists" errors handled gracefully)
- ✅ Workflow "Start application" configured with webview output on port 5000
- ✅ Deployment configuration verified for autoscale deployment
- ✅ Application server successfully started and tested on port 5000
- ✅ Frontend serving correctly with Vite HMR enabled
- ✅ Homepage rendering correctly with school branding and navigation
- ✅ Database migrations applied automatically on startup with idempotent handling
- ✅ Vite configured with `allowedHosts: true` for Replit proxy compatibility
- ✅ Express server configured with `host: "0.0.0.0"` and `reusePort: true`
- ✅ tsx package installed globally to avoid interactive prompts
- ✅ Background cleanup service running for expired exam sessions
- ✅ Google OAuth authentication enabled and verified
- ✅ Application fully functional and ready for use
- ✅ Screenshot verified: Homepage displaying correctly with school branding, navigation, and classroom image
- ✅ Minor 400 API errors in console (expected for unauthenticated requests to protected endpoints)

#### Chapter One Implementation (October 4, 2025)
- Updated all authentication error messages to match THS Story Plan
- Enhanced role-based login messaging for students, parents, teachers, and admins
- Verified Google OAuth pending approval workflow
- Confirmed parent-child linking functionality
- All authentication data properly stored in Supabase PostgreSQL database
- Admin user management endpoints verified (approve, suspend, revoke approval)

#### Chapter One Extended - Admin Powers (October 4, 2025)
**Backend Features:**
- Delete User: Permanent account removal with audit logging and self-protection
- Reset Password: Force password change with optional "must change on next login" flag
- Change Role: Upgrade/downgrade user roles with audit trail and self-protection
- Audit Logs API: Comprehensive tracking of all admin actions with filters

**Frontend Features:**
- Enhanced UserManagement page with "More Actions" dropdown menu
- Delete account with permanent removal warning dialog
- Reset password dialog with force-change option
- Change role dialog with role selection dropdown
- New AuditLogs page displaying admin action history
- Added Pending Approvals, User Management, and Audit Logs links to admin sidebar

**Security Measures:**
- Prevent admins from deleting their own account
- Prevent admins from changing their own role
- All admin actions logged with timestamp, IP address, user agent
- Confirmation dialogs for all destructive actions
- Comprehensive audit trail for accountability and transparency

#### Professional Login Messaging System (October 4, 2025)
**Implementation Completed:**
- Comprehensive professional messaging system with 17 distinct message types
- All emojis removed and replaced with professional text-only content
- Semantic icon colors implemented across all message scenarios:
  * Success (CheckCircle): Green (text-green-500)
  * Error/Failure (XCircle): Red (text-red-500)
  * Pending/Warning (Clock): Orange (text-orange-500)
  * Info (AlertCircle): Blue (text-blue-500)
  * Critical Status (Ban): Red for suspended/disabled, Orange for locked
- Status-specific messaging for all user roles (admin, teacher, student, parent)
- Multi-line descriptions for complex scenarios (pending approval, account status)
- Contextual help text displayed on login page for different user types
- Backend error messages aligned with frontend message detection logic
- Professional presentation maintained across all authentication scenarios

### Environment Configuration
- **Node.js Version**: 20.x (via nodejs-20 module)
- **Database**: PostgreSQL (Supabase) - Connected and operational
- **Database URL**: Configured via environment variable `DATABASE_URL`
- **Port**: 5000 (configured for Replit proxy compatibility)

### Development Workflow
- **Start Command**: `npm run dev` - Starts both Express backend and Vite frontend
- **Build Command**: `npm run build` - Builds production assets
- **Production Command**: `npm run start` - Runs production server
- **Database Push**: `npm run db:push` - Syncs schema changes to database

### Replit-Specific Configurations
1. **Vite Server Settings** (vite.config.ts):
   - `host: "0.0.0.0"` - Listens on all network interfaces
   - `allowedHosts: true` - Allows Replit's iframe proxy
   - `port: 5000` - Only non-firewalled port in Replit

2. **Express Server Settings** (server/index.ts):
   - Serves on port 5000 (from `process.env.PORT` or default)
   - `host: "0.0.0.0"` - Required for Replit accessibility
   - `reusePort: true` - Enables zero-downtime restarts

3. **Deployment Configuration** (.replit):
   - **Target**: Autoscale deployment
   - **Build**: `npm run build`
   - **Run**: `npm run start`
   - **Workflow**: "Start application" configured with webview output

### Database Migrations
- Migrations are applied automatically on server startup
- Migration folder: `./migrations`
- Migrations use Drizzle ORM migrator
- Idempotent design - safe to run multiple times

### Active Integrations
- `javascript_supabase:1.0.0` - Supabase PostgreSQL integration
- `javascript_database:1.0.0` - Database management integration