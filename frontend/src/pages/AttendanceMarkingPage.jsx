import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function AttendanceMarkingPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLecture, setSelectedLecture] = useState(1);
  const [selectedSession, setSelectedSession] = useState(1);
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

  const handleStartAttendance = async () => {
    if (!selectedCourse) return;
    try {
      const res = await apiClient.get(`/dashboard/courses/${selectedCourse}/`);
      if (res.data.sessions && res.data.sessions.length > 0) {
        const latestSessionId = res.data.sessions[0].id;
        
        // Trigger CV Engine in Backend
        await apiClient.post(`/dashboard/sessions/${latestSessionId}/start/`);
        
        navigate(`/faculty/session/live/${latestSessionId}`);
      } else {
        alert("No active session found for this course. Please contact Admin.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start session. Check console for details.");
    }
  };
  return (
    <>
      <div className="grid-2" style={{ marginBottom: '16px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Start Attendance Session</div>
              <div className="card-sub">Select course and lecture number</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Course</label>
            <select className="form-select" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              {loading && <option>Loading courses...</option>}
              {!loading && courses.length === 0 && <option>No courses assigned</option>}
              {!loading && courses.map(course => (
                <option key={course.id} value={course.id}>{course.code} — {course.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Lecture Number</label>
            <select className="form-select" value={selectedLecture} onChange={(e) => setSelectedLecture(e.target.value)}>
              {[...Array(16)].map((_, i) => (
                <option key={i+1} value={i+1}>Lecture {i+1}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Session Number</label>
            <select className="form-select" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
              <option value={1}>Session 1 (First Half)</option>
              <option value={2}>Session 2 (Second Half)</option>
            </select>
          </div>
          <div style={{ background: 'rgba(45,30,135,.1)', border: '1px solid rgba(45,30,135,.25)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '14px', fontSize: '12px', color: 'var(--text2)' }}>
            📷 Camera: Room 4B — Online · RTSP active · Last heartbeat 2s ago
          </div>
            <button 
              className="tb-btn primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }} 
              onClick={handleStartAttendance}
              disabled={loading || courses.length === 0}
            >
              ▶ Start AI Attendance
            </button>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Lecture Grid — CS-301</div>
          </div>
          <div className="lecture-grid">
            <div className="lecture-cell completed"><div className="lnum">1</div><div>✓</div></div>
            <div className="lecture-cell completed"><div className="lnum">2</div><div>✓</div></div>
            <div className="lecture-cell completed"><div className="lnum">3</div><div>✓</div></div>
            <div className="lecture-cell completed"><div className="lnum">4</div><div>✓</div></div>
            <div className="lecture-cell completed"><div className="lnum">5</div><div>✓</div></div>
            <div className="lecture-cell completed"><div className="lnum">6</div><div>✓</div></div>
            <div className="lecture-cell remaining" style={{ borderColor: 'var(--iu-primary)', color: 'var(--iu-gold)' }}><div className="lnum">7</div><div className="text-xs">Next</div></div>
            <div className="lecture-cell remaining"><div className="lnum">8</div></div>
            <div className="lecture-cell remaining"><div className="lnum">9</div></div>
            <div className="lecture-cell remaining"><div className="lnum">10</div></div>
            <div className="lecture-cell remaining"><div className="lnum">11</div></div>
            <div className="lecture-cell remaining"><div className="lnum">12</div></div>
            <div className="lecture-cell remaining"><div className="lnum">13</div></div>
            <div className="lecture-cell remaining"><div className="lnum">14</div></div>
            <div className="lecture-cell remaining"><div className="lnum">15</div></div>
            <div className="lecture-cell remaining"><div className="lnum">16</div></div>
          </div>
          <div className="divider"></div>
          <div className="flex gap-8" style={{ fontSize: '12px', color: 'var(--text3)' }}>
            <span>✓ 6 Completed</span>
            <span>▶ 0 Active</span>
            <span>— 10 Remaining</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Manual Attendance Fallback</div>
            <div className="card-sub">Use if camera is offline or unavailable</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Student ID</th><th>Name</th><th>Biometric</th><th>Manual Status</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>IU-2021-4412</td><td>Ahmed Khan</td><td><span className="pill done dot">Enrolled</span></td>
              <td>
                <select className="form-select" style={{ width: '120px', padding: '4px 8px', fontSize: '12px' }} defaultValue="Absent">
                  <option value="Present">Present</option><option value="Partial">Partial</option><option value="Absent">Absent</option>
                </select>
              </td>
            </tr>
            <tr>
              <td>IU-2021-4415</td><td>Sara Farooq</td><td><span className="pill done dot">Enrolled</span></td>
              <td>
                <select className="form-select" style={{ width: '120px', padding: '4px 8px', fontSize: '12px' }} defaultValue="Present">
                  <option value="Present">Present</option><option value="Partial">Partial</option><option value="Absent">Absent</option>
                </select>
              </td>
            </tr>
            <tr>
              <td>IU-2022-1234</td><td>Bilal Hassan</td><td><span className="pill pending dot">Pending</span></td>
              <td>
                <select className="form-select" style={{ width: '120px', padding: '4px 8px', fontSize: '12px' }} defaultValue="Present">
                  <option value="Present">Present</option><option value="Partial">Partial</option><option value="Absent">Absent</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <div className="tb-btn">Cancel</div>
          <div className="tb-btn primary" onClick={() => alert('Manual attendance submitted')}>✓ Submit Manual Attendance</div>
        </div>
      </div>
    </>
  );
}
