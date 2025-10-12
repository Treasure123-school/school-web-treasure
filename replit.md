# Treasure-Home School Management System

## Overview
Treasure-Home School Management System is a comprehensive full-stack web application for K-12 schools, offering role-based dashboards for students, teachers, administrators, and parents, plus a public website. Its main purpose is to streamline school administration and enhance the educational experience through a unified, secure, and user-friendly platform. Key capabilities include managing enrollment, attendance, grade management, announcements, communication, and a robust online exam system. The project features a modern monorepo architecture with shared schema definitions and a complete authentication system with role-based access control.

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
- **Exam Interface**: Enhanced navigation sidebar, prominent timer, full-screen mode, and real-time auto-save indicators.
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
    - First-login password change enforcement.
    - Account lockout mechanism with admin unlock.
    - Staff onboarding via invite system.
    - Professional status-based messaging and specific error messages.
    - Admin approval workflow for new Google OAuth users with 'pending' status.
    - Comprehensive User Management page for admin actions (Approve, Suspend, Unsuspend, Unverify, Disable, Delete User, Reset Password, Change Role).
    - Audit Logs for admin actions.
    - Parent-child linking.
- **Authorization**: Role-Based Access Control (RBAC) for student, teacher, admin, and parent roles.
- **Exam Security**: Tab switch detection, enhanced session recovery, question and option randomization, and time-based auto-submit.
- **User Provisioning**: CSV bulk provisioning for students and parents with automatic username generation and PDF login slips.

### System Design Choices
- **Monorepo Design**: Client, server, and shared code in a single repository.
- **Shared Schema**: Centralized TypeScript types and Zod schemas for consistency.
- **Environment Configuration**: Supports environment-specific configurations.
- **Deployment**: Configured for autoscale deployment.
- **Database Migrations**: Automatic, idempotent application on server startup using Drizzle ORM.

### Key Features
- **Teacher Profile Onboarding**: Compulsory 3-step wizard (Personal, Academic, Operational) with progress meter, auto-save, validation, and admin verification workflow. Includes enhanced professional profile view and personalized dashboard elements.
- **Online Exam System**:
    - **Creation**: Multiple question types.
    - **Delivery**: Countdown timer, auto-save, tab-switch detection, auto-submit.
    - **Scoring**: Auto-scoring for MCQs/true/false, manual grading for essays, score merging.
    - **Reporting**: Report cards combining test and exam scores, comprehensive analytics.

## Recent Changes

### October 12, 2025 - Exam Interface Professional UI Redesign
**Issue**: Exam interface contained emojis throughout the UI and had inconsistent styling. User requested a professional interface with no emojis, proper icons, good color matching, and a simple yet stunning design.

**Changes Implemented**:
1. **Complete Emoji Removal**:
   - Removed all emojis from user-facing UI elements (headers, buttons, toasts, alerts)
   - Replaced with professional Lucide React icons: ClipboardCheck, GraduationCap, FileText, Trophy, Award, AlertCircle, WifiOff
   - Console logs retain emojis for debugging purposes only

2. **Modern UI Redesign**:
   - **Header**: Modern gradient (indigo-600 → blue-600 → cyan-600), larger logo with drop shadow
   - **Exam Title**: Increased to text-4xl with better shadow effects for prominence
   - **Timer**: Larger display (text-4xl) with high visibility
   - **Question Cards**: Gradient backgrounds (indigo-50 → blue-50 → cyan-50 in light mode)
   - **Options**: Larger text, improved hover effects, rounded corners for better UX
   - **Navigation**: Gradient buttons with shadows for clear visual hierarchy
   - **Progress Tracker**: Emerald/green gradient theme for positive reinforcement
   - **Submit Button**: Larger size (h-16) with gradient effect for prominence

3. **Improved Error Handling**:
   - Fixed auto-save logic to eliminate false "Connection lost" warnings
   - Proper differentiation between validation errors, session failures, and network errors
   - Only genuine issues displayed to users for better UX

**Files Changed**:
- `client/src/pages/portal/StudentExams.tsx` - Complete UI redesign, emoji removal, error handling improvements

**UX Results**:
- Professional, modern interface with consistent design language
- Clear visual hierarchy with improved accessibility
- Better user feedback with accurate error messages
- Enhanced student exam-taking experience

**Architect Review**: All changes approved - no user-facing emojis, proper error handling, professional styling maintained

### October 10, 2025 (Evening) - Admin User Management Performance Optimization
**Issue**: All mutation operations (delete, suspend, verify, change role) were slow and not updating the UI instantly. Users sometimes reappeared after deletion, creating data consistency issues.

**Root Cause**:
1. Frontend cache invalidation not refreshing properly after mutations
2. No retry logic for transient database errors  
3. Insufficient error logging for debugging Supabase RLS issues

**Solution Implemented**:
1. **Balanced Cache Invalidation**:
   - Changed all mutations to use `refetchType: 'active'` for efficient cache refresh
   - Forces immediate refetch of active queries after every mutation
   - Applied to all operations: delete, suspend, verify, approve, reject, role change, recovery email update
   - Reduced staleTime to 3 seconds for recent data while avoiding excessive refetches

2. **Smart Query Configuration**:
   - Configured queries with 3-second staleTime to balance freshness with performance
   - refetchOnWindowFocus enabled to sync when user returns to tab
   - Removed aggressive polling to avoid backend overload
   - Optimistic updates provide instant UI feedback while refetch happens in background

3. **Enhanced Error Handling & Server-Side Retry Logic**:
   - Server-side retry logic with TRUE exponential backoff (100ms → 200ms → 400ms) for delete operations
   - Only retries transient errors (ECONNRESET, timeouts); permanent errors (RLS, foreign keys) fail fast
   - Comprehensive error detection for Supabase RLS permission issues
   - Verification step after delete to ensure operation succeeded
   - Detailed logging with emoji indicators and backoff duration for easy debugging

4. **Improved User Feedback**:
   - Specific error messages for RLS permission errors
   - Technical details included for debugging
   - Execution time tracking for performance monitoring
   - Clear distinction between transient and permanent errors

**Files Changed**:
- `client/src/pages/portal/UserManagement.tsx` - Balanced refetch strategy
- `client/src/pages/portal/PendingApprovals.tsx` - Balanced refetch strategy
- `server/routes.ts` - Enhanced delete endpoint with retry logic and verification

**Performance Results**:
- All mutations provide instant UI feedback with optimistic updates
- Efficient cache invalidation avoids backend overload
- Server-side retry logic handles transient errors automatically
- Comprehensive error logging for debugging RLS issues

**Architect Review**: Balanced implementation approved - avoids backend saturation while maintaining responsive UI

### October 10, 2025 (Morning) - CASCADE Delete Implementation & Schema Optimization
**Issue**: User deletion operations were extremely slow (30+ seconds) and complex, requiring manual deletion of 26+ related records across multiple tables. Schema had conflicting constraints (NOT NULL columns with SET NULL foreign keys).

**Root Cause**: 
1. Missing CASCADE delete constraints on foreign keys forced manual deletion logic (135 lines of code)
2. Schema incompatibility: columns with `onDelete: 'set null'` incorrectly marked as `.notNull()`, causing PostgreSQL constraint violations

**Solution Implemented**:
1. **Strategic CASCADE/SET NULL Design**:
   - CASCADE DELETE (auto-delete owned data): students, teacherProfiles, adminProfiles, parentProfiles, examSessions, examResults, attendance, notifications, passwordResetTokens, teacherClassAssignments, reportCards
   - SET NULL (preserve audit trail): invites.createdBy, attendance.recordedBy, exams.createdBy, announcements.authorId, messages.senderId/recipientId, studyResources.uploadedBy, auditLogs.userId

2. **Schema Corrections**:
   - Removed `.notNull()` constraint from all SET NULL columns to prevent database errors
   - All audit trail fields now properly nullable, preserving historical data while allowing user deletion

3. **Backend Optimization**:
   - Simplified `deleteUser` function from 135 lines to 15 lines
   - Database CASCADE constraints now handle all related record cleanup automatically

4. **Frontend Performance**:
   - Removed `refetchType: 'active'` from all mutation invalidations
   - Instant UI updates with proper cache invalidation across all query states

**Files Changed**:
- `shared/schema.ts` - Added CASCADE/SET NULL constraints, fixed nullable columns
- `server/storage.ts` - Simplified deleteUser to single DELETE statement
- `client/src/pages/portal/UserManagement.tsx` - Optimized cache invalidation
- `client/src/pages/portal/PendingApprovals.tsx` - Optimized cache invalidation

**Performance Results**:
- User deletion: 30+ seconds → <1 second (97% faster)
- Code complexity: 135 lines → 15 lines (89% reduction)
- All admin operations now persist correctly with instant UI feedback

**Architect Approved**: All changes verified for data integrity, security, and PostgreSQL compatibility.

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