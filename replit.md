# Treasure-Home School Management System

## Overview
Treasure-Home is a full-stack web application for K-12 schools, providing role-based dashboards for students, teachers, administrators, and parents, plus a public website. Its core purpose is to streamline school administration and enhance the educational experience through a unified, secure, and user-friendly platform. Key capabilities include managing enrollment, attendance, grades, announcements, communication, and a robust online exam system. The project uses a modern monorepo architecture, shared schema definitions, and a comprehensive authentication system with role-based access control.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript and Vite.
- **UI Components**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with CSS custom properties for theming, focusing on a clean, simple aesthetic with blue-only gradients.
- **State Management**: TanStack React Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod schema validation.
- **Exam Interface**: Features an enhanced navigation sidebar, prominent timer, full-screen mode, real-time auto-save indicators, and a professional, minimalist design with Lucide React icons.
- **Portal Dashboards**: All dashboards (Super Admin, Admin, Teacher, Parent) redesigned to match the modern student portal style with gradient stats cards, professional animations, and visual consistency.
- **Create Exam Form**: Modern 5-step wizard with intelligent field logic:
  - **Dynamic Teacher Filtering**: Teacher In-Charge dropdown automatically filters to show only teachers assigned to the selected subject in the selected class
  - **Real-Time Updates**: All dropdowns (Class, Subject, Term, Teacher) use refetchOnWindowFocus for auto-updates when data changes
  - **Auto-Selection**: Current academic term is automatically selected when form loads
  - **Smart Loading States**: All fields show loading placeholders and are disabled while data fetches
  - **Contextual Validation**: Fields are validated step-by-step with clear error messages
  - **Empty State Handling**: Helpful messages when no teachers are assigned to a subject
  - **Type Safety**: Full TypeScript support with proper type annotations for all queries

### Technical Implementations
- **Backend**: Node.js with Express.js and TypeScript.
- **API Design**: RESTful API endpoints with structured error handling.
- **Session Management**: Express sessions with PostgreSQL session store.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Authentication**: Role-based hybrid system supporting username/password for students/parents and Google OAuth (or password) for Admin/Teacher. Features JWT tokens, bcrypt hashing, rate limiting, and account lockout. Includes user management and audit logs.
- **Authorization**: Role-Based Access Control (RBAC) for student, teacher, admin, and parent roles.
- **Exam Security**: Tab switch detection, session recovery, question/option randomization, time-based auto-submit, and robust answer saving with validation.
- **User Provisioning**: CSV bulk provisioning for students and parents with automatic, simplified username generation and PDF login slips. Automated username and temporary password generation for all user creation flows.
- **Teacher Profile Onboarding**: Compulsory 3-step wizard with progress meter, auto-save, validation, and admin verification.
- **Homepage Content Management System**: Admin portal for managing website images (hero, gallery) with upload, organization, and secure storage. Public endpoints for content access.
- **Job Vacancy & Teacher Pre-Approval System**: Public job portal, teacher application workflow, admin management of vacancies and applications, and pre-approval security for Google OAuth access.
- **Optimistic UI Updates**: Comprehensive implementation across all portals (Admin, Teacher, Student, Parent) providing instant visual feedback for every user action:
  - **Instant UI Response**: All button actions (verify, publish, delete, activate, approve, reject, etc.) update the UI immediately before backend confirmation
  - **Three-Phase Pattern**: Every mutation uses onMutate (instant update + loading toast), onSuccess (success toast + query invalidation), and onError (rollback + error toast)
  - **Smart Rollback**: Automatic reversion to previous state if backend operations fail
  - **Loading States**: All action buttons show disabled states and loading indicators during processing
  - **Utility Functions**: Reusable optimistic update helpers in `client/src/lib/optimistic-utils.ts`
  - **Documentation**: Complete pattern guide in `client/src/docs/OPTIMISTIC_UI_PATTERN.md`
- **Real-time Synchronization**: Socket.IO real-time integration for instant data synchronization across clients on all major tables (announcements, classes, subjects, users, students, exams, attendance, academic_terms), with automatic reconnection and fallback to polling when connection is unavailable.
- **Automatic Account Activation**: New user accounts are automatically activated upon registration.
- **Unified Login System**: All users utilize a single login page at `/login` and are routed based on their role.
- **Automatic Seeding**: Automatic creation of roles and a super admin account on server startup.
- **Security Enhancements**: Improved password logging security and mandatory password change on first login for new users.
- **Admin Account Visibility Control**: Regular Admins cannot view, modify, or delete Super Admin and Admin accounts; Super Admins have full control.

### System Design Choices
- **Monorepo Design**: Client, server, and shared code in a single repository.
- **Shared Schema**: Centralized TypeScript types and Zod schemas.
- **Environment Configuration**: Supports environment-specific configurations for development and production.
- **Deployment**: Configured for Replit Development, Local Development, and Production (fully self-hosted with PostgreSQL database + MinIO object storage).
- **File Storage**: MinIO object storage with 5 buckets (homepage-images, gallery-images, profile-images, study-resources, general-uploads) for development and production environments.
- **Cross-Domain Authentication**: Configured with `sameSite: 'none'` cookies and `trust proxy` for secure session sharing.
- **CORS**: Auto-configured for development and production environments.
- **Port Configuration**: Vite server with `allowedHosts: true`; Express binds to `0.0.0.0:5000`.
- **Database Migrations**: Automatic, idempotent application on server startup using Drizzle ORM.
- **Data Integrity**: Strategic use of CASCADE DELETE and SET NULL foreign key constraints.

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form.
- **Build Tools**: Vite, TypeScript.
- **UI Framework**: Radix UI primitives, Tailwind CSS.

### Backend Services
- **Database**: PostgreSQL with Drizzle ORM (self-hosted or Neon).
- **File Storage**: MinIO object storage (self-hosted S3-compatible).
- **Real-time Updates**: Socket.IO server for live data synchronization.
- **Session Store**: `connect-pg-simple` with PostgreSQL.
- **Authentication**: Passport.js with JWT tokens and bcrypt password hashing.

### Data Management
- **Database ORM**: Drizzle ORM.
- **Schema Validation**: Zod.
- **Query Client**: TanStack React Query.
- **Date Handling**: `date-fns`.

## Maintenance & CI/CD Guidelines

### Pre-Deployment Checklist
Before deploying to production, **always** run these commands in sequence:

1. **Type Check**: `npm run check:types`
   - Verifies TypeScript integrity across the entire codebase
   - Must pass with 0 errors before deployment
   - Catches type mismatches, missing imports, and API inconsistencies

2. **Build Test**: `npm run build`
   - Ensures production bundle builds successfully
   - Validates all imports and dependencies
   - Generates optimized assets for deployment

3. **Deployment**: Replit automatically runs `npm run build` when you deploy
   - The `prebuild` script automatically runs type checks
   - Build will fail if TypeScript errors are detected
   - This prevents broken code from reaching production

### NPM Scripts Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `npm run dev` | Start development server | Local development |
| `npm run build` | Build production bundle | Before deployment |
| `npm run start` | Start production server | Production environment |
| `npm run check` | Run TypeScript type check | Pre-commit validation |
| `npm run check:types` | Explicit type check | CI/CD pipeline |
| `npm run prebuild` | Auto-runs before build | Automatic validation |
| `npm run predeploy` | Full pre-deployment check | Manual deployment |

### Type Safety Rules

#### Adding New Environment Variables
When adding new environment variables that the frontend needs:

1. **Update `client/src/vite-env.d.ts`**:
   ```typescript
   interface ImportMetaEnv {
     readonly VITE_API_URL?: string;
     readonly VITE_YOUR_NEW_VAR?: string; // Add new variables here
   }
   ```

2. **Environment Variable Naming**:
   - Frontend variables **must** start with `VITE_`
   - Backend variables do not need the prefix
   - Use descriptive, ALL_CAPS names

3. **Type Annotations**:
   - Use `?:` for optional variables
   - Use `:` for required variables
   - Always specify the type (string, boolean, number)

#### Adding New File Types
If you need to import new file types (e.g., .webp, .avif):

1. Add declaration to `client/src/vite-env.d.ts`:
   ```typescript
   declare module '*.webp' {
     const value: string;
     export default value;
   }
   ```

2. Common image formats are already configured:
   - .png, .jpg, .jpeg, .svg, .gif, .webp

### Code Quality Standards

#### Console Statements
- ❌ **NEVER** add `console.log()` in client code
- ✅ Use proper error boundaries and toast notifications
- ✅ Server logs are acceptable for debugging (in development only)

#### Import Organization
- ✅ Remove unused imports immediately
- ✅ Use TypeScript's `import type` for type-only imports
- ✅ Keep imports alphabetically ordered within groups

#### Type Safety
- ✅ All components must have proper TypeScript types
- ✅ Avoid `any` type - use specific types or `unknown`
- ✅ Use `typeof` and `$inferSelect` from Drizzle schemas

### Deployment Process

#### Automatic Deployment (Replit)
1. Push changes to your repository
2. Replit detects changes and triggers deployment
3. Runs `npm run build` (which includes type checks via `prebuild`)
4. If successful, deploys to production
5. If failed, rollback occurs automatically

#### Manual Deployment Verification
```bash
# Full pre-deployment check
npm run predeploy

# If successful, you're ready to deploy
# The build artifacts are in /dist
```

### Performance Monitoring

#### Build Size Optimization
- Current bundle: **1,144 KB** (gzipped: 242 KB)
- Monitor for significant increases (>10%)
- Consider code-splitting for bundles >1.5 MB

#### Type Check Performance
- Should complete in <30 seconds
- If slower, check for circular dependencies
- Use `--diagnostics` flag to debug: `tsc --noEmit --diagnostics`

### Troubleshooting

#### TypeScript Errors After Changes
1. Run `npm run check:types` to see all errors
2. Fix type errors in order of severity
3. Re-run to verify fixes
4. Never deploy with TypeScript errors

#### Build Failures
1. Check error message for specific file
2. Verify all imports are correct
3. Ensure environment variables are set
4. Run `npm run check:types` first

#### Development Server Issues
1. Restart workflow: Use Replit UI or `Ctrl+C` then `npm run dev`
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check port 5000 is not in use

### Best Practices

#### Before Making Changes
- [ ] Pull latest code
- [ ] Run `npm run check:types`
- [ ] Test locally with `npm run dev`

#### During Development
- [ ] Write type-safe code
- [ ] Remove debugging statements
- [ ] Test all changed features
- [ ] Verify no console errors

#### Before Committing
- [ ] Run `npm run check:types`
- [ ] Remove unused imports
- [ ] Update this file if architecture changed
- [ ] Test build: `npm run build`

#### Production Readiness
- [x] TypeScript: 0 errors ✓
- [x] Build: Successful ✓
- [x] Console: Clean (no errors/warnings) ✓
- [x] Tests: All critical paths verified ✓