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
- **Report Card System**: Comprehensive auto-generation and score management with weighted scoring (40% test, 60% exam), teacher-specific editing permissions, auto-recalculation, max score handling, and status workflow (Draft → Finalized → Published). Includes a Role-Based Approval Workflow where teachers finalize and admins publish. Features a professional, print-ready component with detailed student info, subject performance, traits, attendance, class statistics, and editable remarks.
- **Report Card Comments Access Control**: Role-based permission system for comments:
  - Class Teacher's Comment: Only the assigned class teacher (or admins) can edit
  - Principal's Comment: Only admins can edit
  - Auto-generated encouraging comments based on student performance (Excellent/Very Good/Good/Fair/Needs Improvement)
  - Comments use lastName instead of firstName as per school convention
- **Admin Comment Template Management**: 
  - Admin-only page at `/portal/admin/comment-templates` for managing default comment templates
  - Separate templates for teacher and principal comments
  - Templates organized by performance level (Excellent, Very Good, Good, Fair, Needs Improvement) with percentage ranges
  - Uses `{lastName}` placeholder for dynamic student name insertion
  - Active/inactive status toggle for templates
  - **Backfill Comments Feature**: Admin UI to apply default comments to existing report cards based on student performance, with options to preserve or overwrite existing comments
- **Signature Management**: 
  - Admin (Principal) profile includes digital signature setup for report card signing
  - Teacher profiles include digital signature setup for class teacher signing
  - SuperAdmin portal does not have principal signature (reserved for Admin role)
- **File Management**: Unified upload interface with Cloudinary CDN.
- **Unified Subject Assignment System**: Centralized subject visibility and assignment configuration, serving as the single source of truth for all subject-related operations. Supports JSS classes and SSS departments with bulk assignment capabilities.
- **Automatic Student Subject Sync**: Modifying subject assignments automatically synchronizes `student_subject_assignments` for affected students.
- **Quick Student Creation**: Optimized modal with essential fields.
- **Teacher-Class-Subject Assignment Module**: Manages teacher assignments with validation.
- **Exam Visibility System**: Centralized logic using `class_subject_mappings` as the single source of truth; students and parents only see exams for assigned subjects.
- **Exam Results Persistence**: Results persist once submitted and are only removed if the exam is deleted.
- **Strict Exam Result Matching**: Ensures accurate retrieval of specific exam results.
- **Exam Retake System**: Allows flagging students for retakes, archiving previous submissions.
- **Report Card Unpublish Feature**: Admins can unpublish single or bulk published report cards, reverting status to 'finalized'.
- **User Recovery System (Recycle Bin)**: Soft-delete users instead of permanent deletion, with configurable retention period (7-90 days). Features include:
  - Admins can view/restore/delete Teachers, Students, and Parents
  - Super Admins can view/restore/delete all users including Admins
  - Configurable retention period in Super Admin Settings
  - Automatic daily cleanup at 2:00 AM removes expired deleted users
  - Full audit logging of recovery actions
  - Role-based permission enforcement to prevent privilege escalation

### System Design Choices
- **Stateless Backend**: Achieved by offloading database to Neon PostgreSQL and file storage to Cloudinary.
- **Drizzle ORM**: Used for type-safe database interactions.
- **Zod**: Utilized for schema validation.
- **Centralized Configuration**: For roles and grading scales.
- **Monorepo Structure**: Organized into `server/`, `client/`, and `shared/` directories.

## External Dependencies
- **Database**: Neon (PostgreSQL) with connection pooling
- **Cloud Storage**: Cloudinary CDN
- **Deployment**: Render (Backend), Vercel (Frontend)
- **Real-time Communication**: Socket.IO with optimization layer
- **Caching**: In-memory (L1) + Redis-ready (L2)