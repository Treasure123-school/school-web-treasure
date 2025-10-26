# School Portal - Detailed Implementation Roadmap

**Prepared for:** Treasure-Home School Management System  
**Date:** October 26, 2025  
**Status:** Planning Phase

---

## Overview

This roadmap outlines the step-by-step implementation plan for building a comprehensive School Portal with robust online exam capabilities. The plan is structured to deliver incremental value while maintaining system stability.

---

## Phase 1: Multi-Class & Multi-Subject Teacher Assignment System

**Goal:** Enable teachers to be assigned to multiple classes and subjects with proper tracking and permissions.

### Current State
- ✅ Teachers can be created
- ✅ Basic teacher profile exists
- ⚠️ No multi-class/subject assignment tracking

### Implementation Tasks

#### 1.1 Database Schema Enhancement
**File:** `shared/schema.ts`
- [ ] Create `teacherSubjectAssignments` table
  - `id` (primary key)
  - `teacherId` (foreign key to users)
  - `subjectId` (foreign key to subjects)
  - `classId` (foreign key to classes)
  - `academicTermId` (foreign key to academic_terms)
  - `isActive` (boolean)
  - `assignedAt` (timestamp)
  - `assignedBy` (foreign key to users - admin who made assignment)

#### 1.2 Storage Interface Updates
**File:** `server/storage.ts`
- [ ] Add `createTeacherSubjectAssignment()`
- [ ] Add `getTeacherAssignments(teacherId)`
- [ ] Add `getTeacherClassesBySubject(teacherId, subjectId)`
- [ ] Add `getClassTeachers(classId)`
- [ ] Add `updateTeacherAssignment()`
- [ ] Add `deleteTeacherAssignment()`

#### 1.3 API Endpoints
**File:** `server/routes.ts`
- [ ] `POST /api/teacher-assignments` - Assign teacher to class/subject
- [ ] `GET /api/teacher-assignments/:teacherId` - Get all assignments for a teacher
- [ ] `GET /api/teachers/:teacherId/classes` - Get all classes a teacher teaches
- [ ] `GET /api/classes/:classId/teachers` - Get all teachers for a class
- [ ] `DELETE /api/teacher-assignments/:id` - Remove assignment

#### 1.4 Frontend Components
**Files:** `client/src/pages/admin/` and `client/src/pages/teacher/`
- [ ] Create `TeacherAssignmentForm.tsx` - Form to assign teachers
- [ ] Create `TeacherScheduleView.tsx` - View teacher's class schedule
- [ ] Update `AdminDashboard.tsx` - Add teacher assignment management
- [ ] Update `TeacherDashboard.tsx` - Show assigned classes/subjects

#### 1.5 Permission Updates
- [ ] Ensure teachers can only view/manage exams for their assigned classes
- [ ] Restrict grading access to only assigned subjects
- [ ] Update student list filtering by teacher assignments

**Estimated Time:** 2-3 days  
**Priority:** HIGH  
**Dependencies:** None

---

## Phase 2: Enhanced Exam Delivery & Security

**Goal:** Implement advanced proctoring features and secure exam environment.

### Current State
- ✅ Basic exam creation exists
- ✅ Timed exams working
- ✅ Basic tab-switch detection
- ⚠️ No comprehensive proctoring logs

### Implementation Tasks

#### 2.1 Proctoring Enhancement
**File:** `shared/schema.ts`
- [ ] Create `examProctorLogs` table
  - `id` (primary key)
  - `sessionId` (foreign key to exam_sessions)
  - `studentId` (foreign key to users)
  - `eventType` (enum: 'tab_switch', 'window_blur', 'fullscreen_exit', 'copy_attempt', 'paste_attempt', 'right_click', 'devtools_open')
  - `eventData` (json)
  - `timestamp` (timestamp)
  - `severity` (enum: 'low', 'medium', 'high')

#### 2.2 Frontend Security Enhancements
**File:** `client/src/pages/portal/StudentExams.tsx`
- [ ] Add fullscreen enforcement with warning on exit
- [ ] Implement clipboard event blocking during exams
- [ ] Add right-click disable during exams
- [ ] Detect DevTools opening attempts
- [ ] Add visibility API to track tab/window focus
- [ ] Create proctoring warning modal system

#### 2.3 Backend Proctoring API
**File:** `server/routes.ts`
- [ ] `POST /api/exams/sessions/:sessionId/proctor-event` - Log proctoring events
- [ ] `GET /api/exams/sessions/:sessionId/proctor-logs` - Retrieve logs for review
- [ ] `GET /api/exams/:examId/proctoring-summary` - Get flagged students summary

#### 2.4 Exam Settings Configuration
**File:** `shared/schema.ts` - Update `exams` table
- [ ] Add `requireFullscreen` (boolean)
- [ ] Add `blockCopyPaste` (boolean)
- [ ] Add `blockRightClick` (boolean)
- [ ] Add `maxTabSwitches` (integer)
- [ ] Add `autoSubmitOnViolation` (boolean)

#### 2.5 Teacher Proctoring Dashboard
**File:** `client/src/pages/teacher/ExamProctoring.tsx`
- [ ] Create real-time proctoring dashboard
- [ ] Show active exam sessions
- [ ] Display flagged students with severity levels
- [ ] Export proctoring report for each exam

**Estimated Time:** 3-4 days  
**Priority:** HIGH  
**Dependencies:** Phase 1 (for teacher assignment verification)

---

## Phase 3: Automated Grading & Result Processing

**Goal:** Build robust auto-grading and result calculation engine.

### Current State
- ✅ Basic auto-grading for MCQs exists
- ✅ Exam results stored
- ⚠️ No manual grading interface
- ⚠️ No comprehensive result calculation

### Implementation Tasks

#### 3.1 Grading Configuration
**File:** `shared/schema.ts` - Update schema
- [ ] Add `gradingRubrics` table
  - `id` (primary key)
  - `examId` (foreign key)
  - `questionId` (foreign key)
  - `maxPoints` (decimal)
  - `rubricCriteria` (json)
  - `partialCreditAllowed` (boolean)

#### 3.2 Manual Grading Interface
**File:** `client/src/pages/teacher/ManualGrading.tsx`
- [ ] Create question-by-question grading view
- [ ] Support subjective answer grading
- [ ] Allow partial marks assignment
- [ ] Add teacher comments/feedback per question
- [ ] Bulk grading for similar answers

#### 3.3 Result Calculation Engine
**File:** `server/result-calculator.ts` (new file)
- [ ] Create `calculateExamResult(sessionId)` function
  - Calculate total score
  - Calculate percentage
  - Assign grade (A, B, C, D, E, F)
  - Calculate class average
  - Determine rank/position
- [ ] Create `recalculateClassResults(examId)` function
- [ ] Create `publishResults(examId)` function

#### 3.4 Grade Configuration
**File:** `shared/schema.ts` - Add to system settings
- [ ] Add grading scale configuration
  - A: 90-100%
  - B: 80-89%
  - C: 70-79%
  - D: 60-69%
  - E: 50-59%
  - F: Below 50%
- [ ] Allow custom grading scales per school

#### 3.5 API Endpoints
**File:** `server/routes.ts`
- [ ] `POST /api/exams/:examId/grade-question` - Grade specific question
- [ ] `POST /api/exams/:examId/calculate-results` - Trigger result calculation
- [ ] `POST /api/exams/:examId/publish-results` - Publish results to students
- [ ] `GET /api/exams/:examId/grading-progress` - Check grading completion status

**Estimated Time:** 4-5 days  
**Priority:** HIGH  
**Dependencies:** Phase 2 (exam security must be in place first)

---

## Phase 4: Consolidated Report Card System

**Goal:** Create comprehensive report cards combining all exam results, grades, and attendance.

### Current State
- ✅ Individual exam results exist
- ⚠️ No consolidated report card
- ⚠️ No term/semester aggregation

### Implementation Tasks

#### 4.1 Database Schema
**File:** `shared/schema.ts`
- [ ] Create `reportCards` table
  - `id` (primary key)
  - `studentId` (foreign key)
  - `academicTermId` (foreign key)
  - `classId` (foreign key)
  - `status` (enum: 'draft', 'published')
  - `publishedAt` (timestamp)
  - `generatedBy` (foreign key to users)
  
- [ ] Create `reportCardItems` table
  - `id` (primary key)
  - `reportCardId` (foreign key)
  - `subjectId` (foreign key)
  - `examScores` (json array of {examId, score, maxScore})
  - `averageScore` (decimal)
  - `grade` (varchar)
  - `teacherComment` (text)
  - `position` (integer) - Class rank for this subject

- [ ] Update `reportCards` table with additional fields
  - `totalScore` (decimal)
  - `totalPossibleScore` (decimal)
  - `overallPercentage` (decimal)
  - `overallGrade` (varchar)
  - `classPosition` (integer)
  - `attendancePercentage` (decimal)
  - `principalComment` (text)

#### 4.2 Report Card Generation Engine
**File:** `server/report-card-generator.ts` (new file)
- [ ] Create `generateReportCard(studentId, termId)` function
  - Fetch all exam results for the term
  - Calculate subject-wise averages
  - Calculate overall average
  - Determine class positions
  - Calculate attendance percentage
  - Compile teacher comments
- [ ] Create `generateClassReportCards(classId, termId)` function
- [ ] Create `generateTermReportCards(termId)` function

#### 4.3 PDF Report Card Template
**File:** `server/pdf-templates/report-card.ts` (new file)
- [ ] Design professional report card layout
  - School header with logo
  - Student information section
  - Subject-wise results table
  - Attendance summary
  - Teacher comments section
  - Principal's remarks
  - Grading scale legend
  - Parent signature area
- [ ] Add school customization options

#### 4.4 API Endpoints
**File:** `server/routes.ts`
- [ ] `POST /api/report-cards/generate/:studentId/:termId` - Generate single report card
- [ ] `POST /api/report-cards/generate-batch/:classId/:termId` - Generate for entire class
- [ ] `GET /api/report-cards/:id` - Get report card data
- [ ] `GET /api/report-cards/:id/pdf` - Download PDF report card
- [ ] `POST /api/report-cards/:id/publish` - Publish to student/parent
- [ ] `GET /api/students/:studentId/report-cards` - Get all report cards for student

#### 4.5 Frontend Components
**Files:** `client/src/pages/`
- [ ] Create `admin/ReportCardManager.tsx` - Admin interface for bulk generation
- [ ] Create `teacher/ReportCardReview.tsx` - Teacher comment entry
- [ ] Create `student/ReportCards.tsx` - Student view of published reports
- [ ] Create `parent/ChildReportCards.tsx` - Parent view of children's reports
- [ ] Create `components/ReportCardPreview.tsx` - Preview component

#### 4.6 Distribution System
- [ ] Email notification when report card is published
- [ ] SMS notification option (if enabled)
- [ ] In-app notification
- [ ] Download tracking (who downloaded when)

**Estimated Time:** 5-6 days  
**Priority:** MEDIUM-HIGH  
**Dependencies:** Phase 3 (results must be calculated first)

---

## Phase 5: Role-Based Dashboards & Views

**Goal:** Enhance dashboards for each role with exam schedules, results, and analytics.

### Implementation Tasks

#### 5.1 Teacher Dashboard Enhancements
**File:** `client/src/pages/teacher/TeacherDashboard.tsx`
- [ ] Show assigned classes and subjects
- [ ] Display upcoming exam schedule
- [ ] Show pending grading tasks with counts
- [ ] Display recent exam results statistics
- [ ] Add quick actions (Create Exam, Grade Exam, View Reports)
- [ ] Show student performance alerts

#### 5.2 Student Dashboard Enhancements
**File:** `client/src/pages/portal/StudentDashboard.tsx`
- [ ] Show upcoming exams with countdown timers
- [ ] Display recent exam results
- [ ] Show progress charts (grade trends over time)
- [ ] Display attendance summary
- [ ] Show available study resources by subject
- [ ] Add performance comparison with class average

#### 5.3 Parent Dashboard Enhancements
**File:** `client/src/pages/parent/ParentDashboard.tsx`
- [ ] Show all children's exam schedules
- [ ] Display recent results for all children
- [ ] Show attendance summary for each child
- [ ] Display teacher comments/feedback
- [ ] Add performance trends charts
- [ ] Show announcements and important dates

#### 5.4 Admin Dashboard Enhancements
**File:** `client/src/pages/admin/AdminDashboard.tsx`
- [ ] Show school-wide exam statistics
- [ ] Display grading completion rates
- [ ] Show report card generation status
- [ ] Display class performance comparisons
- [ ] Add teacher activity monitoring
- [ ] Show system usage analytics

**Estimated Time:** 3-4 days  
**Priority:** MEDIUM  
**Dependencies:** Phases 1-4 (need data from previous phases)

---

## Phase 6: Notification & Alert System

**Goal:** Build real-time notifications for exams, results, and communications.

### Implementation Tasks

#### 6.1 Notification Schema Enhancement
**File:** `shared/schema.ts` - Update `notifications` table
- [ ] Add notification types:
  - `exam_scheduled` - New exam scheduled
  - `exam_reminder` - Exam starting soon
  - `result_published` - Exam result available
  - `report_card_published` - Report card available
  - `assignment_created` - New teacher assignment
  - `grading_required` - Teacher needs to grade
  - `announcement_posted` - New school announcement

#### 6.2 Notification Service
**File:** `server/notification-service.ts` (new file)
- [ ] Create `sendNotification(userId, type, data)` function
- [ ] Create `sendBulkNotifications(userIds, type, data)` function
- [ ] Create `scheduleNotification(userId, type, data, sendAt)` function
- [ ] Create notification preference checking
- [ ] Add email notification integration
- [ ] Add SMS notification integration (optional)

#### 6.3 Real-Time Notifications
**File:** `server/websocket.ts` (if not exists, create)
- [ ] Set up WebSocket server for real-time updates
- [ ] Implement notification broadcasting
- [ ] Add connection management per user role
- [ ] Create notification queue system

#### 6.4 Notification Preferences
**File:** `shared/schema.ts`
- [ ] Create `userNotificationPreferences` table
  - `userId` (foreign key)
  - `notificationType` (varchar)
  - `emailEnabled` (boolean)
  - `smsEnabled` (boolean)
  - `inAppEnabled` (boolean)
  - `frequency` (enum: 'immediate', 'daily_digest', 'weekly_digest')

#### 6.5 Frontend Notification Center
**File:** `client/src/components/NotificationCenter.tsx`
- [ ] Create notification bell icon with count badge
- [ ] Add notification dropdown list
- [ ] Implement mark as read functionality
- [ ] Add notification filtering by type
- [ ] Create notification preferences page

#### 6.6 Automated Triggers
**File:** `server/notification-triggers.ts` (new file)
- [ ] Exam scheduled → Notify students and parents
- [ ] Exam 24 hours away → Send reminder
- [ ] Exam 1 hour away → Send final reminder
- [ ] Results published → Notify students and parents
- [ ] Report card published → Notify students and parents
- [ ] Teacher assigned → Notify teacher
- [ ] Grading pending → Remind teacher

**Estimated Time:** 4-5 days  
**Priority:** MEDIUM  
**Dependencies:** Phase 4 (report cards trigger notifications)

---

## Phase 7: Analytics & Performance Insights

**Goal:** Implement analytics dashboard with performance tracking and AI-ready data structure.

### Implementation Tasks

#### 7.1 Analytics Data Aggregation
**File:** `server/analytics-engine.ts` (new file)
- [ ] Create `calculateClassPerformance(classId, termId)` function
  - Average scores by subject
  - Pass rate percentage
  - Grade distribution
  - Trend over time
- [ ] Create `calculateSubjectAnalytics(subjectId, termId)` function
  - Class-wise comparison
  - Difficulty analysis (average scores)
  - Question-level analytics
- [ ] Create `calculateStudentAnalytics(studentId)` function
  - Performance trends over terms
  - Subject strengths/weaknesses
  - Improvement/decline alerts
  - Attendance correlation

#### 7.2 Analytics Dashboard
**File:** `client/src/pages/admin/Analytics.tsx`
- [ ] Create school-wide overview
  - Total students, classes, teachers
  - Exam completion rates
  - Average performance trends
- [ ] Add class comparison charts
  - Bar charts for class averages
  - Line charts for trends
- [ ] Add subject performance breakdown
  - Identify weak/strong subjects
  - Teacher effectiveness metrics
- [ ] Add student performance distribution
  - Grade distribution charts
  - Performance quartiles

#### 7.3 Teacher Analytics View
**File:** `client/src/pages/teacher/ClassAnalytics.tsx`
- [ ] Show class performance overview
- [ ] Display individual student progress
- [ ] Show question difficulty analysis
- [ ] Add intervention recommendations for struggling students

#### 7.4 Predictive Analytics (AI-Ready)
**File:** `server/ml-data-exporter.ts` (new file)
- [ ] Create data export for ML models
  - Student performance history
  - Attendance patterns
  - Exam difficulty ratings
  - Time-to-completion data
- [ ] Structure data for:
  - Performance prediction
  - At-risk student identification
  - Personalized learning recommendations
  - Optimal exam scheduling

#### 7.5 Export & Reporting
**File:** `server/routes.ts`
- [ ] `GET /api/analytics/export/class/:classId` - Export class data CSV
- [ ] `GET /api/analytics/export/subject/:subjectId` - Export subject analytics
- [ ] `GET /api/analytics/export/term/:termId` - Export term-wide data
- [ ] `GET /api/analytics/ml-dataset` - Export ML-ready dataset

**Estimated Time:** 4-5 days  
**Priority:** MEDIUM-LOW  
**Dependencies:** Phases 3-4 (need historical result data)

---

## Phase 8: API Documentation & Testing

**Goal:** Document all endpoints and create comprehensive test coverage.

### Implementation Tasks

#### 8.1 API Documentation
**File:** `API_DOCUMENTATION.md` (new file)
- [ ] Document all authentication endpoints
- [ ] Document user management endpoints
- [ ] Document exam management endpoints
- [ ] Document grading endpoints
- [ ] Document report card endpoints
- [ ] Document analytics endpoints
- [ ] Add request/response examples
- [ ] Add error code documentation
- [ ] Create Postman collection

#### 8.2 Integration Testing
**File:** `tests/integration/` (new directory)
- [ ] Create exam workflow tests
  - Create exam → Assign → Take → Grade → Results
- [ ] Create teacher assignment tests
- [ ] Create report card generation tests
- [ ] Create notification system tests

#### 8.3 End-to-End Testing
**File:** `tests/e2e/` (new directory)
- [ ] Student exam-taking flow
- [ ] Teacher grading flow
- [ ] Admin management flow
- [ ] Parent portal flow

#### 8.4 Performance Testing
- [ ] Load test exam delivery (100+ concurrent students)
- [ ] Load test result calculation (1000+ students)
- [ ] Test report card generation at scale
- [ ] Database query optimization

#### 8.5 Security Audit
- [ ] Review authentication mechanisms
- [ ] Test authorization boundaries
- [ ] Check for SQL injection vulnerabilities
- [ ] Verify data encryption
- [ ] Test session management
- [ ] Review proctoring data security

**Estimated Time:** 3-4 days  
**Priority:** MEDIUM  
**Dependencies:** Phases 1-7 (need features to test)

---

## Implementation Timeline

### Sprint 1 (Week 1-2)
- ✅ Teacher can create students (COMPLETED)
- Phase 1: Multi-Class & Multi-Subject Teacher Assignment
- Phase 2: Enhanced Exam Delivery & Security

### Sprint 2 (Week 3-4)
- Phase 3: Automated Grading & Result Processing
- Phase 4: Consolidated Report Card System (Start)

### Sprint 3 (Week 5-6)
- Phase 4: Consolidated Report Card System (Complete)
- Phase 5: Role-Based Dashboards & Views

### Sprint 4 (Week 7-8)
- Phase 6: Notification & Alert System
- Phase 7: Analytics & Performance Insights

### Sprint 5 (Week 9-10)
- Phase 8: API Documentation & Testing
- Bug fixes and polish
- Production deployment preparation

---

## Success Metrics

### Technical Metrics
- [ ] API response time < 500ms for 95% of requests
- [ ] Exam delivery supports 200+ concurrent users
- [ ] Report card generation < 5 seconds per student
- [ ] Zero data loss during exam submissions
- [ ] 99.9% uptime during exam periods

### Feature Metrics
- [ ] Teachers can assign multiple classes/subjects
- [ ] Exams support 5+ proctoring options
- [ ] Auto-grading accuracy > 99.5%
- [ ] Report cards include 10+ data points
- [ ] Notifications delivered in < 30 seconds

### User Experience Metrics
- [ ] Exam interface intuitive (< 2 min onboarding)
- [ ] Teachers can grade 50 exams in < 1 hour
- [ ] Report cards are readable and professional
- [ ] Parents receive timely updates (< 24 hours)

---

## Risk Mitigation

### Technical Risks
1. **Database Performance**
   - Mitigation: Index optimization, query caching, read replicas
   
2. **Concurrent Exam Load**
   - Mitigation: Load testing, horizontal scaling, CDN for static assets
   
3. **Data Loss During Submission**
   - Mitigation: Auto-save every 30s, retry logic, offline detection

### Operational Risks
1. **Teacher Training Required**
   - Mitigation: Video tutorials, in-app help, dedicated support
   
2. **Internet Connectivity Issues**
   - Mitigation: Offline exam option, grace period for submissions
   
3. **Exam Security Breaches**
   - Mitigation: Enhanced proctoring, randomization, audit logs

---

## Next Steps

1. **Review this roadmap** - Confirm priorities and timeline
2. **Mark Task 1 as in progress** - Start with Multi-Class Teacher Assignment
3. **Set up development environment** - Ensure all tools are ready
4. **Begin Phase 1 implementation** - Database schema first

---

## Notes for AI Builders

This roadmap is designed to be:
- **Modular**: Each phase can be built independently
- **Incremental**: Delivers value at each phase
- **Testable**: Each phase has clear success criteria
- **Extensible**: Built with AI integration in mind
- **Scalable**: Designed for growth from day one

All database changes use Supabase PostgreSQL exclusively (no in-memory storage).
All file uploads use Supabase Storage.
All authentication is JWT-based with bcrypt password hashing.

---

**Document Version:** 1.0  
**Last Updated:** October 26, 2025  
**Status:** Ready for Implementation
