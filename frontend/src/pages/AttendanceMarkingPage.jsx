import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function AttendanceMarkingPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLecture, setSelectedLecture] = useState(1);
  const [selectedSession, setSelectedSession] = useState(1);
  const [students, setStudents] = useState([]);
  const [manualStatuses, setManualStatuses] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Load faculty courses
  useEffect(() => {
    apiClient.get('/dashboard/courses/')
      .then(res => {
        setCourses(res.data);
        if (res.data.length > 0) setSelectedCourse(res.data[0].id);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // When course/lecture/session changes, look up the real session ID
  useEffect(() => {
    if (!selectedCourse) return;
    setStudentsLoading(true);

    // Load sessions for the selected course and find the matching one
    apiClient.get(`/dashboard/courses/${selectedCourse}/`)
      .then(res => {
        const sessions = res.data.sessions || [];
        const match = sessions.find(
          s => s.lecture_number === Number(selectedLecture) && s.session_number === Number(selectedSession)
        );
        setSessionId(match ? match.id : null);
      })
      .catch(err => console.error(err))
      .finally(() => setStudentsLoading(false));

    // Load enrolled students for this course
    apiClient.get(`/courses/?instructor_course=${selectedCourse}`)
      .catch(() => null);

    // Fetch students enrolled in the course via the courses endpoint
    apiClient.get(`/courses/${selectedCourse}/`)
      .then(res => {
        const enrolled = res.data.students || [];
        setStudents(enrolled);
        const defaultStatuses = {};
        enrolled.forEach(s => { defaultStatuses[s.id] = 'Present'; });
        setManualStatuses(defaultStatuses);
      })
      .catch(err => console.error('students error', err));
  }, [selectedCourse, selectedLecture, selectedSession]);

  const handleStartAttendance = async () => {
    if (!sessionId) {
      setMessage('⚠ No session found for Lecture ' + selectedLecture + ' Session ' + selectedSession + '. Ensure the course has been set up.');
      return;
    }
    setStarting(true);
    setMessage('');
    try {
      await apiClient.post(`/dashboard/sessions/${sessionId}/start/`);
      navigate(`/faculty/session/live/${sessionId}`);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || 'Failed to start session.';
      setMessage('⚠ ' + detail);
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitManual = async () => {
    if (!sessionId) {
      setMessage('⚠ Session not found. Cannot submit attendance.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const payload = students.map(s => ({
        student_id: s.id,
        status: manualStatuses[s.id] || 'Absent',
        notes: 'Manual entry',
      }));
      await apiClient.post('/attendance/mark_bulk/', {
        session_id: sessionId,
        attendance: payload,
      });
      setMessage('✅ Manual attendance submitted successfully!');
    } catch (err) {
      const detail = err.response?.data?.error || 'Submission failed.';
      setMessage('⚠ ' + detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid-2" style={{ marginBottom: '16px' }}>
        {/* Start AI Attendance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Start Attendance Session</div>
              <div className="card-sub">Select course, lecture, and session number</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Course</label>
            <select
              className="form-select"
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
            >
              {loading && <option>Loading courses...</option>}
              {!loading && courses.length === 0 && <option>No courses assigned</option>}
              {!loading && courses.map(course => (
                <option key={course.id} value={course.id}>{course.code} — {course.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Lecture Number</label>
            <select
              className="form-select"
              value={selectedLecture}
              onChange={e => setSelectedLecture(Number(e.target.value))}
            >
              {[...Array(16)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Lecture {i + 1}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Session Number</label>
            <select
              className="form-select"
              value={selectedSession}
              onChange={e => setSelectedSession(Number(e.target.value))}
            >
              <option value={1}>Session 1 (First Half)</option>
              <option value={2}>Session 2 (Second Half)</option>
            </select>
          </div>

          <div style={{
            background: 'rgba(45,30,135,.1)',
            border: '1px solid rgba(45,30,135,.25)',
            borderRadius: 'var(--radius)',
            padding: '12px',
            marginBottom: '14px',
            fontSize: '12px',
            color: 'var(--text2)',
          }}>
            {studentsLoading
              ? '⏳ Looking up session...'
              : sessionId
                ? `✅ Session ID: ${sessionId} ready — Camera: Room 4B · RTSP active`
                : '⚠️ No session found for this lecture/session combination. Ensure the course was set up.'}
          </div>

          {message && (
            <div style={{
              background: message.startsWith('✅') ? 'rgba(46,160,67,.1)' : 'rgba(218,54,51,.1)',
              border: `1px solid ${message.startsWith('✅') ? 'rgba(46,160,67,.3)' : 'rgba(218,54,51,.3)'}`,
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              color: message.startsWith('✅') ? '#3fb950' : '#f85149',
              fontSize: '13px',
              marginBottom: '12px',
            }}>
              {message}
            </div>
          )}

          <button
            className="tb-btn primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
            onClick={handleStartAttendance}
            disabled={loading || starting || !sessionId}
          >
            {starting ? '⏳ Starting...' : '▶ Start AI Attendance'}
          </button>
        </div>

        {/* Lecture Grid */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Lecture Grid</div>
          </div>
          <div className="lecture-grid">
            {[...Array(16)].map((_, i) => {
              const lnum = i + 1;
              const isActive = lnum === Number(selectedLecture);
              return (
                <div
                  key={lnum}
                  className={`lecture-cell ${isActive ? 'active-now' : 'remaining'}`}
                  onClick={() => setSelectedLecture(lnum)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="lnum">{lnum}</div>
                  <div>{isActive ? '▶' : '—'}</div>
                </div>
              );
            })}
          </div>
          <div className="divider"></div>
          <div className="flex gap-8" style={{ fontSize: '12px', color: 'var(--text3)' }}>
            <span>▶ Selected: Lecture {selectedLecture}</span>
            <span>Session {selectedSession}</span>
          </div>
        </div>
      </div>

      {/* Manual Attendance Fallback */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Manual Attendance Fallback</div>
            <div className="card-sub">Use if camera is offline — 3 hits logic bypassed</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Manual Status</th>
            </tr>
          </thead>
          <tbody>
            {studentsLoading && (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading students...</td></tr>
            )}
            {!studentsLoading && students.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text3)' }}>
                No students enrolled in this course yet.
              </td></tr>
            )}
            {!studentsLoading && students.map(student => (
              <tr key={student.id}>
                <td>{student.enrollment_id}</td>
                <td>{student.name}</td>
                <td style={{ color: 'var(--text3)', fontSize: '12px' }}>{student.email}</td>
                <td>
                  <select
                    className="form-select"
                    style={{ width: '120px', padding: '4px 8px', fontSize: '12px' }}
                    value={manualStatuses[student.id] || 'Present'}
                    onChange={e => setManualStatuses(p => ({ ...p, [student.id]: e.target.value }))}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Excused">Excused</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <div className="tb-btn" onClick={() => setMessage('')}>Cancel</div>
          <div
            className="tb-btn primary"
            onClick={handleSubmitManual}
            style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? '⏳ Submitting...' : '✓ Submit Manual Attendance'}
          </div>
        </div>
      </div>
    </>
  );
}
