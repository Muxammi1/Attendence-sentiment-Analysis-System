import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import IqraLayout from './components/IqraLayout';
import { AuthProvider, useAuth } from './context/AuthContext';

import AdminLoginPage from './pages/AdminLoginPage';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CoursesPage from './pages/CoursesPage';
import LecturesSessionsPage from './pages/LecturesSessionsPage';
import AttendanceMarkingPage from './pages/AttendanceMarkingPage';
import StudentEnrollmentPage from './pages/StudentEnrollmentPage';
import LiveSessionPage from './pages/LiveSessionPage';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isLoginPage = location.pathname === '/';

  if (!user && !isLoginPage) {
    return <Navigate to="/" replace />;
  }

  if (user && isLoginPage) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/faculty/dashboard'} replace />;
  }

  if (isLoginPage) {
    return children;
  }

  return <IqraLayout>{children}</IqraLayout>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<AdminLoginPage />} />
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<CoursesPage />} />
            <Route path="/admin/students" element={<StudentEnrollmentPage />} />
            <Route path="/faculty/session/live/:sessionId" element={<LiveSessionPage />} />
            <Route path="/faculty/attendance/take" element={<AttendanceMarkingPage />} />
            <Route path="/faculty/attendance/reports" element={<LecturesSessionsPage />} />
            <Route path="/faculty/sentiment" element={<LecturesSessionsPage />} />
            <Route path="/admin/users" element={<CoursesPage />} />
            <Route path="/admin/health" element={<CoursesPage />} />
            <Route path="/admin/audit" element={<CoursesPage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
