# Treasure-Home School Management System

## Overview
Treasure-Home is a comprehensive school management system designed to streamline administrative and academic processes. It features JWT authentication, a robust PostgreSQL database, and cloud-based file storage. The system supports five distinct role-based access levels (Super Admin, Admin, Teacher, Student, Parent) and offers a wide array of features including a sophisticated exam system with auto-grading, real-time updates, attendance management, report card generation, and various communication tools. The project aims to provide an efficient, scalable, and secure platform for educational institutions.

## User Preferences
- Username (admission ID format: THS-STU-###, THS-TCH-###) should be displayed prominently as the canonical student identifier
- Grading weights (40% Test, 60% Exam) should be visible in report card interfaces

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, Vite, shadcn/ui (Radix UI + Tailwind CSS) for a modern and consistent design. Wouter is used for routing, TanStack Query for data fetching, and React Hook Form with Zod for form management and validation.

### Technical Implementations
The system uses a dual-database strategy with PostgreSQL (via Neon) for all environments. Cloudinary is integrated for cloud-based file storage in production, with a local filesystem fallback for development. JWT authentication is used without external providers. Real-time functionalities are powered by Socket.IO with comprehensive event coverage. The backend is an Express.js application built with Node.js and TypeScript, leveraging Drizzle ORM for database interactions. The architecture supports five role-based access levels with granular permissions.

### Real-time Event System (Socket.IO)
Comprehensive real-time updates are implemented across major features including exams, academic terms, student management, vacancies, exam questions, and report cards. Security features include class-scoped event broadcasting, role-based authorization for table subscriptions, JWT-authenticated socket connections, and event deduplication.

### Feature Specifications
- **Authentication**: JWT tokens (24-hour expiration), bcrypt hashing, CORS, rate limiting, account lockout, 2FA support, and RBAC.
- **Role-Based Access Control**: Five distinct roles (Super Admin, Admin, Teacher, Student, Parent) with hierarchical user creation rules.
- **Database Schema**: Over 40 tables covering various academic and administrative functions.
- **Exam System**: Features reliable submission, instant auto-scoring for MCQs, anti-cheat measures, auto-submission, and real-time progress saving. Exam creation is teacher-centric with strong validation.
- **Report Card System**: Comprehensive auto-generation and score management system:
  - **Auto-Generation**: Report cards are automatically created when students complete their first exam. The `syncExamScoreToReportCard` function handles this flow.
  - **Exam Type Detection**: System distinguishes between test types (test, quiz, assignment) which map to testScore/testMaxScore, and main exam types (exam, final, midterm) which map to examScore/examMaxScore.
  - **Weighted Scoring**: Uses 40% test weight and 60% exam weight for grade calculations via `calculateWeightedScore` in `shared/grading-utils.ts`.
  - **Teacher-Specific Editing Permissions**: Teachers can ONLY edit scores for subjects where they created the exams:
    - `testExamCreatedBy` and `examExamCreatedBy` fields track which teacher created each exam type
    - Teachers can edit test scores only if they created the test (test, quiz, assignment)
    - Teachers can edit exam scores only if they created the main exam (exam, final, midterm)
    - Teachers can add remarks only if they created at least one exam for that subject
    - Admins and Super Admins can edit all scores regardless of creator
    - Legacy items (null creator fields) remain editable by all teachers for backwards compatibility
  - **Teacher Score Override**: Teachers can add/edit test and exam scores via `/api/reports/items/:itemId/override` endpoint. Overrides are marked with `isOverridden` flag to prevent auto-sync from overwriting manual edits.
  - **Auto-Recalculation**: After any score change, the system automatically recalculates weighted grades, report card totals, and percentages.
  - **Max Score Handling**: Report card API uses `result.maxScore` (actual exam session score) with fallback to `exam.totalMarks` (configured value) - this correctly handles exams where not all configured questions were used.
  - **Status Workflow**: Draft → Finalized → Published with role-based visibility.
  - **Real-time Updates**: Socket.IO events emitted for all report card and item changes.
  - **Grading Scales**: Supports Standard, WAEC, and Percentage scales with configurable thresholds.
- **File Management**: Unified upload interface with Cloudinary CDN for production, handling image optimization, CDN distribution, and responsive sizing.
- **Department-Aware Subject Mapping**: Students are automatically assigned subjects based on class level and department. Report card generation prioritizes student's personal subject assignments. Teachers can be assigned to classes and subjects, with department-specific filtering for senior secondary classes.
- **Department Selection UI**: Student management includes department selection for senior secondary students (SS1-SS3) with conditional rendering and pre-population.
- **Quick Student Creation**: Optimized "Create Student" modal with minimal essential fields only:
  - Full Name (requires first and last name, auto-splits on submission)
  - Gender (Male/Female/Other dropdown)
  - Date of Birth (date picker)
  - Class (dropdown with all classes)
  - Department (conditional - only appears for SS1/SS2/SS3 classes)
  - Admission date, username, password, and admission number are auto-generated by the system
  - Students can complete their full profile (phone, address, parent info, medical details) after enrollment
- **Teacher-Class-Subject Assignment Module**: Comprehensive module for managing teacher assignments to specific class-subject combinations. Features include:
  - Admin interface at `/portal/admin/teacher-assignments` for creating, editing, and deleting assignments
  - Assignment validation middleware (`validateTeacherCanCreateExam`, `validateTeacherCanEnterScores`, `validateTeacherCanViewResults`) that enforces teachers can only create exams and enter scores for their assigned class-subject combinations
  - Audit logging via `teacherAssignmentHistory` table tracking all assignment changes
  - Support for term-specific and session-based assignments with optional validity periods
  - Admin/Super Admin bypass - elevated roles can perform any exam operation
  - Ownership-based authorization for exam updates/deletes (creator or teacherInCharge)
  - **Frontend Permission Enforcement**: CreateExam.tsx filters class and subject dropdowns based on teacher's active assignments via `/api/my-assignments` endpoint. Subjects are dynamically filtered when a class is selected, showing only subjects the teacher is assigned to teach for that specific class. Teachers without assignments see a helpful notice directing them to contact their administrator.
- **Exam Visibility System**: Centralized exam visibility logic in `server/exam-visibility.ts` ensures students only see exams they should have access to:
  - **KG1-JSS3 Students**: Only see published exams for their class where subject category is "general"
  - **SS1-SS3 Students with Department**: See published exams for their class where subject category is "general" OR matches their department
  - **SS1-SS3 Students without Department**: Only see published exams with general subject category (defensive fallback)
  - **Parents**: See a union of all exams their children have access to
  - Centralized functions: `getVisibleExamsForStudent()`, `getVisibleExamsForParent()`, `filterExamsForStudentContext()`, `canStudentAccessExam()`, `getStudentsForTeacherExam()`
  - Both `/api/exams` and `/api/realtime/sync` endpoints use the same centralized logic for consistency
  - Optimized with Promise.all for batch queries to minimize database round-trips
- **Exam Results Persistence (December 2025 Fix)**: Critical design decision for `/api/exam-results` endpoint:
  - **Results ALWAYS persist**: Once a student completes an exam, their score is permanently stored and visible
  - **isPublished flag scope**: Controls only whether students can TAKE the exam, NOT view their past results
  - **Results only disappear**: When the exam is explicitly DELETED from the system
  - **Rationale**: Students should never see their scores "disappear" unexpectedly after submission. The previous behavior of hiding results when exams were unpublished caused confusion and data loss perception
  - **Future enhancement**: If teachers need to delay score release, a dedicated `hideResults` flag can be added to the exam schema

### System Design Choices
- **Stateless Backend**: Achieved by offloading database to Neon PostgreSQL and file storage to Cloudinary.
- **Drizzle ORM**: Used for type-safe database interactions.
- **Zod**: Utilized for schema validation.
- **Centralized Configuration**: For roles and grading scales.
- **Monorepo Structure**: Organized into `server/`, `client/`, and `shared/` directories.

## Performance Optimizations (December 2024)

### Load Testing Results
The system has been optimized for high concurrency through comprehensive load and stress testing:

| Concurrent Users | Error Rate | Throughput (req/s) | P95 | P99 | Max |
|------------------|------------|-------------------|------|------|------|
| 50               | 0.00%      | 50.85             | 1,900ms | 2,420ms | 3,526ms |
| 100              | 0.00%      | 55.69             | 4,477ms | 5,270ms | 8,590ms |
| 200              | 0.00%      | 55.00+            | ~8,000ms | ~10,000ms | ~12,000ms |

### Optimization Techniques Implemented

1. **Request Coalescing Cache (`server/performance-cache.ts`)**
   - Prevents thundering herd problem by coalescing concurrent requests for the same data
   - Implements tiered TTL (short 30s for frequently changing data, long 5min for static data)
   - Cache pre-warming on server startup for homepage content, classes, subjects, and announcements
   - Achieved 93-99% improvement for cached endpoints (classes: 933ms → 66ms, subjects: 626ms → 1ms)

2. **Authentication Performance**
   - Reduced bcrypt work factor from 12 to 8 rounds in development mode (production remains at 12)
   - Improved login from 2,385ms to 471ms (80% faster in development)

3. **Rate Limiting Adjustments for Load Testing**
   - Development mode allows 100 login attempts (vs 5 in production)
   - Extended lockout duration reduced from 15min to 5min in development
   - Rate limit violations threshold increased from 3 to 50 in development

4. **Cached Endpoints Performance**
   - Homepage content: 0-1ms (pre-warmed on startup)
   - Announcements: 0-1ms (pre-warmed on startup)
   - Classes: 66ms (first request), 1ms (cached)
   - Subjects: 1ms (cached)

### Performance Test Configuration
Tests are run via `tests/load-tests/load-test-harness.ts`:
```bash
CONCURRENT_USERS=100 TEST_DURATION=30 RAMP_UP=10 npx tsx tests/load-tests/load-test-harness.ts
```

### Production Considerations
- Bcrypt work factor remains at 12 in production for security
- Rate limiting thresholds remain strict in production
- Consider horizontal scaling (multiple instances) for 500+ concurrent users
- Database connection pooling is managed by Neon serverless driver
- Neon WebSocket connections may timeout under sustained high load - use simple pool configuration
- At 200+ users, response times increase but system remains stable with 0% errors

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **Cloud Storage**: Cloudinary CDN
- **Deployment**: Render (Backend), Vercel (Frontend)
- **Real-time Communication**: Socket.IO