import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Active selection
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({ code: '', name: '', description: '', instructor: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCourses = () => {
    setLoading(true);
    apiClient.get('/courses/')
      .then(res => setCourses(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchData = async () => {
    try {
      const [studentsRes, facultyRes] = await Promise.all([
        apiClient.get('/students/'),
        apiClient.get('/users/?role=FACULTY')
      ]);
      setAllStudents(studentsRes.data);
      setAllFaculty(facultyRes.data);
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  };

  useEffect(() => { 
    fetchCourses(); 
    fetchData();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/courses/', {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      await apiClient.post(`/courses/${res.data.id}/setup/`);
      setShowCreateModal(false);
      setFormData({ code: '', name: '', description: '', instructor: '' });
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedCourse) return;
    setSubmitting(true);
    try {
      await apiClient.patch(`/courses/${selectedCourse.id}/`, {
        students: selectedStudents
      });
      setShowEnrollModal(false);
      fetchCourses();
    } catch (err) {
      alert("Enrollment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateInstructor = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setSubmitting(true);
    try {
      await apiClient.patch(`/courses/${selectedCourse.id}/`, {
        instructor: formData.instructor
      });
      setShowEditModal(false);
      fetchCourses();
    } catch (err) {
      alert("Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const openEnroll = (course) => {
    setSelectedCourse(course);
    setSelectedStudents(course.students || []);
    setShowEnrollModal(true);
  };

  const openEdit = (course) => {
    setSelectedCourse(course);
    setFormData({ 
      code: course.code, 
      name: course.name, 
      description: course.description || '', 
      instructor: course.instructor || '' 
    });
    setShowEditModal(true);
  };

  return (
    <>
      <div className="card mb-16">
        <div className="flex gap-8 items-center">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input placeholder="Search courses..." />
          </div>
          <div className="tb-btn primary ml-auto" onClick={() => setShowCreateModal(true)}>
            + Create Course
          </div>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course Name</th>
              <th>Faculty</th>
              <th>Students</th>
              <th>Lectures</th>
              <th>Sessions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="8">Loading courses...</td></tr>}
            {!loading && courses.map(course => (
              <tr key={course.id}>
                <td style={{ fontWeight: 600 }}>{course.code}</td>
                <td>{course.name}</td>
                <td>
                   <span style={{ color: course.instructor_name ? 'inherit' : 'var(--text3)' }}>
                     {course.instructor_name || 'Unassigned'}
                   </span>
                </td>
                <td>{course.student_count ?? 0}</td>
                <td><span className="pill active dot">{course.lectures?.length ?? 0} / 16</span></td>
                <td>{course.total_sessions ?? 0}</td>
                <td><span className="pill done dot">Active</span></td>
                <td>
                  <div className="flex gap-8">
                    <span className="tb-btn" onClick={() => openEdit(course)}>Edit</span>
                    <span className="tb-btn" onClick={() => openEnroll(course)}>Enroll</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card-title">Create New Course</div>
            <form onSubmit={handleCreateCourse}>
              <div className="form-group">
                <label className="form-label">Course Code *</label>
                <input className="form-select" required value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Course Name *</label>
                <input className="form-select" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="flex gap-8 mt-24" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="tb-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="tb-btn primary" disabled={submitting}>Create & Setup</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL (Assignment) */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card-title">Edit Course: {selectedCourse?.code}</div>
            <form onSubmit={handleUpdateInstructor}>
              <div className="form-group">
                <label className="form-label">Assign Instructor</label>
                <select 
                  className="form-select" 
                  value={formData.instructor} 
                  onChange={e => setFormData(p => ({ ...p, instructor: e.target.value }))}
                >
                  <option value="">Select Faculty</option>
                  {allFaculty.map(f => (
                    <option key={f.id} value={f.id}>{f.first_name} {f.last_name} (@{f.username})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-8 mt-24" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="tb-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="tb-btn primary" disabled={submitting}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENROLL MODAL */}
      {showEnrollModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '500px' }}>
            <div className="card-title">Enroll Students: {selectedCourse?.code}</div>
            <div className="card-sub mb-16">Select students to add to this course</div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              {allStudents.map(student => (
                <div key={student.id} className="flex items-center gap-12" style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedStudents.includes(student.id)} 
                    onChange={e => {
                      if (e.target.checked) setSelectedStudents(p => [...p, student.id]);
                      else setSelectedStudents(p => p.filter(id => id !== student.id));
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{student.enrollment_id}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-8 mt-24" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="tb-btn" onClick={() => setShowEnrollModal(false)}>Cancel</button>
              <button type="button" className="tb-btn primary" onClick={handleEnroll} disabled={submitting}>Enroll Selected</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; alignItems: center; justifyContent: center; z-index: 1000;
        }
        .modal-content {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 32px; width: 400px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }
      `}</style>
    </>
  );
}
