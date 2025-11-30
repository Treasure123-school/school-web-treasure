# Treasure-Home School Management System

## Overview
Treasure-Home is a comprehensive, production-ready school management system designed to streamline administrative and academic processes. It features JWT authentication, a robust PostgreSQL database, and cloud-based file storage. The system supports five distinct role-based access levels (Super Admin, Admin, Teacher, Student, Parent) and offers a wide array of features including a sophisticated exam system with auto-grading, real-time updates, attendance management, report card generation, and various communication tools. The project aims to provide an efficient, scalable, and secure platform for educational institutions.

## User Preferences
- Username (admission ID format: THS-STU-###, THS-TCH-###) should be displayed prominently as the canonical student identifier
- Grading weights (40% Test, 60% Exam) should be visible in report card interfaces

## Recent Changes (November 2025)

### UI/UX Enhancements
- **Teacher Report Cards Page**: Redesigned with professional UI including enhanced student cards with prominent username display, avatar with gradient fallback, grade/percentage badges, position with award icons, and status indicators. Report card dialog header now shows student avatar, username badge, class info, and grading weights.
- **Super Admin Settings Page**: Added grading scale preview table showing all grade ranges with color-coded badges, points, and remarks. Preview updates dynamically when changing grading scales.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, utilizing Vite for tooling. UI components are developed using shadcn/ui (Radix UI + Tailwind CSS) for a modern and consistent design. Wouter is used for routing, and TanStack Query handles data fetching for an efficient user experience. Forms are managed with React Hook Form, integrated with Zod for validation.

### Technical Implementations
The system employs a dual-database strategy, exclusively using PostgreSQL (via Neon) for all environments to ensure cloud compatibility and scalability, removing SQLite. Cloudinary is integrated for robust cloud-based file storage in production, with a local filesystem fallback for development. JWT authentication is implemented without external providers. Real-time functionalities are powered by Socket.IO with comprehensive event coverage across 30+ mutation endpoints. The backend is an Express.js application built with Node.js and TypeScript, leveraging Drizzle ORM for database interactions.

### Real-time Event System (Socket.IO)
Comprehensive real-time updates implemented across all major features:
- **Exam Events**: Create, update, delete, publish/unpublish, submit, auto-grade, session start
- **Academic Terms**: Create, update, delete, mark-current (notifications to admins and teachers)
- **Student Management**: Create, update, delete (admin notifications)
- **Vacancies & Applications**: Create vacancy, close vacancy, create application, status updates
- **Exam Questions**: Create, update, delete, bulk operations, CSV import
- **Report Cards**: Generate, update, status changes (draft/finalized/published), remarks, score overrides

Security features:
- Class-scoped event broadcasting for exam publish events (only notifies authorized class members)
- Table subscription authorization based on user roles
- JWT-authenticated socket connections with role and class authorization data
- Event deduplication to prevent duplicate notifications

### Feature Specifications
- **Authentication**: JWT tokens with 24-hour expiration, bcrypt password hashing, CORS, rate limiting, account lockout, 2FA support, and RBAC.
- **Role-Based Access Control**: Five distinct roles (Super Admin, Admin, Teacher, Student, Parent) with granular permissions, including hierarchical user creation rules.
- **Database Schema**: Over 40 tables covering user management, academic structure, exams, attendance, report cards, communication, and system administration.
- **Exam System**: Features include reliable submission with retry logic, instant auto-scoring for MCQs, anti-cheat measures (tab switching detection, copy/paste prevention, server-side timer), auto-submission, and real-time progress saving. Exam creation and management are teacher-centric with strong validation for student class and teacher assignments.
- **Report Card System**: Enhanced auto-generation system that creates report cards automatically when students complete exams. Key features:
  - **Auto-Generation**: Report cards are created automatically when a student submits their first exam for a term. No manual generation required.
  - **Status Workflow**: Draft → Finalized → Published with proper locking and reversibility. Draft cards can be edited, finalized/published cards are locked.
  - **Role-Based Visibility**: Students and parents only see published report cards. Teachers/admins see all statuses.
  - **Real-time Updates**: Socket.IO events notify all portals (Teacher, Student, Parent) when report card status changes. Parents receive notifications when their child's report card is published.
  - **Configurable Grading**: Supports Standard, WAEC, and Percentage grading scales with weighted scoring (Tests 40%, Exams 60%).
  - **Teacher Controls**: Bulk actions (Finalize All Drafts, Publish All Finalized), score overrides with audit trails.
  - **Exam Score Sync**: Scores automatically sync from exam results, respecting teacher overrides (isOverridden flag).
- **File Management**: Unified upload interface, with Cloudinary CDN for production handling image optimization, CDN distribution, WebP support, and responsive sizing.
- **Deployment**: Stateless backend designed for horizontal scaling, deploying to Render (Node.js) for the backend and Vercel (React + Vite) for the frontend.

### System Design Choices
- **Stateless Backend**: Achieved by offloading database to Neon PostgreSQL and file storage to Cloudinary, eliminating the need for persistent disks on the backend server.
- **Drizzle ORM**: Used for type-safe database interactions with PostgreSQL.
- **Zod**: Utilized for schema validation across the stack.
- **Centralized Configuration**: `shared/role-constants.ts` for roles, `server/grading-config.ts` for grading scales.
- **Monorepo Structure**: Organized into `server/`, `client/`, and `shared/` directories.

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **Cloud Storage**: Cloudinary CDN
- **Deployment**: Render (Backend), Vercel (Frontend)
- **Real-time Communication**: Socket.IO
- **Testing**: Not specified, but implied for future contributions.