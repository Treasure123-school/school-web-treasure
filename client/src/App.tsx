import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ROLE_IDS } from "@/lib/roles";
import { useGlobalRealtime } from "@/hooks/useGlobalRealtime";

// All pages eagerly loaded for instant navigation
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

// Super Admin pages
import SuperAdminDashboard from "@/pages/portal/SuperAdminDashboard";
import SuperAdminManagement from "@/pages/portal/SuperAdminManagement";
import SuperAdminSettings from "@/pages/portal/SuperAdminSettings";
import SuperAdminProfile from "@/pages/portal/SuperAdminProfile";
import SuperAdminLogs from "@/pages/portal/SuperAdminLogs";
import SuperAdminAllUsers from "@/pages/portal/SuperAdminAllUsers";

// Portal pages - eagerly loaded for instant navigation
import StudentDashboard from "@/pages/portal/StudentDashboard";
import StudentGrades from "@/pages/portal/StudentGrades";
import StudentAnnouncements from "@/pages/portal/StudentAnnouncements";
import StudentAttendance from "@/pages/portal/StudentAttendance";
import StudentMessages from "@/pages/portal/StudentMessages";
import StudentProfile from "@/pages/portal/StudentProfile";
import StudentProfileSetup from "@/pages/portal/StudentProfileSetup";
import StudentExams from "@/pages/portal/StudentExams";
import StudentStudyResources from "@/pages/portal/StudentStudyResources";
import StudentReportCard from "@/pages/portal/StudentReportCard";
import PortalGallery from "@/pages/portal/Gallery";
import TeacherDashboard from "@/pages/portal/TeacherDashboard";
import TeacherProfile from "@/pages/portal/TeacherProfile";
import TeacherProfileSetup from "@/pages/portal/TeacherProfileSetup";
import TeacherProfileAssignmentDashboard from "@/pages/portal/TeacherProfileAssignmentDashboard";
import AdminDashboard from "@/pages/portal/AdminDashboard";
import ParentDashboard from "@/pages/portal/ParentDashboard";
import StudentManagement from "@/pages/portal/StudentManagement";
import AttendanceManagement from "@/pages/portal/AttendanceManagement";
import TeachersManagement from "@/pages/portal/TeachersManagement";
import ClassesManagement from "@/pages/portal/ClassesManagement";
import SubjectsManagement from "@/pages/portal/SubjectsManagement";
import AnnouncementsManagement from "@/pages/portal/AnnouncementsManagement";
import ReportsManagement from "@/pages/portal/ReportsManagement";
import SettingsManagement from "@/pages/portal/SettingsManagement";
import TeacherGrades from "@/pages/portal/TeacherGrades";
import TeacherGradingQueue from "@/pages/portal/TeacherGradingQueue";
import TeacherClassResults from "@/pages/portal/TeacherClassResults";
import TeacherExamResults from "@/pages/portal/TeacherExamResults";
import ExamManagement from "@/pages/portal/ExamManagement";
import AdminExamOverview from "@/pages/portal/AdminExamOverview";
import HomepageManagement from "@/pages/portal/HomepageManagement";
import PerformanceMonitoring from "@/pages/portal/PerformanceMonitoring";
import ExamSessions from "@/pages/portal/ExamSessions";
import ExamReports from "@/pages/portal/ExamReports";
import ParentReportCards from "@/pages/portal/ParentReportCards";
import VacancyManagement from "@/pages/portal/VacancyManagement";
import UserManagement from "@/pages/portal/UserManagement";
import AuditLogs from "@/pages/portal/AuditLogs";
import ProfileOnboarding from "@/pages/ProfileOnboarding";
import ProfileCompletionMonitoring from "@/pages/portal/ProfileCompletionMonitoring";
import AdminRecoveryTools from "@/pages/portal/AdminRecoveryTools";
import AcademicTermsManagement from "@/pages/portal/AcademicTermsManagement";
import TeacherProfileVerification from "@/pages/portal/TeacherProfileVerification";
import TeacherExamAnalytics from "@/pages/portal/TeacherExamAnalytics";
import CreateExam from "@/pages/portal/CreateExam";

function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isEnabled, tableCount } = useGlobalRealtime();
  
  if (isEnabled && tableCount > 0) {
  }
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
      <Route path="/portal/superadmin/all-users">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.SUPER_ADMIN]}>
          <SuperAdminAllUsers />
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

      {/* Fallback to 404 */}
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
            <Toaster />
            <Router />
          </RealtimeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
export default App;