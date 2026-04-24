import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/dashboard/faculty-stats/')
      .then(res => {
        setCourses(res.data.courses);
        setData(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="live-session-banner">
        <div className="live-dot"></div>
        <div className="live-text">
          <div className="live-title">Live Session · CS-301 Data Structures · Lecture 7</div>
          <div className="live-sub">Room 4B · Camera Online · 28 students detected</div>
        </div>
        <div className="live-timer">18:42</div>
        <div className="live-controls">
          <div className="tb-btn danger" onClick={() => alert('Session ended')}>⬛ End Session</div>
        </div>
      </div>

      <div className="grid-4 mb-16">
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Present</div>
          <div className="stat-value">{loading ? '...' : data?.stats?.present}</div>
          <div className="stat-meta">of enrolled</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">⏱</div>
          <div className="stat-label">Partial</div>
          <div className="stat-value">{loading ? '...' : data?.stats?.partial}</div>
          <div className="stat-meta">low presence score</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">❌</div>
          <div className="stat-label">Absent</div>
          <div className="stat-value">{loading ? '...' : data?.stats?.absent}</div>
          <div className="stat-meta">at-risk students</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">😶</div>
          <div className="stat-label">Unknown</div>
          <div className="stat-value">{loading ? '...' : data?.stats?.unknown}</div>
          <div className="stat-meta">needs review</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">My Courses</div>
              <div className="card-sub">Spring 2026 — 3 active courses</div>
            </div>
            <div className="tb-btn primary" onClick={() => navigate('/faculty/attendance/take')}>▶ Start Attendance</div>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Course</th><th>Lecture</th><th>Progress</th><th>Avg.</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="4">Loading courses...</td></tr>}
              {!loading && courses.length === 0 && <tr><td colSpan="4">No courses assigned.</td></tr>}
              {!loading && courses.map((course, idx) => (
                <tr key={course.id} onClick={() => navigate('/faculty/attendance/reports')} style={{ cursor: 'pointer' }}>
                  <td><div style={{ fontWeight: 500 }}>{course.code}</div><div className="text-xs text-muted">{course.name}</div></td>
                  <td><span className="pill active dot">{course.lecture_status}</span></td>
                  <td><div className="progress-bar" style={{ width: '120px' }}><div className="progress-fill green" style={{ width: `${course.progress}%` }}></div></div></td>
                  <td style={{ color: '#3FB950' }}>{course.avg_attendance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">⚠ At-Risk Students</div>
              <div className="card-sub">Absences exceeding threshold</div>
            </div>
            <span className="pill absent dot">{loading ? '...' : data?.at_risk?.length} students</span>
          </div>
          {loading && <div style={{ padding: '20px' }}>Loading...</div>}
          {!loading && data?.at_risk?.map(student => (
            <div className="at-risk-row" key={student.id}>
              <div className="risk-avatar">{student.avatar}</div>
              <div className="risk-info">
                <div className="risk-name">{student.name}</div>
                <div className="risk-detail">{student.course} · {student.absences} absences</div>
              </div>
              <div className="risk-bar">
                <div className="risk-count">{student.absences}</div>
                <div className="risk-of">/ 16 lec</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">CS-301 · Lecture Progress</div>
            <div className="card-sub">Lecture 7 currently active — 9 remaining</div>
          </div>
        </div>
        <div className="lecture-grid">
          <div className="lecture-cell completed"><div className="lnum">1</div><div>✓</div></div>
          <div className="lecture-cell completed"><div className="lnum">2</div><div>✓</div></div>
          <div className="lecture-cell completed"><div className="lnum">3</div><div>✓</div></div>
          <div className="lecture-cell completed"><div className="lnum">4</div><div>✓</div></div>
          <div className="lecture-cell completed"><div className="lnum">5</div><div>✓</div></div>
          <div className="lecture-cell completed"><div className="lnum">6</div><div>✓</div></div>
          <div className="lecture-cell active-now"><div className="lnum">7</div><div>▶</div></div>
          <div className="lecture-cell remaining"><div className="lnum">8</div><div className="text-xs">—</div></div>
          <div className="lecture-cell remaining"><div className="lnum">9</div><div className="text-xs">—</div></div>
          <div className="lecture-cell remaining"><div className="lnum">10</div><div className="text-xs">—</div></div>
          <div className="lecture-cell remaining"><div className="lnum">11</div><div className="text-xs">—</div></div>
          <div className="lecture-cell remaining"><div className="lnum">12</div><div className="text-xs">—</div></div>
          <div className="lecture-cell remaining"><div className="lnum">13</div><div className="text-xs">—</div></div>
          <div className="lecture-cell remaining"><div className="lnum">14</div><div className="text-xs">—</div></div>
          <div className="lecture-cell remaining"><div className="lnum">15</div><div className="text-xs">—</div></div>
          <div className="lecture-cell remaining"><div className="lnum">16</div><div className="text-xs">—</div></div>
        </div>
      </div>
    </>
  );
}
