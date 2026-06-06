import React, { useState, useEffect, useRef, useCallback } from 'react';
import FaceScanner from '../components/FaceScanner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getAllFaceEmbeddings,
  recordCheckIn,
  recordCheckOut,
  getTodayAttendance,
  getTodaySummary,
  signOut,
} from '../services/supabase';
import {
  loadModels,
  findBestMatch,
  areModelsLoaded,
} from '../services/faceEngine';

const CONFIDENCE_THRESHOLD = 55;

function StatusChip({ status }) {
  const map = {
    present: { bg: 'rgba(0,255,136,0.12)', color: '#00ff88', label: 'Present' },
    late: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', label: 'Late' },
    absent: { bg: 'rgba(255,68,102,0.12)', color: '#ff4466', label: 'Absent' },
    'half-day': { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', label: 'Half Day' },
  };
  const s = map[status] || { bg: '#1e293b', color: '#94a3b8', label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: '20px', padding: '3px 10px',
      fontSize: '11px', fontWeight: 600,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {s.label}
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: '#0d1424',
      border: `1px solid ${accent || '#1e293b'}`,
      borderRadius: '12px', padding: '16px',
      flex: 1, minWidth: '120px',
    }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color: accent || '#e2e8f0' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

function AttendanceRow({ record }) {
  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '1px solid #1e293b', gap: '8px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {record.name || record.employee_id?.slice(0, 8)}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>{record.department || ''}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          {fmt(record.check_in)}{record.check_out ? ` → ${fmt(record.check_out)}` : ''}
        </div>
        <StatusChip status={record.status || 'absent'} />
      </div>
    </div>
  );
}

function TimeRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <span style={{ fontSize: '12px', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 600, color: accent ? '#00ff88' : '#e2e8f0' }}>{value}</span>
    </div>
  );
}

export default function FaceAttendance() {
  const [storedEmbeddings, setStoredEmbeddings] = useState([]);
  const [todaySummary, setTodaySummary] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsError, setModelsError] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [scanResult, setScanResult] = useState(null);

  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, total: 0 });

  const scannerRef = useRef(null);
  const isMounted = useRef(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCheckout = searchParams.get('mode') === 'checkout';
const isCheckin = searchParams.get('mode') === 'checkin';

  useEffect(() => {
    isMounted.current = true;
    initPage();
    return () => { isMounted.current = false; };
  }, []);

  // Auto-start scan for checkin mode when models are ready
  useEffect(() => {
    if (modelsReady && isCheckin) {
      handleStartScan();
    }
  }, [modelsReady, isCheckin]);

  async function initPage() {
    setLoadingData(true);
    try {
      // ── Load models with proper await ──────────────────────────────
      if (!areModelsLoaded()) {
        try {
          await loadModels('/models');
          if (isMounted.current) setModelsReady(true);
        } catch (e) {
          console.error('[FaceAttendance] Model load error:', e);
          if (isMounted.current) setModelsError(true);
        }
      } else {
        if (isMounted.current) setModelsReady(true);
      }

      const [embeddings, summary] = await Promise.all([
        getAllFaceEmbeddings(),
        getTodaySummary(),
      ]);

      if (!isMounted.current) return;
      setStoredEmbeddings(embeddings);
      setTodaySummary(summary);

      const present = summary.filter((r) => r.status === 'present').length;
      const late = summary.filter((r) => r.status === 'late').length;
      const total = summary.length;
      setStats({ present, late, absent: Math.max(0, total - present - late), total });
    } catch (err) {
      console.error('[FaceAttendance] Init error:', err);
    } finally {
      if (isMounted.current) setLoadingData(false);
    }
  }

  function handleStartScan() {
    if (!modelsReady) {
      setScanMessage('AI models still loading, please wait…');
      return;
    }
    if (storedEmbeddings.length === 0) {
      setScanMessage('No faces registered yet. Please ask an admin to register employee faces first.');
      return;
    }
    setScanPhase('scanning');
    setScanning(true);
    setScanResult(null);
    setScanMessage('');
    setTimeout(() => { scannerRef.current?.startScan(); }, 500);
  }

  function handleCancelScan() {
    setScanning(false);
    setScanPhase('idle');
    setScanMessage('');
    scannerRef.current?.stopCamera();
  }

  const handleScanComplete = useCallback(async (embedding) => {
    if (!isMounted.current) return;
    setScanPhase('matching');
    setScanMessage('Matching face…');

    try {
      const matchResult = findBestMatch(embedding, storedEmbeddings);

      if (!matchResult.matched || matchResult.confidence < CONFIDENCE_THRESHOLD) {
        throw new Error(
          `Face not recognised (confidence: ${matchResult.confidence}%). ` +
          `Please ensure you are registered or try again in better lighting.`
        );
      }

      setScanPhase('recording');
      setScanMessage(`Matched ${matchResult.employee?.full_name} (${matchResult.confidence}%) — recording attendance…`);

      const existing = await getTodayAttendance(matchResult.employeeId);

      let record;
      if (existing?.check_in && !existing?.check_out) {
        record = await recordCheckOut(matchResult.employeeId);
        record._action = 'check-out';
      } else if (existing?.check_in && existing?.check_out) {
        record = existing;
        record._action = 'already-done';
      } else {
        record = await recordCheckIn(matchResult.employeeId, matchResult.confidence / 100);
        record._action = 'check-in';
      }

      if (!isMounted.current) return;
      setScanPhase('done');
      setScanResult({
        employee: matchResult.employee,
        confidence: matchResult.confidence,
        record,
        action: record._action,
      });
      setScanning(false);
        if (isCheckout) {
          setTimeout(async () => {
            await signOut();
            navigate('/dashboard');
          }, 2000);
        }

      const summary = await getTodaySummary();
      if (isMounted.current) {
        setTodaySummary(summary);
        const present = summary.filter((r) => r.status === 'present').length;
        const late = summary.filter((r) => r.status === 'late').length;
        setStats({ present, late, absent: Math.max(0, summary.length - present - late), total: summary.length });
      }
    } catch (err) {
      if (!isMounted.current) return;
      setScanPhase('error');
      setScanMessage(err.message);
      setScanning(false);
    }
  }, [storedEmbeddings]);

  const handleScanError = useCallback((msg) => {
    if (!isMounted.current) return;
    setScanPhase('error');
    setScanMessage(msg);
    setScanning(false);
  }, []);

  const fmtTime = (ts) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const fmtDate = () =>
    new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>⬡</div>
            <div>
              <h1 style={styles.title}>FaceAttend</h1>
              <p style={styles.dateText}>{fmtDate()}</p>
            </div>
          </div>
          <div style={styles.clockBadge}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </header>

        {/* Stats */}
        {!loadingData && (
          <div style={styles.statsRow}>
            <StatCard label="Present" value={stats.present} accent="#00ff88" />
            <StatCard label="Late" value={stats.late} accent="#fbbf24" />
            <StatCard label="Absent" value={stats.absent} accent="#ff4466" />
            <StatCard
              label="Registered" sub="faces"
              value={storedEmbeddings.length > 0
                ? [...new Set(storedEmbeddings.map((e) => e.employee_id))].length
                : '—'}
            />
          </div>
        )}

        {/* Scan panel */}
        <div style={styles.scanPanel}>

          {/* Idle */}
          {!scanning && scanPhase === 'idle' && (
            <div style={styles.idleContent}>
              <div style={styles.idleIcon}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" stroke="#1e293b" strokeWidth="2" />
                  <circle cx="24" cy="20" r="7" stroke="#00c8ff" strokeWidth="2" />
                  <path d="M10 40c0-7.732 6.268-14 14-14s14 6.268 14 14"
                    stroke="#00c8ff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <h2 style={styles.idleTitle}>Mark Attendance</h2>
              <p style={styles.idleSubtitle}>
                Look directly at the camera when scanning begins.
                The system will automatically identify and record your attendance.
              </p>

              {/* Models loading indicator */}
              {!modelsReady && !modelsError && (
                <div style={styles.modelLoadingBar}>
                  <div style={styles.modelLoadingFill} />
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    Loading AI models…
                  </span>
                </div>
              )}

              {/* Models error */}
              {modelsError && (
                <p style={{ color: '#ff8099', fontSize: '13px', textAlign: 'center', margin: 0 }}>
                  ⚠️ Failed to load AI models. Check that <code style={{ color: '#fbbf24' }}>/public/models</code> folder exists.
                </p>
              )}

              <button
                style={{
                  ...styles.btnStart,
                  opacity: modelsReady ? 1 : 0.45,
                  cursor: modelsReady ? 'pointer' : 'not-allowed',
                }}
                onClick={handleStartScan}
                disabled={!modelsReady}
              >
                <span style={styles.btnStartIcon}>◉</span>
                {modelsReady ? 'Start Face Scan' : 'Loading AI Models…'}
              </button>

              {scanMessage && (
                <p style={{ color: '#ff8099', fontSize: '13px', margin: '8px 0 0', textAlign: 'center' }}>
                  {scanMessage}
                </p>
              )}
            </div>
          )}

          {/* Scanning */}
          {scanning && (
            <div style={styles.scanContent}>
              <div style={styles.scanHeader}>
                <div>
                  <h2 style={{ ...styles.idleTitle, marginBottom: '4px' }}>
                    {scanPhase === 'matching' ? 'Matching Face…' :
                      scanPhase === 'recording' ? 'Recording…' : 'Face Scanning'}
                  </h2>
                  {scanMessage && (
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{scanMessage}</p>
                  )}
                </div>
                <button style={styles.btnCancel} onClick={handleCancelScan}>✕</button>
              </div>

              <FaceScanner
                ref={scannerRef}
                isActive={scanning}
                onScanComplete={handleScanComplete}
                onError={handleScanError}
                onFaceDetected={() => { }}
              />

              {(scanPhase === 'matching' || scanPhase === 'recording') && (
                <div style={styles.processingBar}>
                  <div style={styles.processingFill} />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {!scanning && scanPhase === 'error' && (
            <div style={styles.resultContent}>
              <div style={{ ...styles.resultIcon, borderColor: '#ff4466', background: 'rgba(255,68,102,0.1)' }}>
                <span style={{ fontSize: '32px', color: '#ff4466' }}>✗</span>
              </div>
              <h2 style={{ ...styles.idleTitle, color: '#ff8099' }}>Scan Failed</h2>
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', lineHeight: 1.6 }}>
                {scanMessage}
              </p>
              <button style={styles.btnStart} onClick={() => { setScanPhase('idle'); setScanMessage(''); }}>
                ↺ Try Again
              </button>
            </div>
          )}

          {/* Success */}
          {!scanning && scanPhase === 'done' && scanResult && (
            <div style={styles.resultContent}>
              <div style={styles.resultIcon}>
                <span style={{ fontSize: '32px', color: '#00ff88' }}>✓</span>
              </div>
              <div style={styles.resultEmployeeName}>{scanResult.employee?.name ?? 'Employee'}</div>
              <div style={styles.resultDept}>{scanResult.employee?.department}</div>

              <div style={styles.resultChips}>
                <StatusChip status={scanResult.record?.status || 'present'} />
                <span style={styles.confidenceChip}>{scanResult.confidence}% match</span>
              </div>

              <div style={styles.timeCard}>
                {scanResult.action === 'check-out' ? (
                  <>
                    <TimeRow label="Check In" value={fmtTime(scanResult.record?.check_in)} />
                    <TimeRow label="Check Out" value={fmtTime(scanResult.record?.check_out)} accent />
                  </>
                ) : scanResult.action === 'already-done' ? (
                  <>
                    <TimeRow label="Check In" value={fmtTime(scanResult.record?.check_in)} />
                    <TimeRow label="Check Out" value={fmtTime(scanResult.record?.check_out)} />
                    <p style={{ color: '#fbbf24', fontSize: '12px', margin: '8px 0 0', textAlign: 'center' }}>
                      Attendance already recorded for today.
                    </p>
                  </>
                ) : (
                  <TimeRow label="Check In" value={fmtTime(scanResult.record?.check_in)} accent />
                )}
              </div>

              <button
                style={{ ...styles.btnStart, background: 'linear-gradient(135deg,#1e293b,#0f172a)', color: '#94a3b8', border: '1px solid #334155' }}
                onClick={() => {
        if (isCheckin) {
          navigate('/dashboard');
        } else {
          setScanPhase('idle');
          setScanResult(null);
        }
      }}
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Today's list */}
        <div style={styles.summaryPanel}>
          <h2 style={styles.sectionTitle}>Today's Attendance</h2>
          {loadingData ? (
            <p style={styles.muted}>Loading…</p>
          ) : todaySummary.length === 0 ? (
            <p style={styles.muted}>No attendance records yet today.</p>
          ) : (
            todaySummary.map((r, i) => <AttendanceRow key={r.employee_id || i} record={r} />)
          )}
        </div>

      </div>

      <style>{`
        @keyframes fadeIn          { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes processingSlide { from{transform:translateX(-100%)} to{transform:translateX(100%)} }
        @keyframes modelPulse      { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing:border-box; }
        button { cursor:pointer; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at 20% 0%, #0a1628 0%, #060b14 60%)',
    padding: '24px 16px 64px',
    fontFamily: '"DM Sans","Segoe UI",system-ui,sans-serif',
    color: '#e2e8f0',
  },
  container: {
    maxWidth: '560px', margin: '0 auto',
    display: 'flex', flexDirection: 'column', gap: '20px',
    animation: 'fadeIn 0.4s ease',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoIcon: {
    width: '40px', height: '40px',
    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    borderRadius: '10px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '20px', color: '#fff', flexShrink: 0,
  },
  title: { fontSize: '20px', fontWeight: 700, margin: 0, color: '#f1f5f9' },
  dateText: { fontSize: '11px', color: '#64748b', margin: '2px 0 0' },
  clockBadge: {
    background: '#0d1424', border: '1px solid #1e293b',
    borderRadius: '8px', padding: '6px 12px',
    fontSize: '14px', fontWeight: 600, color: '#00c8ff',
    letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums',
  },
  statsRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  scanPanel: { background: '#0d1424', border: '1px solid #1e293b', borderRadius: '20px', overflow: 'hidden' },
  idleContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', gap: '16px' },
  idleIcon: {
    width: '80px', height: '80px',
    background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px',
  },
  idleTitle: { fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0, textAlign: 'center' },
  idleSubtitle: { color: '#64748b', fontSize: '13px', textAlign: 'center', lineHeight: 1.6, maxWidth: '320px', margin: 0 },

  // Models loading bar
  modelLoadingBar: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: '100%', maxWidth: '260px', gap: '4px',
  },
  modelLoadingFill: {
    width: '100%', height: '3px',
    background: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
    borderRadius: '2px',
    animation: 'modelPulse 1.4s ease-in-out infinite',
  },

  btnStart: {
    background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    border: 'none', borderRadius: '12px', padding: '14px 32px',
    color: '#fff', fontSize: '15px', fontWeight: 700,
    display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px',
    letterSpacing: '0.02em', transition: 'transform 0.15s ease, opacity 0.15s ease',
  },
  btnStartIcon: { fontSize: '18px', lineHeight: 1 },

  scanContent: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  scanHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  btnCancel: {
    background: 'transparent', border: '1px solid #334155',
    borderRadius: '8px', color: '#64748b', padding: '6px 10px', fontSize: '14px', flexShrink: 0,
  },
  processingBar: { height: '3px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden', position: 'relative' },
  processingFill: {
    position: 'absolute', top: 0, left: 0, height: '100%', width: '40%',
    background: 'linear-gradient(90deg,transparent,#00c8ff,transparent)',
    animation: 'processingSlide 1.2s ease-in-out infinite',
  },

  resultContent: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '40px 24px', gap: '12px', animation: 'fadeIn 0.35s ease',
  },
  resultIcon: {
    width: '72px', height: '72px', borderRadius: '50%',
    border: '2px solid #00ff88', background: 'rgba(0,255,136,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 24px rgba(0,255,136,0.2)', marginBottom: '4px',
  },
  resultEmployeeName: { fontSize: '22px', fontWeight: 700, color: '#f1f5f9' },
  resultDept: { fontSize: '13px', color: '#64748b' },
  resultChips: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' },
  confidenceChip: {
    background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.25)',
    color: '#00c8ff', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600,
  },
  timeCard: {
    width: '100%', maxWidth: '260px',
    background: '#060b14', border: '1px solid #1e293b',
    borderRadius: '12px', padding: '12px 16px', marginTop: '4px',
  },

  summaryPanel: { background: '#0d1424', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' },
  sectionTitle: { fontSize: '15px', fontWeight: 600, color: '#cbd5e1', margin: '0 0 12px' },
  muted: { color: '#64748b', fontSize: '13px', margin: 0 },
};