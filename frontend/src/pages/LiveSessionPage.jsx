import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function LiveSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [detections, setDetections] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let interval;
    if (isScanning) {
      interval = setInterval(() => {
        fetchLiveDetections();
      }, 3000);
    }

    fetchLiveDetections();
    return () => clearInterval(interval);
  }, [sessionId, isScanning]);

  const fetchLiveDetections = async () => {
    try {
      const res = await apiClient.get(`/dashboard/sessions/${sessionId}/live/`);
      setDetections(prev => {
        const newDets = res.data.detections;
        const combined = [...newDets, ...prev].filter((v, i, a) => a.findIndex(t => t.student_id === v.student_id) === i);
        return combined.slice(0, 8);
      });
      setStats(res.data.stats);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="live-container">
      <div className="live-main">
        <div className="video-viewport">
          <div className="scanning-overlay">
            <div className="scan-line"></div>
            <div className="corner tl"></div>
            <div className="corner tr"></div>
            <div className="corner bl"></div>
            <div className="corner br"></div>
            
            {isScanning && (
              <>
                <div className="bbox" style={{ top: '20%', left: '30%', width: '15%', height: '25%' }}>
                  <div className="bbox-label">IU-2021-4412 · 98%</div>
                </div>
                <div className="bbox" style={{ top: '45%', left: '60%', width: '12%', height: '22%' }}>
                  <div className="bbox-label">IU-2022-1055 · 94%</div>
                </div>
              </>
            )}
          </div>
          
          <div className="video-placeholder">
            <div className="pulse-container">
              <div className="pulse"></div>
              <div className="pulse delay"></div>
            </div>
            <div className="cam-info">RTSP STREAM: CAM-04 (ROOM 4B) · 1080p @ 15fps · {isScanning ? 'LIVE' : 'PAUSED'}</div>
          </div>
        </div>

        <div className="live-controls">
          <button className="tb-btn red" onClick={() => navigate('/faculty/dashboard')}>◼ End Session</button>
          <button className="tb-btn" onClick={() => setIsScanning(!isScanning)}>
            {isScanning ? '⏸ Pause AI Engine' : '▶ Resume AI Engine'}
          </button>
          <div className="ml-auto flex gap-16 items-center">
            <div className="status-indicator">
              <div className={`dot ${isScanning ? 'active' : ''}`}></div>
              ENGINE: {isScanning ? 'ONLINE' : 'IDLE'}
            </div>
            <div className="status-indicator">
              <div className="dot active"></div>
              KAFKA: CONNECTED
            </div>
          </div>
        </div>
      </div>

      <div className="live-sidebar">
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Real-time Recognition</div>
              <div className="card-sub">Recent detections & sentiment</div>
            </div>
          </div>
          
          <div className="detections-list">
            {loading ? (
              <div className="p-20 text-center" style={{ color: 'var(--text3)' }}>Initializing AI Engine...</div>
            ) : detections.length === 0 ? (
              <div className="p-20 text-center" style={{ color: 'var(--text3)' }}>Waiting for detections...</div>
            ) : detections.map((det, idx) => (
              <div className="det-row" key={det.student_id} style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="det-avatar">{det.student_id.slice(-2)}</div>
                <div className="det-info">
                  <div className="det-name">{det.name}</div>
                  <div className="det-meta">{det.student_id} · {Math.round(det.confidence * 100)}% Match</div>
                  <div className="det-hits">
                    <span className={`hit-dot ${idx % 3 === 0 ? 'active' : ''}`}></span>
                    <span className={`hit-dot ${idx % 3 === 1 ? 'active' : ''}`}></span>
                    <span className={`hit-dot ${idx % 3 === 2 ? 'active' : ''}`}></span>
                    <span style={{ marginLeft: '4px', fontSize: '9px' }}>AI SCANS</span>
                  </div>
                </div>
                <div className={`det-sentiment ${det.sentiment.toLowerCase()}`}>
                  {det.sentiment}
                </div>
              </div>
            ))}
          </div>

          <div className="live-stats">
            <div className="l-stat">
              <div className="l-val">{stats?.present_count} / {stats?.total_count}</div>
              <div className="l-lab">ATTENDANCE</div>
            </div>
            <div className="l-stat">
              <div className="l-val" style={{ color: 'var(--iu-gold)' }}>{stats?.sentiment_score}%</div>
              <div className="l-lab">ENGAGEMENT</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .live-container {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 20px;
          height: calc(100vh - 180px);
        }
        .live-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .video-viewport {
          flex: 1;
          background: #050505;
          border-radius: var(--radius-lg);
          position: relative;
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: inset 0 0 100px rgba(0,0,0,0.5);
        }
        .video-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #0d1117 0%, #000 100%);
        }
        .pulse-container {
          position: relative;
          width: 100px;
          height: 100px;
        }
        .pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid var(--iu-gold);
          border-radius: 50%;
          opacity: 0;
          animation: pulse-ring 3s infinite;
        }
        .pulse.delay { animation-delay: 1.5s; }
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .cam-info {
          position: absolute;
          bottom: 16px;
          left: 16px;
          font-family: 'Syne', monospace;
          font-size: 10px;
          color: var(--present);
          letter-spacing: 1.5px;
          text-shadow: 0 0 5px var(--present);
        }
        .scanning-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
        }
        .scan-line {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--iu-gold), transparent);
          box-shadow: 0 0 20px var(--iu-gold);
          animation: scan 5s ease-in-out infinite;
          opacity: 0.6;
        }
        @keyframes scan {
          0%, 100% { top: 5%; }
          50% { top: 95%; }
        }
        .corner {
          position: absolute;
          width: 40px;
          height: 40px;
          border: 1px solid var(--iu-gold);
          opacity: 0.3;
        }
        .tl { top: 24px; left: 24px; border-right: 0; border-bottom: 0; }
        .tr { top: 24px; right: 24px; border-left: 0; border-bottom: 0; }
        .bl { bottom: 24px; left: 24px; border-right: 0; border-top: 0; }
        .br { bottom: 24px; right: 24px; border-left: 0; border-top: 0; }

        .bbox {
          position: absolute;
          border: 1px solid var(--present);
          background: rgba(46, 160, 67, 0.05);
          box-shadow: 0 0 10px rgba(46, 160, 67, 0.2);
        }
        .bbox-label {
          position: absolute;
          bottom: 100%;
          left: -1px;
          background: var(--present);
          color: white;
          font-size: 9px;
          padding: 2px 8px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .live-controls {
          padding: 16px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
          color: var(--text3);
          letter-spacing: 1px;
        }
        .status-indicator .dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #1c2330;
          transition: all 0.3s;
        }
        .status-indicator .dot.active {
          background: var(--present);
          box-shadow: 0 0 10px var(--present);
        }

        .live-sidebar {
          height: 100%;
        }
        .detections-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
        .det-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-bottom: 1px solid var(--border2);
          animation: detFadeIn 0.4s ease-out forwards;
          opacity: 0;
          transform: translateY(10px);
          transition: background 0.2s;
        }
        .det-row:hover {
          background: rgba(255,255,255,0.02);
        }
        @keyframes detFadeIn {
          to { opacity: 1; transform: translateY(0); }
        }
        .det-avatar {
          width: 40px; height: 40px;
          background: var(--bg3);
          color: var(--iu-gold);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          border: 1px solid var(--border);
        }
        .det-info { flex: 1; }
        .det-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 2px;
        }
        .det-meta {
          font-size: 12px;
          color: var(--text3);
          margin-bottom: 4px;
        }
        .det-hits {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .hit-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
        }
        .hit-dot.active {
          background: var(--present);
          box-shadow: 0 0 5px var(--present);
          border-color: var(--present);
        }
        .det-sentiment {
          font-size: 9px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .det-sentiment.focused { background: rgba(46, 160, 67, 0.1); color: #3fb950; border: 1px solid rgba(46, 160, 67, 0.2); }
        .det-sentiment.happy { background: rgba(201, 168, 76, 0.1); color: var(--iu-gold); border: 1px solid rgba(201, 168, 76, 0.2); }
        .det-sentiment.neutral { background: rgba(139, 148, 158, 0.1); color: var(--text2); border: 1px solid rgba(139, 148, 158, 0.2); }
        .det-sentiment.bored { background: rgba(218, 54, 51, 0.1); color: #f85149; border: 1px solid rgba(218, 54, 51, 0.2); }
        .det-sentiment.confused { background: rgba(163, 113, 247, 0.1); color: #a371f7; border: 1px solid rgba(163, 113, 247, 0.2); }

        .live-stats {
          padding: 24px;
          border-top: 1px solid var(--border);
          background: rgba(255,255,255,0.01);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .l-stat {
          text-align: center;
          padding: 12px;
          background: var(--bg3);
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }
        .l-val {
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 4px;
        }
        .l-lab {
          font-size: 9px;
          font-weight: 700;
          color: var(--text3);
          letter-spacing: 1.5px;
        }
      `}</style>
    </div>
  );
}
