# Treasure-Home School Management System

## Overview
Treasure-Home is a comprehensive, production-ready school management system designed to streamline administrative and academic processes. It features JWT authentication, a robust PostgreSQL database, and cloud-based file storage. The system supports five distinct role-based access levels (Super Admin, Admin, Teacher, Student, Parent) and offers a wide array of features including a sophisticated exam system with auto-grading, real-time updates, attendance management, report card generation, and various communication tools. The project aims to provide an efficient, scalable, and secure platform for educational institutions.

## User Preferences
No specific user preferences were provided in the original `replit.md` file.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, utilizing Vite for tooling. UI components are developed using shadcn/ui (Radix UI + Tailwind CSS) for a modern and consistent design. Wouter is used for routing, and TanStack Query handles data fetching for an efficient user experience. Forms are managed with React Hook Form, integrated with Zod for validation.

### Technical Implementations
The system employs a dual-database strategy, exclusively using PostgreSQL (via Neon) for all environments to ensure cloud compatibility and scalability, removing SQLite. Cloudinary is integrated for robust cloud-based file storage in production, with a local filesystem fallback for development. JWT authentication is implemented without external providers. Real-time functionalities are powered by Socket.IO. The backend is an Express.js application built with Node.js and TypeScript, leveraging Drizzle ORM for database interactions.

### Feature Specifications
- **Authentication**: JWT tokens with 24-hour expiration, bcrypt password hashing, CORS, rate limiting, account lockout, 2FA support, and RBAC.
- **Role-Based Access Control**: Five distinct roles (Super Admin, Admin, Teacher, Student, Parent) with granular permissions, including hierarchical user creation rules.
- **Database Schema**: Over 40 tables covering user management, academic structure, exams, attendance, report cards, communication, and system administration.
- **Exam System**: Features include reliable submission with retry logic, instant auto-scoring for MCQs, anti-cheat measures (tab switching detection, copy/paste prevention, server-side timer), auto-submission, and real-time progress saving. Exam creation and management are teacher-centric with strong validation for student class and teacher assignments.
- **Report Card System**: Enhanced system with auto-population of exam scores, configurable grading scales (Standard, WAEC, Percentage), weighted scoring (Tests 40%, Exams 60%), teacher override capabilities with audit trails, a Draft → Finalized → Published workflow, score aggregation modes (last, best, average), class-wide generation with automatic position calculation, and PDF export. **NEW: Real-time auto-sync** - Exam scores are automatically synced to report cards immediately upon student exam submission. The sync respects manual teacher overrides (isOverridden flag) and provides feedback to students showing sync status.
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