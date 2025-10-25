import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ROLE_IDS } from "@/lib/roles";

// Public pages - eager load for better initial performance
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

// Lazy load other public pages
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const Admissions = lazy(() => import("@/pages/Admissions"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const JobVacancy = lazy(() => import("@/pages/JobVacancy"));

// Super Admin pages
const SuperAdminDashboard = lazy(() => import("@/pages/portal/SuperAdminDashboard"));
const SuperAdminManagement = lazy(() => import("@/pages/portal/SuperAdminManagement"));
const SuperAdminSettings = lazy(() => import("@/pages/portal/SuperAdminSettings"));
const SuperAdminProfile = lazy(() => import("@/pages/portal/SuperAdminProfile"));
const SuperAdminLogs = lazy(() => import("@/pages/portal/SuperAdminLogs"));

// Lazy load all portal pages for optimal code splitting
const StudentDashboard = lazy(() => import("@/pages/portal/StudentDashboard"));
const StudentGrades = lazy(() => import("@/pages/portal/StudentGrades"));
const StudentAnnouncements = lazy(() => import("@/pages/portal/StudentAnnouncements"));
const StudentAttendance = lazy(() => import("@/pages/portal/StudentAttendance"));
const StudentMessages = lazy(() => import("@/pages/portal/StudentMessages"));
const StudentProfile = lazy(() => import("@/pages/portal/StudentProfile"));
const StudentProfileSetup = lazy(() => import("@/pages/portal/StudentProfileSetup"));
const StudentExams = lazy(() => import("@/pages/portal/StudentExams"));
const StudentStudyResources = lazy(() => import("@/pages/portal/StudentStudyResources"));
const StudentReportCard = lazy(() => import("@/pages/portal/StudentReportCard"));
const PortalGallery = lazy(() => import("@/pages/portal/Gallery"));
const TeacherDashboard = lazy(() => import("@/pages/portal/TeacherDashboard"));
const TeacherProfile = lazy(() => import("@/pages/portal/TeacherProfile"));
const TeacherProfileSetup = lazy(() => import("@/pages/portal/TeacherProfileSetup"));
const AdminDashboard = lazy(() => import("@/pages/portal/AdminDashboard"));
const ParentDashboard = lazy(() => import("@/pages/portal/ParentDashboard"));
const StudentManagement = lazy(() => import("@/pages/portal/StudentManagement"));
const AttendanceManagement = lazy(() => import("@/pages/portal/AttendanceManagement"));
const TeachersManagement = lazy(() => import("@/pages/portal/TeachersManagement"));
const ClassesManagement = lazy(() => import("@/pages/portal/ClassesManagement"));
const SubjectsManagement = lazy(() => import("@/pages/portal/SubjectsManagement"));
const AnnouncementsManagement = lazy(() => import("@/pages/portal/AnnouncementsManagement"));
const ReportsManagement = lazy(() => import("@/pages/portal/ReportsManagement"));
const SettingsManagement = lazy(() => import("@/pages/portal/SettingsManagement"));
const TeacherGrades = lazy(() => import("@/pages/portal/TeacherGrades"));
const TeacherGradingQueue = lazy(() => import("@/pages/portal/TeacherGradingQueue"));
const TeacherClassResults = lazy(() => import("@/pages/portal/TeacherClassResults"));
const TeacherExamResults = lazy(() => import("@/pages/portal/TeacherExamResults"));
const ExamManagement = lazy(() => import("@/pages/portal/ExamManagement"));
const HomepageManagement = lazy(() => import("@/pages/portal/HomepageManagement"));
const PerformanceMonitoring = lazy(() => import("@/pages/portal/PerformanceMonitoring"));
const ExamSessions = lazy(() => import("@/pages/portal/ExamSessions"));
const ExamReports = lazy(() => import("@/pages/portal/ExamReports"));
const ParentReportCards = lazy(() => import("@/pages/portal/ParentReportCards"));
const PendingApprovals = lazy(() => import("@/pages/portal/PendingApprovals"));
const VacancyManagement = lazy(() => import("@/pages/portal/VacancyManagement"));
const UserManagement = lazy(() => import("@/pages/portal/UserManagement"));
const AuditLogs = lazy(() => import("@/pages/portal/AuditLogs"));
const ProfileOnboarding = lazy(() => import("@/pages/ProfileOnboarding"));
const ProfileCompletionMonitoring = lazy(() => import("@/pages/portal/ProfileCompletionMonitoring"));
const AdminRecoveryTools = lazy(() => import("@/pages/portal/AdminRecoveryTools"));
const AcademicTermsManagement = lazy(() => import("@/pages/portal/AcademicTermsManagement"));
const TeacherProfileVerification = lazy(() => import("@/pages/portal/TeacherProfileVerification"));

function Router() {
  return (
    <Suspense fallback={null}>
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
          <SuperAdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/admins">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/superadmin/logs">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminLogs />
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
      <Route path="/portal/student/profile-setup">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.STUDENT]}>
          <StudentProfileSetup />
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
      <Route path="/portal/teacher/profile-setup">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherProfileSetup />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/pending-approvals">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <PendingApprovals />
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
      <Route path="/portal/teacher/attendance">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <AttendanceManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/grades">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <TeacherGrades />
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
      <Route path="/portal/teacher/exams">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.TEACHER]}>
          <ExamManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/exams">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <ExamManagement />
        </ProtectedRoute>
      </Route>
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

      {/* New Exam System Routes */}
      <Route path="/portal/exam-sessions">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <ExamSessions />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/grading-queue">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <TeacherGradingQueue />
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

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;