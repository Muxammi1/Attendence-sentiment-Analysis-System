import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export default function StudentEnrollmentPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = () => {
    setLoading(true);
    apiClient.get('/students/')
      .then(res => setStudents(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.enrollment_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleEnroll = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('consent', 'true');

    try {
      const res = await apiClient.post(`/students/${selectedStudent.id}/enroll_biometrics/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(`Successfully enrolled biometrics for ${selectedStudent.name}`);
      fetchStudents();
      setTimeout(() => {
        setShowModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to enroll biometrics');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="card mb-16">
        <div className="flex gap-8 items-center">
          <div className="search-box" style={{ flex: 1 }}>
            <span className="search-icon">🔍</span>
            <input 
              placeholder="Search by ID or Name..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div className="tb-btn primary" onClick={() => alert('Add Student form pending')}>➕ Add Student</div>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Enrollment ID</th>
              <th>Name</th>
              <th>Biometric Status</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5">Loading students...</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan="5">No students found.</td></tr>
            ) : filteredStudents.map(student => (
              <tr key={student.id}>
                <td style={{ fontWeight: 600 }}>{student.enrollment_id}</td>
                <td>{student.name}</td>
                <td>
                  {student.biometrics ? (
                    <span className="pill done dot">Enrolled</span>
                  ) : (
                    <span className="pill pending dot">Missing</span>
                  )}
                </td>
                <td>
                  <span className={`pill ${student.is_active ? 'done' : 'absent'} dot`}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="tb-btn" onClick={() => handleEnroll(student)}>
                    {student.biometrics ? 'Re-Enroll' : 'Enroll Face'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Biometric Enrollment</div>
              <div className="modal-sub">{selectedStudent?.name} ({selectedStudent?.enrollment_id})</div>
            </div>
            
            <div className="modal-body">
              {success ? (
                <div className="alert success">{success}</div>
              ) : error ? (
                <div className="alert error">{error}</div>
              ) : (
                <div className="enroll-instruction">
                  <p>Please upload a clear, front-facing photo of the student. Ensure there are no other people in the background.</p>
                </div>
              )}

              {!success && (
                <div className="file-upload-zone">
                  {uploading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div className="loading-spinner"></div>
                      <p style={{ marginTop: '10px' }}>Extracting 512-d embeddings...</p>
                    </div>
                  ) : (
                    <>
                      <input 
                        type="file" 
                        id="face-upload" 
                        hidden 
                        onChange={onFileChange} 
                        accept="image/*"
                      />
                      <label htmlFor="face-upload" className="upload-label">
                        <div className="upload-icon">📷</div>
                        <div style={{ fontWeight: 500 }}>Click to Upload Photo</div>
                        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Supports JPG, PNG</div>
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="tb-btn" onClick={() => setShowModal(false)} disabled={uploading}>
                {success ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(8px);
        }
        .modal-content {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          width: 90%;
          max-width: 500px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          animation: modalSlide 0.3s ease-out;
        }
        @keyframes modalSlide {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          padding: 24px;
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
        }
        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--iu-gold);
          margin-bottom: 4px;
        }
        .modal-sub {
          font-size: 14px;
          color: var(--text2);
        }
        .modal-body {
          padding: 24px;
        }
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          background: rgba(255,255,255,0.02);
        }
        .file-upload-zone {
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          padding: 40px 20px;
          text-align: center;
          margin-top: 20px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(255,255,255,0.01);
        }
        .file-upload-zone:hover {
          border-color: var(--iu-gold);
          background: rgba(201, 168, 76, 0.05);
          transform: translateY(-2px);
        }
        .upload-label {
          cursor: pointer;
          display: block;
        }
        .upload-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }
        .enroll-instruction {
          font-size: 14px;
          color: var(--text2);
          line-height: 1.6;
        }
        .alert {
          padding: 14px;
          border-radius: var(--radius);
          font-size: 14px;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .alert.success {
          background: rgba(46, 160, 67, 0.15);
          color: #3fb950;
          border: 1px solid rgba(46, 160, 67, 0.3);
        }
        .alert.error {
          background: rgba(218, 54, 51, 0.15);
          color: #f85149;
          border: 1px solid rgba(218, 54, 51, 0.3);
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(201, 168, 76, 0.1);
          border-top: 3px solid var(--iu-gold);
          border-radius: 50%;
          display: inline-block;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
