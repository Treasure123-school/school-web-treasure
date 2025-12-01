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
- **Report Card System**: Enhanced auto-generation when students complete exams. Features a Draft → Finalized → Published status workflow with role-based visibility and real-time updates via Socket.IO. Supports configurable grading scales (Standard, WAEC, Percentage) with weighted scoring (Tests 40%, Exams 60%). Teachers have controls for bulk actions and score overrides with audit trails.
- **File Management**: Unified upload interface with Cloudinary CDN for production, handling image optimization, CDN distribution, and responsive sizing.
- **Department-Aware Subject Mapping**: Students are automatically assigned subjects based on class level and department. Report card generation prioritizes student's personal subject assignments. Teachers can be assigned to classes and subjects, with department-specific filtering for senior secondary classes.
- **Department Selection UI**: Student management includes department selection for senior secondary students (SS1-SS3) with conditional rendering and pre-population.
- **Teacher-Class-Subject Assignment Module**: Comprehensive module for managing teacher assignments to specific class-subject combinations. Features include:
  - Admin interface at `/portal/admin/teacher-assignments` for creating, editing, and deleting assignments
  - Assignment validation middleware (`validateTeacherCanCreateExam`, `validateTeacherCanEnterScores`, `validateTeacherCanViewResults`) that enforces teachers can only create exams and enter scores for their assigned class-subject combinations
  - Audit logging via `teacherAssignmentHistory` table tracking all assignment changes
  - Support for term-specific and session-based assignments with optional validity periods
  - Admin/Super Admin bypass - elevated roles can perform any exam operation
  - Ownership-based authorization for exam updates/deletes (creator or teacherInCharge)

### System Design Choices
- **Stateless Backend**: Achieved by offloading database to Neon PostgreSQL and file storage to Cloudinary.
- **Drizzle ORM**: Used for type-safe database interactions.
- **Zod**: Utilized for schema validation.
- **Centralized Configuration**: For roles and grading scales.
- **Monorepo Structure**: Organized into `server/`, `client/`, and `shared/` directories.

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **Cloud Storage**: Cloudinary CDN
- **Deployment**: Render (Backend), Vercel (Frontend)
- **Real-time Communication**: Socket.IO