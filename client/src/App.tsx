import { Switch, Route } from "wouter";
import { lazy, Suspense, ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ROLE_IDS } from "@/lib/roles";
import { PageContentSkeleton } from "@/components/ui/skeletons";
import { SyncIndicator } from "@/components/SyncIndicator";

function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  );
}

// Public pages - eagerly loaded for instant navigation
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Gallery from "@/pages/Gallery";
import Admissions from "@/pages/Admissions";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import JobVacancy from "@/pages/JobVacancy";

// Super Admin pages - lazy loaded
const SuperAdminDashboard = lazy(() => import("@/pages/portal/SuperAdminDashboard"));
const SuperAdminManagement = lazy(() => import("@/pages/portal/SuperAdminManagement"));
const SuperAdminSettings = lazy(() => import("@/pages/portal/SuperAdminSettings"));
const SuperAdminProfile = lazy(() => import("@/pages/portal/SuperAdminProfile"));
const SuperAdminLogs = lazy(() => import("@/pages/portal/SuperAdminLogs"));
const SuperAdminAllUsers = lazy(() => import("@/pages/portal/SuperAdminAllUsers"));
const SuperAdminAuthenticationSettings = lazy(() => import("@/pages/portal/SuperAdminAuthenticationSettings"));
const SuperAdminPlaceholder = lazy(() => import("@/pages/portal/SuperAdminPlaceholder"));

// Portal pages - lazy loaded for code splitting
const StudentDashboard = lazy(() => import("@/pages/portal/StudentDashboard"));
const StudentGrades = lazy(() => import("@/pages/portal/StudentGrades"));
const StudentAnnouncements = lazy(() => import("@/pages/portal/StudentAnnouncements"));
const StudentAttendance = lazy(() => import("@/pages/portal/StudentAttendance"));
const StudentMessages = lazy(() => import("@/pages/portal/StudentMessages"));
const StudentProfile = lazy(() => import("@/pages/portal/StudentProfile"));
const StudentExams = lazy(() => import("@/pages/portal/StudentExams"));
const StudentExamResults = lazy(() => import("@/pages/portal/StudentExamResults"));
const StudentStudyResources = lazy(() => import("@/pages/portal/StudentStudyResources"));
const StudentReportCard = lazy(() => import("@/pages/portal/StudentReportCard"));
const PortalGallery = lazy(() => import("@/pages/portal/Gallery"));
const TeacherDashboard = lazy(() => import("@/pages/portal/TeacherDashboard"));
const TeacherProfile = lazy(() => import("@/pages/portal/TeacherProfile"));
const TeacherProfileAssignmentDashboard = lazy(() => import("@/pages/portal/TeacherProfileAssignmentDashboard"));
const AdminDashboard = lazy(() => import("@/pages/portal/AdminDashboard"));
const ParentDashboard = lazy(() => import("@/pages/portal/ParentDashboard"));
const StudentManagement = lazy(() => import("@/pages/portal/StudentManagement"));
const TeachersManagement = lazy(() => import("@/pages/portal/TeachersManagement"));
const ClassesManagement = lazy(() => import("@/pages/portal/ClassesManagement"));
const SubjectsManagement = lazy(() => import("@/pages/portal/SubjectsManagement"));
const AnnouncementsManagement = lazy(() => import("@/pages/portal/AnnouncementsManagement"));
const ReportsManagement = lazy(() => import("@/pages/portal/ReportsManagement"));
const SettingsManagement = lazy(() => import("@/pages/portal/SettingsManagement"));
const TeacherGradingQueue = lazy(() => import("@/pages/portal/TeacherGradingQueue"));
const TeacherClassResults = lazy(() => import("@/pages/portal/TeacherClassResults"));
const TeacherExamResults = lazy(() => import("@/pages/portal/TeacherExamResults"));
const ExamManagement = lazy(() => import("@/pages/portal/ExamManagement"));
const AdminExamOverview = lazy(() => import("@/pages/portal/AdminExamOverview"));
const HomepageManagement = lazy(() => import("@/pages/portal/HomepageManagement"));
const PerformanceMonitoring = lazy(() => import("@/pages/portal/PerformanceMonitoring"));
const ExamSessions = lazy(() => import("@/pages/portal/ExamSessions"));
const ExamReports = lazy(() => import("@/pages/portal/ExamReports"));
const ParentReportCards = lazy(() => import("@/pages/portal/ParentReportCards"));
const VacancyManagement = lazy(() => import("@/pages/portal/VacancyManagement"));
const UserManagement = lazy(() => import("@/pages/portal/UserManagement"));
const AuditLogs = lazy(() => import("@/pages/portal/AuditLogs"));
const ProfileOnboarding = lazy(() => import("@/pages/ProfileOnboarding"));
const ProfileCompletionMonitoring = lazy(() => import("@/pages/portal/ProfileCompletionMonitoring"));
const AdminRecoveryTools = lazy(() => import("@/pages/portal/AdminRecoveryTools"));
const AcademicTermsManagement = lazy(() => import("@/pages/portal/AcademicTermsManagement"));
const TeacherProfileVerification = lazy(() => import("@/pages/portal/TeacherProfileVerification"));
const TeacherExamAnalytics = lazy(() => import("@/pages/portal/TeacherExamAnalytics"));
const CreateExam = lazy(() => import("@/pages/portal/CreateExam"));
const TeacherReportCards = lazy(() => import("@/pages/portal/TeacherReportCards"));
const TeacherRecentExamResults = lazy(() => import("@/pages/portal/TeacherRecentExamResults"));
const PortalComingSoon = lazy(() => import("@/pages/portal/PortalComingSoon"));
const StudentSubjectAssignment = lazy(() => import("@/pages/portal/StudentSubjectAssignment"));
const TeacherAssignmentManagement = lazy(() => import("@/pages/portal/TeacherAssignmentManagement"));
const ClassSubjectMapping = lazy(() => import("@/pages/portal/ClassSubjectMapping"));
const DepartmentSubjectMapping = lazy(() => import("@/pages/portal/DepartmentSubjectMapping"));
const AssignSubjectTeachers = lazy(() => import("@/pages/portal/AssignSubjectTeachers"));
const ReportCardSubjectRules = lazy(() => import("@/pages/portal/ReportCardSubjectRules"));
const StudentSubjects = lazy(() => import("@/pages/portal/StudentSubjects"));

// Real-time updates are now handled by Socket.IO on the backend
function RealtimeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
function Router() {
  return (
    <Switch>
        {/* Public pages */}
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/gallery" component={Gallery} />
        <Route path="/admissions" component={Admissions} />
        <Route path="/job-vacancy" component={JobVacancy} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />

      {/* Super Admin Portal Routes */}
      <Route path="/portal/superadmin">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <PageSuspense><SuperAdminDashboard /></PageSuspense>
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/admins">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <PageSuspense><SuperAdminManagement /></PageSuspense>
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/logs">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <PageSuspense><SuperAdminLogs /></PageSuspense>
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/settings">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/profile">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/all-users">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminAllUsers />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/settings/authentication">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminAuthenticationSettings />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Users Management Routes */}
      <Route path="/portal/superadmin/users/students">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Student Management" category="Users" description="Manage all student accounts and records" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/users/teachers">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Teacher Management" category="Users" description="Manage all teacher accounts and profiles" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/users/parents">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Parent Management" category="Users" description="Manage all parent/guardian accounts" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/users/roles">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Roles & Permissions" category="Users" description="Configure user roles and permission levels" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/users/access-control">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Login Access Control" category="Users" description="Manage login restrictions and access policies" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Academics Routes */}
      <Route path="/portal/superadmin/academics/classes">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Classes & Levels" category="Academics" description="Configure class structure and academic levels" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/academics/subjects">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Subjects" category="Academics" description="Manage academic subjects and curriculum areas" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/academics/timetable">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Timetable" category="Academics" description="Configure school timetable and schedules" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/academics/attendance">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Attendance Setup" category="Academics" description="Configure attendance tracking settings" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/academics/curriculum">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Curriculum" category="Academics" description="Manage curriculum and scheme of work" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Subject Manager Routes */}
      <Route path="/portal/superadmin/subject-manager/subjects">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SubjectsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/subject-manager/class-mapping">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <ClassSubjectMapping />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/subject-manager/department-mapping">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <DepartmentSubjectMapping />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/subject-manager/assign-teachers">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <AssignSubjectTeachers />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/subject-manager/report-rules">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <ReportCardSubjectRules />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Results Routes */}
      <Route path="/portal/superadmin/results/exams">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Exam Setup" category="Results" description="Configure exam types and settings" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/results/ca">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Continuous Assessment" category="Results" description="Configure CA rules and weightings" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/results/grades">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Grade Boundaries" category="Results" description="Set grade boundaries and grading scales" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/results/processing">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Result Processing" category="Results" description="Configure result processing rules" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/results/publishing">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Result Publishing" category="Results" description="Control result publication settings" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin School Operations Routes */}
      <Route path="/portal/superadmin/operations/departments">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Departments" category="Operations" description="Manage school departments" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/operations/calendar">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="School Calendar" category="Operations" description="Manage academic calendar and holidays" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/operations/events">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Events & Notices" category="Operations" description="Manage school events and announcements" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/operations/sessions">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Sessions & Terms" category="Operations" description="Configure academic sessions and terms" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/operations/promotions">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Promotion Settings" category="Operations" description="Configure student promotion rules" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Finance Routes */}
      <Route path="/portal/superadmin/finance/fees">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Fees Setup" category="Finance" description="Configure fee structures and amounts" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/finance/payments">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Payment Records" category="Finance" description="View and manage payment records" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/finance/categories">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Fee Categories" category="Finance" description="Manage fee categories and types" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/finance/discounts">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Discounts & Waivers" category="Finance" description="Configure discounts and fee waivers" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/finance/transactions">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Transactions" category="Finance" description="View all financial transactions" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Communication Routes */}
      <Route path="/portal/superadmin/communication/sms">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="SMS Settings" category="Communication" description="Configure SMS gateway and templates" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/communication/email">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Email Settings" category="Communication" description="Configure email server and templates" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/communication/notifications">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Notifications" category="Communication" description="Manage notification broadcasts" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/communication/logs">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Messaging Logs" category="Communication" description="View all messaging activity logs" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/communication/templates">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Templates" category="Communication" description="Manage message templates" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Content Routes */}
      <Route path="/portal/superadmin/content/assignments">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Assignments" category="Content" description="Manage school assignments" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/content/lessons">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Lesson Notes" category="Content" description="Manage lesson notes and materials" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/content/library">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="E-Library" category="Content" description="Manage digital library resources" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/content/files">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="File Manager" category="Content" description="Manage uploaded files and media" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin System Settings Routes */}
      <Route path="/portal/superadmin/settings/security">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Security Policies" category="Settings" description="Configure security policies and rules" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/settings/branding">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Branding" category="Settings" description="Customize school branding and appearance" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/settings/api-keys">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="API Keys" category="Settings" description="Manage API keys and integrations" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/settings/backup">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Backup & Restore" category="Settings" description="Manage data backups and restoration" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/settings/integrations">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Integrations" category="Settings" description="Manage third-party integrations" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Audit Routes */}
      <Route path="/portal/superadmin/audit/login-history">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Login History" category="Audit" description="View user login history and sessions" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/audit/activity">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Activity Tracking" category="Audit" description="Track user activity across the system" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/audit/errors">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Error Logs" category="Audit" description="View system error logs" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/audit/violations">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Access Violations" category="Audit" description="Monitor security violations and attempts" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Support Routes */}
      <Route path="/portal/superadmin/support/requests">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Help Requests" category="Support" description="View and manage help requests" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/support/tickets">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Tickets" category="Support" description="Manage support tickets" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/support/docs">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Documentation" category="Support" description="Access system documentation" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/support/faq">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="FAQ" category="Support" description="Manage frequently asked questions" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Developer Tools Routes */}
      <Route path="/portal/superadmin/developer/schema">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Database Schema" category="Developer" description="View database schema and tables" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/developer/api">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="API Playground" category="Developer" description="Test API endpoints" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/developer/webhooks">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Webhooks" category="Developer" description="Configure webhook integrations" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/developer/environment">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Environment" category="Developer" description="View environment configuration" />
        </ProtectedRoute>
      </Route>

      {/* Super Admin Account Routes */}
      <Route path="/portal/superadmin/account/password">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminPlaceholder title="Change Password" category="Account" description="Update your password securely" />
        </ProtectedRoute>
      </Route>

      {/* Profile Onboarding - Available to all authenticated users */}
      <Route path="/portal/onboarding">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT, ROLE_IDS.TEACHER, ROLE_IDS.PARENT, ROLE_IDS.ADMIN]}>
          <ProfileOnboarding />
        </ProtectedRoute>
      </Route>

      {/* Protected Portal pages */}
      <Route path="/portal/student">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/exams">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentExams />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/exam-results">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentExamResults />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/grades">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentGrades />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/announcements">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/attendance">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentAttendance />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/messages">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentMessages />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/report-card">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentReportCard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/profile">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/gallery">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <PortalGallery />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/study-resources">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentStudyResources />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/subjects">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentSubjects />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/profile">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/profile-assignments">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherProfileAssignmentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/job-vacancies">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <VacancyManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/users">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <UserManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/audit-logs">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <AuditLogs />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/profile-completion">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <ProfileCompletionMonitoring />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/students">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <StudentManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/teachers">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <TeachersManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/teacher-verification">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <TeacherProfileVerification />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/classes">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <ClassesManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/subjects">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <SubjectsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/student-subjects">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.SUPER_ADMIN]}>
          <StudentSubjectAssignment />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/teacher-assignments">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.SUPER_ADMIN]}>
          <TeacherAssignmentManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/announcements">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <AnnouncementsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/reports">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <ReportsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/performance">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <PerformanceMonitoring />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/homepage-management">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <HomepageManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/gallery">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <PortalGallery />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/academic-terms">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <AcademicTermsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/settings">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <SettingsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/recovery-tools">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <AdminRecoveryTools />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/coming-soon">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <PortalComingSoon />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/grading-queue">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherGradingQueue />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/results/class/:classId">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherClassResults />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/results/exam/:examId">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherExamResults />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/exams/create">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <CreateExam />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/exams/manage">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <ExamManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/exams">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <ExamManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/exam-analytics">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherExamAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/report-cards">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherReportCards />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/recent-exam-results">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherRecentExamResults />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/exams">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <AdminExamOverview />
        </ProtectedRoute>
      </Route>
      {/* Admin does NOT have grading queue - that's teacher-only */}
      <Route path="/portal/parent">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.PARENT]}>
          <ParentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/parent/reports">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.PARENT]}>
          <ParentReportCards />
        </ProtectedRoute>
      </Route>

      {/* Admin Exam System Routes - NO GRADING QUEUE (Teacher-only) */}
      <Route path="/portal/exam-sessions">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <ExamSessions />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/exam-reports">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <ExamReports />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/exam-analytics">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <ExamReports />
        </ProtectedRoute>
      </Route>

      {/* Portal catch-all routes - show Coming Soon for undefined portal pages */}
      <Route path="/portal/superadmin/:rest*">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <PortalComingSoon />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/:rest*">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <PortalComingSoon />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/:rest*">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <PortalComingSoon />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/:rest*">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <PortalComingSoon />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/parent/:rest*">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.PARENT]}>
          <PortalComingSoon />
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 for non-portal pages */}
      <Route component={NotFound} />
    </Switch>
  );
}
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RealtimeProvider>
            <SyncIndicator />
            <Toaster />
            <Router />
          </RealtimeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
export default App;