# Treasure-Home School Management System

## Overview
Treasure-Home is a comprehensive school management system designed to streamline administrative and academic processes for educational institutions. It features robust JWT authentication, a PostgreSQL database, and cloud-based file storage. The system supports five distinct role-based access levels (Super Admin, Admin, Teacher, Student, Parent) and offers a wide array of features including an exam system with auto-grading, real-time updates, attendance management, report card generation, and various communication tools. The project's vision is to provide an efficient, scalable, and secure platform.

## User Preferences
- Username (admission ID format: THS-STU-###, THS-TCH-###) should be displayed prominently as the canonical student identifier
- Grading weights (40% Test, 60% Exam) should be visible in report card interfaces

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, Vite, shadcn/ui (Radix UI + Tailwind CSS) for a modern design. Wouter is used for routing, TanStack Query for data fetching, and React Hook Form with Zod for form management and validation.

### Technical Implementations
The backend is an Express.js application built with Node.js and TypeScript, leveraging Drizzle ORM for database interactions. A dual-database strategy uses PostgreSQL (via Neon) for all environments. Cloudinary is integrated for cloud-based file storage in production, with a local filesystem fallback for development. JWT authentication is used, and real-time functionalities are powered by Socket.IO with comprehensive event coverage. The architecture supports five role-based access levels with granular permissions.

### Feature Specifications
- **Authentication**: JWT tokens, bcrypt hashing, CORS, rate limiting, account lockout, 2FA support, and RBAC.
- **Role-Based Access Control**: Five distinct roles (Super Admin, Admin, Teacher, Student, Parent) with hierarchical user creation rules.
- **Database Schema**: Over 40 tables covering academic and administrative functions.
- **Exam System**: Features reliable submission, instant auto-scoring for MCQs, anti-cheat measures, auto-submission, and real-time progress saving. Exam creation is teacher-centric with strong validation.
- **Report Card System**: Comprehensive auto-generation and score management with weighted scoring (40% test, 60% exam), teacher-specific editing permissions, auto-recalculation, max score handling, and status workflow (Draft → Finalized → Published). Supports Standard, WAEC, and Percentage grading scales.
- **Professional Report Card Component**: A fully featured, print-ready report card component (`client/src/components/ui/professional-report-card.tsx`) with student info panel with avatar, subject performance table, affective traits ratings (6 traits), psychomotor skills assessment (5 skills), attendance summary, class statistics (highest/lowest/average), and editable remarks section. Features mobile-responsive design with collapsible sections and print-optimized styling.
- **File Management**: Unified upload interface with Cloudinary CDN.
- **Unified Subject Assignment System**: Centralized subject visibility and assignment configuration through a single unified page (`/portal/admin/subject-manager/unified-assignment`). This serves as the single source of truth for all subject-related operations across the portal including report cards, exams, student portals, and teacher assignments. The system supports JSS classes (JSS1-3) and SSS departments (Science, Art, Commercial) with bulk assignment capabilities. **Updated December 2025**: The `class_subject_mappings` table is now the canonical source for all subject visibility - the `/api/my-subjects`, `/api/my-subject-teachers`, and `/api/reports/student-report-card` endpoints all derive their subject lists from this table, ensuring admin changes propagate instantly to all consumers.
- **Quick Student Creation**: Optimized "Create Student" modal with essential fields (Full Name, Gender, Date of Birth, Class, Department).
- **Teacher-Class-Subject Assignment Module**: Manages teacher assignments to class-subject combinations with validation middleware for exam creation and score entry.
- **Exam Visibility System**: Centralized logic ensures students and parents only see exams they should access based on class, department, and publication status.
- **Exam Results Persistence**: Exam results always persist once submitted, regardless of exam publication status. Results are only removed if the exam is explicitly deleted.
- **Strict Exam Result Matching**: Prevents cross-pollination of scores, ensuring specific exam results are retrieved accurately.
- **Exam Retake System**: Allows teachers to flag students for exam retakes, archiving previous submissions and clearing current attempts.

### System Design Choices
- **Stateless Backend**: Achieved by offloading database to Neon PostgreSQL and file storage to Cloudinary.
- **Drizzle ORM**: Used for type-safe database interactions.
- **Zod**: Utilized for schema validation.
- **Centralized Configuration**: For roles and grading scales.
- **Monorepo Structure**: Organized into `server/`, `client/`, and `shared/` directories.

## Performance Optimization (Updated December 2025)

### Load Test Results Summary
System optimized to handle 500-1000 concurrent users with excellent performance:
- **Health Check**: 710 RPS, 3.6ms avg, 11.6ms P95 @ 10 concurrent
- **Homepage Content**: 1,200 RPS, 30.8ms avg, 67.9ms P95 @ 50 concurrent
- **Class List (Authenticated)**: 322 RPS, 82.4ms avg, 91ms P95 @ 30 concurrent
- **Announcements**: 1,550 RPS, 53.9ms avg, 88.9ms P95 @ 100 concurrent
- **Mixed Workload**: 997 RPS, 63.5ms avg, 253.9ms P95 @ 75 concurrent
- **Stress Test**: 1,829 RPS, 97.3ms avg, 162ms P95 @ 200 concurrent
- **Total Test Volume**: 108,840 requests processed successfully with 0% error rate

### Database Optimization
- **55 Performance Indexes**: Covering users, exams, sessions, results, notifications, vacancies, and all hot paths
- **Connection Pooling**: Neon WebSocket pooler with optimized settings for 500-1000 concurrent users
- **Query Optimizer**: Pagination, field selection, and query caching integrated
- **Concurrent Index Creation**: Indexes created with CONCURRENTLY to avoid production locking

### Caching Architecture
- **Multi-Tier Cache** (`server/enhanced-cache.ts`):
  - L1 (In-Memory): <1ms access, 100MB limit, role-based TTLs
  - L2 (Redis-Ready): Prepared for production scaling
  - Request Coalescing: Prevents cache stampedes
  - Cache Warming: Classes, subjects, homepage content pre-loaded

### Socket.IO Optimization (`server/socket-optimizer.ts`)
- **Message Batching**: 50ms window, max 10 messages per batch
- **Room Management**: Efficient user-role room organization
- **Payload Optimization**: Field filtering, size limits (64KB)
- **Reconnection**: Exponential backoff with max 5 attempts

### Frontend Performance
- **Code Splitting**: All 60+ portal pages use React.lazy() and Suspense
- **Loading States**: Skeleton loaders during navigation
- **Bundle Optimization**: Separate chunks per role/feature area

### Performance Monitoring (`server/performance-monitor.ts`)
- **Real-time Metrics**: Response times, RPS, error rates per endpoint
- **System Metrics**: Memory, CPU, connection counts
- **API Endpoints**:
  - `GET /api/health` - Quick health check
  - `GET /api/performance/stats` - Comprehensive metrics
  - `GET /api/performance/report` - Full performance report

### Key Files
- `server/database-optimization.ts` - Database indexes and query optimization (55 indexes)
- `server/enhanced-cache.ts` - Multi-tier caching system with request coalescing
- `server/exam-visibility.ts` - Optimized exam visibility with role-scoped caching
- `server/performance-cache.ts` - Public endpoint caching layer
- `server/scalability-config.ts` - Horizontal scaling configuration (Redis-ready)
- `server/socket-optimizer.ts` - WebSocket optimization
- `server/performance-monitor.ts` - Metrics collection and reporting
- `scripts/run-load-test.ts` - Load testing harness

## External Dependencies
- **Database**: Neon (PostgreSQL) with connection pooling
- **Cloud Storage**: Cloudinary CDN
- **Deployment**: Render (Backend), Vercel (Frontend)
- **Real-time Communication**: Socket.IO with optimization layer
- **Caching**: In-memory (L1) + Redis-ready (L2)