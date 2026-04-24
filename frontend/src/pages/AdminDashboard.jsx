import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/dashboard/admin-stats/')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <div className="grid-4 mb-16">
        <div className="stat-card green">
          <div className="stat-icon">🏛</div>
          <div className="stat-label">Total Courses</div>
          <div className="stat-value">{loading ? '...' : stats?.total_courses}</div>
          <div className="stat-meta">Spring 2026</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-label">Students Enrolled</div>
          <div className="stat-value">{loading ? '...' : stats?.total_students?.toLocaleString()}</div>
          <div className="stat-meta">of 30,000 target</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">📷</div>
          <div className="stat-label">Live Streams</div>
          <div className="stat-value">{loading ? '...' : stats?.live_sessions}</div>
          <div className="stat-meta">/ 120 classrooms</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">⚠</div>
          <div className="stat-label">System Alerts</div>
          <div className="stat-value">{loading ? '...' : stats?.alerts?.length}</div>
          <div className="stat-meta">camera offline</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Implementation Status</div>
            <div className="card-sub">AASAS v4.0 · Phase 1</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div className="flex items-center gap-8 mb-8">
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Course Creation</span>
                <span className="pill done dot ml-auto">Done</span>
              </div>
              <div className="progress-bar"><div className="progress-fill green" style={{ width: '100%' }}></div></div>
            </div>
            <div>
              <div className="flex items-center gap-8 mb-8">
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Student Enrollment</span>
                <span className="pill done dot ml-auto">Done</span>
              </div>
              <div className="progress-bar"><div className="progress-fill green" style={{ width: '100%' }}></div></div>
            </div>
            <div>
              <div className="flex items-center gap-8 mb-8">
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Attendance Execution</span>
                <span className="pill done dot ml-auto">Done</span>
              </div>
              <div className="progress-bar"><div className="progress-fill green" style={{ width: '100%' }}></div></div>
            </div>
            <div>
              <div className="flex items-center gap-8 mb-8">
                <span style={{ fontSize: '13px', fontWeight: 500 }}>User Access Control</span>
                <span className="pill inprog dot ml-auto">In Progress</span>
              </div>
              <div className="progress-bar"><div className="progress-fill gold" style={{ width: '60%' }}></div></div>
            </div>
            <div>
              <div className="flex items-center gap-8 mb-8">
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Biometric Enrollment</span>
                <span className="pill pending dot ml-auto">Planned</span>
              </div>
              <div className="progress-bar"><div className="progress-fill gold" style={{ width: '10%' }}></div></div>
            </div>
            <div>
              <div className="flex items-center gap-8 mb-8">
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Sentiment Analysis</span>
                <span className="pill pending dot ml-auto">Planned</span>
              </div>
              <div className="progress-bar"><div className="progress-fill gold" style={{ width: '5%' }}></div></div>
            </div>
            <div>
              <div className="flex items-center gap-8 mb-8">
                <span style={{ fontSize: '13px', fontWeight: 500 }}>ERP Integration</span>
                <span className="pill unknown dot ml-auto">Pending</span>
              </div>
              <div className="progress-bar"><div className="progress-fill green" style={{ width: '0%' }}></div></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <div className="card-sub">System audit trail</div>
          </div>
          {loading ? (
            <div className="p-20 text-center">Loading audit...</div>
          ) : stats?.audit_logs?.length === 0 ? (
            <div className="p-20 text-center" style={{ color: 'var(--color-text3)' }}>No recent activity</div>
          ) : stats?.audit_logs?.map((log, idx) => (
            <div className="audit-row" key={idx}>
              <div className="audit-time">{log.time}</div>
              <div className="audit-icon">{log.icon}</div>
              <div className="audit-text">
                <div className="audit-action">{log.action}</div>
                <div className="audit-detail">{log.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
