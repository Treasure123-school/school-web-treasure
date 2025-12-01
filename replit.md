# Treasure-Home School Management System

## Overview
Treasure-Home is a comprehensive, production-ready school management system designed to streamline administrative and academic processes. It features JWT authentication, a robust PostgreSQL database, and cloud-based file storage. The system supports five distinct role-based access levels (Super Admin, Admin, Teacher, Student, Parent) and offers a wide array of features including a sophisticated exam system with auto-grading, real-time updates, attendance management, report card generation, and various communication tools. The project aims to provide an efficient, scalable, and secure platform for educational institutions.

## User Preferences
- Username (admission ID format: THS-STU-###, THS-TCH-###) should be displayed prominently as the canonical student identifier
- Grading weights (40% Test, 60% Exam) should be visible in report card interfaces

## Recent Changes (December 2025)

### Phase 1-10 Implementation Complete (Dec 1, 2025)
All phases of the teacher-student-department-class assignment and report card automation system have been verified and are fully operational:

**Completed Phases:**
1. **Data Model & Migrations** - Database schema with indexes on `subjects.category` and `students.department`
2. **Subject Management UI** - Category dropdown (General/Science/Art/Commercial) with filtering
3. **Teacher Creation & Assignment** - Department-based subject filtering for SS1-SS3 assignments
4. **Student Creation & Department** - Department selection required for senior secondary students
5. **Auto-Generate Report Card Pipeline** - `syncExamScoreToReportCard` triggers after exam submission
6. **Grading Logic & Admin Settings** - Test/Exam weights (40%/60% default), grading scales
7. **Teacher Report Card Page** - Inline editing, score override, status management
8. **Student & Parent Views** - Real-time Socket.IO delivery when report cards are published
9. **Exam to Report Card Consistency** - Weighted scoring correctly applied
10. **Testing & Documentation** - All features verified and working

**Key Features:**
- Automatic report card generation when students submit exams
- Real-time updates via Socket.IO for all user roles
- Configurable grading weights (40% Test / 60% Exam by default)
- Multiple grading scales: Standard (A-F), WAEC (A1-F9), Percentage-based
- Department-specific subject assignment for SS1-SS3 students
- Teacher score overrides with audit trail

### Department-Aware Subject Mapping System (Dec 1, 2025)
Critical fixes to properly wire up the department-based subject assignment tables:

#### Student Creation Auto-Assignment
- When a student is created, subjects are automatically assigned based on class level and department
- For SS1-SS3 students with department: Assigns general + department-specific subjects
- For non-SS students: Assigns general subjects only
- Uses `autoAssignSubjectsToStudent` function from storage layer

#### Report Card Sync Priority System
- `syncExamScoreToReportCard` now prioritizes `studentSubjectAssignments` table
- **Priority 1**: Uses student's personal subject assignments if they exist
- **Priority 2**: Falls back to class-level filtering via `teacherClassAssignments`
- Maintains department filtering for senior secondary students

#### Teacher Assignment Class-Subject Mapping
- When a teacher is assigned to a class/subject, also creates a `classSubjectMapping`
- Sets department on the mapping for SS class department-specific subjects
- Uses conflict-safe logic (onConflictDoNothing) to handle duplicates gracefully

#### Duplicate Handling
- `createClassSubjectMapping` now uses `onConflictDoNothing()` to prevent unique constraint violations
- Falls back to fetching existing mapping if insert conflicts

### Module 1: Student Subject Assignment System (Dec 1, 2025)
Complete implementation of the teacher-student-department-class assignment system with automated report card generation:

#### New Database Tables
- **student_subject_assignments**: Tracks which subjects each student is enrolled in
  - Columns: id, studentId, subjectId, assignedBy, assignedAt, isActive, notes
  - Supports manual and automatic assignment based on class level and department
  - Foreign key cascade delete for student/subject removal
  
- **class_subject_mappings**: Links subjects to class levels with department categorization
  - Columns: id, classId, subjectId, isCompulsory, department, createdBy, createdAt
  - Enables department-specific subject requirements (Science, Art, Commercial)

#### Storage Layer
- `getStudentSubjectAssignments(studentId)`: Get all subject assignments for a student
- `createStudentSubjectAssignment(data)`: Assign a subject to a student
- `deleteStudentSubjectAssignment(id)`: Remove a subject assignment
- `autoAssignSubjectsToStudent(studentId, assignedBy)`: Auto-assign subjects based on class level and department
- `getClassSubjectMappings(classId)`: Get subject mappings for a class
- `createClassSubjectMapping(data)`: Create a class-subject mapping
- `deleteClassSubjectMapping(id)`: Remove a class-subject mapping

#### API Endpoints
- `GET /api/student-subject-assignments/:studentId` - Get student's assigned subjects
- `POST /api/student-subject-assignments` - Assign subject to student
- `DELETE /api/student-subject-assignments/:id` - Remove assignment
- `POST /api/student-subject-assignments/auto-assign` - Auto-assign based on class/department
- `GET /api/class-subject-mappings/:classId` - Get class-subject mappings
- `POST /api/class-subject-mappings` - Create class-subject mapping
- `DELETE /api/class-subject-mappings/:id` - Remove mapping
- `GET /api/subjects/by-category` - Get subjects by category

#### Student Subject Assignment UI
- New admin page at `/admin/academics/student-subjects`
- Features student search by name/username, class and department filters
- Auto-assign button to automatically assign subjects based on student's class and department
- Manual assignment via multi-select dropdown
- Remove individual assignments with confirmation
- Navigation added under "Academics" section in admin portal

#### Report Card Integration
- `generateReportCardsForClass` now uses student subject assignments instead of class-level subjects
- Validates subjects exist and are active before creating report card items
- Falls back to class-level subjects if no student assignments exist
- Auto-grading uses system settings for test/exam weights (configurable, default 40%/60%)
- Graceful handling when no valid subjects found for a student

### Department Selection UI in Student Management (Dec 1, 2025)
Enhanced StudentManagement.tsx with department selection for senior secondary students:

#### Create Student Form
- **Department Dropdown**: When selecting SS1, SS2, or SS3 as the class, a department selection dropdown appears
- **Three Departments**: Science, Art, Commercial with color-coded icons
- **Smart Clearing**: Department is automatically cleared when switching to a non-senior class
- **Required for SS**: The dropdown is conditionally rendered only for senior secondary classes

#### Edit Student Form
- **Pre-populated Department**: When editing an existing student, the department is pre-populated
- **Consistent Behavior**: Same conditional rendering and clearing logic as the create form

#### Student Table Display
- **Department Column**: New column showing student's department with color-coded badges
  - Science: Blue badge
  - Art: Purple badge
  - Commercial: Green badge
- **Both Views**: Department displayed in both mobile card view and desktop table view

### Phase 4 & 5: Department-Based Exam & Report Card Filtering (Dec 1, 2025)
Enhanced department-based filtering for Senior Secondary (SS1-SS3) students:

#### Exam Visibility Filtering (GET /api/exams)
- **SS students with department**: See exams for general + department-specific subjects only
- **SS students without department**: See only general subject exams (awaiting department assignment)
- **Non-SS students**: See all published exams for their class
- Proper trimming + lowercase normalization for robust string comparison
- Empty/whitespace department values treated as undefined

#### Report Card Auto-Generation (syncExamScoreToReportCard)
- Report card items now created only for subjects relevant to the student
- **Class-subject scoping**: Uses teacher_class_assignments table to determine assigned subjects
- **Graceful fallback**: If no teacher assignments exist, uses department-only filtering
- **SS students with department**: General + department subjects
- **SS students without department**: Only general subjects
- **Non-SS students**: All subjects assigned to their class
- Enhanced logging for subject filtering and class assignment count

#### Subject API Enhancements
- Added trimming for category and department query parameters
- Case-insensitive filtering for consistent results

## Recent Changes (November 2025)

### Phase 2 & 3: Subject Categories and Teacher Assignment UI (Nov 30, 2025)
Enhanced UI for managing subject categories and teacher-class-subject assignments:

#### SubjectsManagement.tsx Enhancements
- **Category Field**: Added dropdown for categorizing subjects as General, Science, Art, or Commercial
- **Category Filter**: Added filter dropdown to filter subjects by category
- **Category Column**: Added new column in subjects table showing category with color-coded badges
- **Category Icons**: Different icons for each category (BookMarked, GraduationCap, Palette, Briefcase)

#### TeachersManagement.tsx Enhancements
- **Assignment Dialog**: New "Assign" button opens a dialog to manage teacher assignments
- **Class Selection**: Teachers can be assigned to specific classes
- **Department Selection**: For SS1-SS3 (Senior Secondary) classes, department selection is required
- **Subject Filtering**: Subjects are filtered based on class level and department:
  - General subjects are available to all classes
  - Science/Art/Commercial subjects only appear for senior secondary classes with matching department
- **Multi-Subject Selection**: Teachers can select multiple subjects to assign at once
- **Assignment Display**: Current assignments are displayed grouped by class with subjects as removable badges
- **Remove Assignment**: Individual subject assignments can be removed via X button

### Phase 1: Department & Assignment Schema Update (Nov 30, 2025)
Schema enhancements for teacher-student-department-class assignment and report card automation:
- **subjects.category**: New column for categorizing subjects as 'general', 'science', 'art', or 'commercial' (default: 'general')
- **students.department**: New column for SS1-SS3 student department assignment (nullable for JSS students)
- **reportCardItems.teacherId**: New column to track which teacher is responsible for each subject grade
- **teacherClassAssignments.department**: New column linking assignments to departments
- **teacherClassAssignments.assignedBy**: New column to track who created the assignment
- New indexes: `teacher_class_assignments_dept_idx`, `report_card_items_teacher_idx`

#### Department Auto-Assignment & Validation
- **Senior Secondary Detection**: Uses `classes.level` field (value: "Senior Secondary") for reliable detection
- **Department Validation**: Only SS1-SS3 students can have department assignments
- **Auto-Clear on Class Change**: Department is automatically cleared when student moves from SS class to non-SS class
- **Case-Insensitive Filtering**: Subject filtering by category/department uses lowercase comparison
- **Valid Departments**: science, art, commercial (normalized to lowercase)

### UI/UX Enhancements
- **Teacher Report Cards Page**: Redesigned with professional UI including enhanced student cards with prominent username display, avatar with gradient fallback, grade/percentage badges, position with award icons, and status indicators. Report card dialog header now shows student avatar, username badge, class info, and grading weights.
- **Super Admin Settings Page**: Added grading scale preview table showing all grade ranges with color-coded badges, points, and remarks. Preview updates dynamically when changing grading scales.
- **Teacher Attendance Management**: Temporarily disabled and redirected to Coming Soon page

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