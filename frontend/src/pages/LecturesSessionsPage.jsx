import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export default function LecturesSessionsPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/dashboard/courses/')
      .then(res => {
        setCourses(res.data);
        if (res.data.length > 0) setSelectedCourse(res.data[0].id);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      apiClient.get(`/dashboard/courses/${selectedCourse}/`)
        .then(res => {
          setSessions(res.data.sessions);
          if (res.data.sessions.length > 0) {
            setSelectedSession(res.data.sessions[0]);
            setAttendance(res.data.sessions[0].attendance);
          } else {
            setSelectedSession(null);
            setAttendance([]);
          }
        })
        .catch(err => console.error(err));
    }
  }, [selectedCourse]);

  const handleSessionChange = (idx) => {
    const session = sessions[idx];
    setSelectedSession(session);
    setAttendance(session.attendance);
  };

  const handleOverride = async (recordId, newStatus) => {
    try {
      await apiClient.patch(`/dashboard/attendance/${recordId}/override/`, { status: newStatus });
      setAttendance(prev => prev.map(r => r.id === recordId ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };
  return (
    <>
      <div className="card mb-16">
        <div className="flex gap-8 items-center mb-16">
          <select className="form-select" style={{ width: '200px' }} value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
          <select className="form-select" style={{ width: '140px' }} onChange={(e) => handleSessionChange(e.target.value)}>
            {sessions.map((s, idx) => (
              <option key={idx} value={idx}>Session {s.session_number} ({s.date})</option>
            ))}
            {sessions.length === 0 && <option>No sessions</option>}
          </select>
          <div className="tb-btn" onClick={() => alert('Exported as PDF')}>⬇ PDF</div>
          <div className="tb-btn" onClick={() => alert('Exported as CSV')}>⬇ CSV</div>
        </div>
        <div className="grid-4">
          <div className="stat-card green"><div className="stat-label">Present</div><div className="stat-value">24</div><div className="stat-meta">68.6%</div></div>
          <div className="stat-card gold"><div className="stat-label">Partial</div><div className="stat-value">4</div><div className="stat-meta">11.4%</div></div>
          <div className="stat-card red"><div className="stat-label">Absent</div><div className="stat-value">5</div><div className="stat-meta">14.3%</div></div>
          <div className="stat-card blue"><div className="stat-label">Unknown</div><div className="stat-value">2</div><div className="stat-meta">Needs review</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">CS-301 · Lecture 7 · Attendance</div>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input placeholder="Search student..." />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Student ID</th><th>Name</th><th>Presence Score</th><th>Status</th><th>Override</th><th>Action</th></tr>
          </thead>
          <tbody>
            {attendance.map((record, idx) => (
              <tr key={idx}>
                <td>{record.student}</td>
                <td>Student {idx + 1}</td>
                <td>0.85</td>
                <td><span className={`pill ${record.status.toLowerCase()} dot`}>{record.status}</span></td>
                <td>
                  <select 
                    className="form-select" 
                    style={{ padding: '2px 6px', fontSize: '11px', width: '100px' }}
                    value={record.status}
                    onChange={(e) => handleOverride(record.id, e.target.value)}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Excused">Excused</option>
                  </select>
                </td>
                <td><button className="tb-btn primary" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => alert('Record Approved')}>Approve</button></td>
              </tr>
            ))}
            {attendance.length === 0 && <tr><td colSpan="6">No attendance records found for this session.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
