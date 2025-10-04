import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ROLE_IDS } from "@/lib/roles";

// Public pages
import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Gallery from "@/pages/Gallery";
import Admissions from "@/pages/Admissions";
import Login from "@/pages/Login";

// Portal pages
import StudentDashboard from "@/pages/portal/StudentDashboard";
import StudentGrades from "@/pages/portal/StudentGrades";
import StudentAnnouncements from "@/pages/portal/StudentAnnouncements";
import StudentAttendance from "@/pages/portal/StudentAttendance";
import StudentMessages from "@/pages/portal/StudentMessages";
import StudentProfile from "@/pages/portal/StudentProfile";
import StudentExams from "@/pages/portal/StudentExams";
import StudentStudyResources from "@/pages/portal/StudentStudyResources";
import StudentReportCard from "@/pages/portal/StudentReportCard"; // Added import
import PortalGallery from "@/pages/portal/Gallery";
import TeacherDashboard from "@/pages/portal/TeacherDashboard";
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
import ExamManagement from "@/pages/portal/ExamManagement";
import HomepageManagement from "@/pages/portal/HomepageManagement";
import PerformanceMonitoring from "@/pages/portal/PerformanceMonitoring";

// New Exam System Components
import ExamSessions from "@/pages/portal/ExamSessions";
import ExamReports from "@/pages/portal/ExamReports";
import ParentReportCards from "@/pages/portal/ParentReportCards";

// Admin Approval System
import PendingApprovals from "@/pages/portal/PendingApprovals";
import UserManagement from "@/pages/portal/UserManagement";

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/admissions" component={Admissions} />
      <Route path="/login" component={Login} />

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
      <Route path="/portal/admin/users">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <UserManagement />
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
      <Route path="/portal/admin/settings">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <SettingsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/homepage">
        <ProtectedRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
          <HomepageManagement />
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