import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/courses/')
      .then(res => setCourses(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <div className="card mb-16">
        <div className="flex gap-8 items-center">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input placeholder="Search courses..." />
          </div>
          <select className="form-select" style={{ width: '150px' }}>
            <option>All Departments</option>
            <option>CS</option>
            <option>BBA</option>
            <option>EE</option>
          </select>
          <div className="tb-btn primary ml-auto" onClick={() => alert('Open Create Course Modal')}>+ Create Course</div>
        </div>
      </div>
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course Name</th>
              <th>Faculty</th>
              <th>Room / Camera</th>
              <th>Students</th>
              <th>Lectures</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="8">Loading courses...</td></tr>}
            {!loading && courses.length === 0 && <tr><td colSpan="8">No courses found.</td></tr>}
            {!loading && courses.map(course => (
              <tr key={course.id}>
                <td style={{ fontWeight: 600 }}>{course.code}</td>
                <td>{course.name}</td>
                <td>{course.instructor_name || 'Unassigned'}</td>
                <td>Room 4B · CAM-04</td>
                <td>35</td>
                <td><span className="pill active dot">7/16</span></td>
                <td><span className="pill done dot">Active</span></td>
                <td>
                  <div className="flex gap-8">
                    <span className="tb-btn" style={{ padding: '3px 8px', fontSize: '11px' }}>Edit</span>
                    <span className="tb-btn" style={{ padding: '3px 8px', fontSize: '11px' }}>Enroll</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
