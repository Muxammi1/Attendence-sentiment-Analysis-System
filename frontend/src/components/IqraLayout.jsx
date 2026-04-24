import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_FACULTY = [
  { label: 'Overview', items: [
    { id: 'dashboard', icon: '◉', text: 'Dashboard', path: '/faculty/dashboard' },
    { id: 'take-attendance', icon: '▶', text: 'Take Attendance', path: '/faculty/attendance/take' },
    { id: 'attendance-report', icon: '📋', text: 'Attendance Reports', path: '/faculty/attendance/reports' },
    { id: 'sentiment', icon: '😊', text: 'Sentiment Reports', path: '/faculty/sentiment' },
  ]},
];

const NAV_ADMIN = [
  { label: 'Overview', items: [
    { id: 'admin-dashboard', icon: '◉', text: 'Admin Dashboard', path: '/admin/dashboard' },
  ]},
  { label: 'Management', items: [
    { id: 'courses', icon: '🏛', text: 'Course Management', path: '/admin/courses' },
    { id: 'students', icon: '👨‍🎓', text: 'Student Enrollment', path: '/admin/students' },
    { id: 'users', icon: '👤', text: 'User Management', path: '/admin/users' },
  ]},
  { label: 'System', items: [
    { id: 'health', icon: '📡', text: 'System Health', path: '/admin/health', badge: '2' },
    { id: 'audit', icon: '📜', text: 'Audit Log', path: '/admin/audit' },
  ]},
];

export default function IqraLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Determine title based on path
  let pageTitle = 'Dashboard';
  if (location.pathname.includes('attendance/take')) pageTitle = 'Take Attendance';
  else if (location.pathname.includes('attendance/reports')) pageTitle = 'Attendance Reports';
  else if (location.pathname.includes('sentiment')) pageTitle = 'Sentiment Reports';
  else if (location.pathname.includes('admin/dashboard')) pageTitle = 'Admin Dashboard';
  else if (location.pathname.includes('courses')) pageTitle = 'Course Management';
  else if (location.pathname.includes('students')) pageTitle = 'Student Enrollment';
  else if (location.pathname.includes('users')) pageTitle = 'User Management';
  else if (location.pathname.includes('health')) pageTitle = 'System Health';
  else if (location.pathname.includes('audit')) pageTitle = 'Audit Log';

  const role = user?.role === 'ADMIN' ? 'admin' : 'faculty';

  const navSections = role === 'faculty' ? NAV_FACULTY : NAV_ADMIN;

  return (
    <div id="app">
      {/* SIDEBAR */}
      <div id="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">IU</div>
          <div className="logo-text">
            <div className="name">AASAS</div>
            <div className="sub">Iqra University</div>
          </div>
        </div>
        <div className="sidebar-role-badge">
          <div className="role-avatar">{role === 'faculty' ? 'DK' : 'SA'}</div>
          <div className="role-info">
            <div className="role-name">{role === 'faculty' ? 'Dr. Khurram' : 'Salman Admin'}</div>
            <div className="role-tag">{role === 'faculty' ? 'Faculty' : 'System Admin'}</div>
          </div>
        </div>



        <div className="sidebar-nav">
          {navSections.map((sec, idx) => (
            <React.Fragment key={idx}>
              <div className="nav-section-label">{sec.label}</div>
              {sec.items.map(item => (
                <div 
                  key={item.id}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`} 
                  onClick={() => navigate(item.path)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.text}
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div className="sidebar-footer">
          <div>AASAS v4.0 · IEEE 830-1998</div>
          <div className="version">© 2026 Iqra University</div>
        </div>
      </div>

      {/* MAIN */}
      <div id="main">
        {/* TOP BAR */}
        <div id="topbar">
          <div>
            <div className="topbar-title">{pageTitle}</div>
            <div className="topbar-sub">Spring 2026 Semester</div>
          </div>
          <div className="topbar-actions">
            <div className="tb-btn" onClick={() => alert('No new notifications')}>
              🔔 <div className="notif-dot"></div>
            </div>
            <div className="tb-btn" onClick={() => alert('Exporting report...')}>⬇ Export</div>
            <div className="tb-btn" onClick={() => {
              logout();
              navigate('/');
            }}>← Logout</div>
          </div>
        </div>

        {/* CONTENT */}
        <div id="content">
          <div className="screen active">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
