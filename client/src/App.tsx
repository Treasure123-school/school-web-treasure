import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

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
        <ProtectedRoute allowedRoles={['Student']}>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/grades">
        <ProtectedRoute allowedRoles={['Student']}>
          <StudentGrades />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/announcements">
        <ProtectedRoute allowedRoles={['Student']}>
          <StudentAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/attendance">
        <ProtectedRoute allowedRoles={['Student']}>
          <StudentAttendance />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/messages">
        <ProtectedRoute allowedRoles={['Student']}>
          <StudentMessages />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/student/profile">
        <ProtectedRoute allowedRoles={['Student']}>
          <StudentProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher">
        <ProtectedRoute allowedRoles={['Teacher']}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin">
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/students">
        <ProtectedRoute allowedRoles={['Admin']}>
          <StudentManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/teachers">
        <ProtectedRoute allowedRoles={['Admin']}>
          <TeachersManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/classes">
        <ProtectedRoute allowedRoles={['Admin']}>
          <ClassesManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/subjects">
        <ProtectedRoute allowedRoles={['Admin']}>
          <SubjectsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/announcements">
        <ProtectedRoute allowedRoles={['Admin']}>
          <AnnouncementsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/reports">
        <ProtectedRoute allowedRoles={['Admin']}>
          <ReportsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/admin/settings">
        <ProtectedRoute allowedRoles={['Admin']}>
          <SettingsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/teacher/attendance">
        <ProtectedRoute allowedRoles={['Teacher']}>
          <AttendanceManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/parent">
        <ProtectedRoute allowedRoles={['Parent']}>
          <ParentDashboard />
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
