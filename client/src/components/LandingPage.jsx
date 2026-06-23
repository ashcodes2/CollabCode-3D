import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Code2, Rocket, Lock, LogIn, Plus, Eye, EyeOff,
  AlertCircle, Zap, Globe, Users, Terminal,
  ArrowRight, Sparkles, RefreshCw, Copy, Check,
} from 'lucide-react';
import '../index.css';

// ── Room ID generator (unchanged) ────────────────────────────────────────────
function generateRoomId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

// ── Animated floating code snippets ──────────────────────────────────────────
const CODE_LINES = [
  { text: 'const room = await Room.join(id);',     color: '#60a5fa', delay: 0    },
  { text: 'room.on("sync", applyUpdate);',         color: '#a78bfa', delay: 0.3  },
  { text: 'editor.setLanguage("python");',         color: '#22d3ee', delay: 0.6  },
  { text: 'socket.emit("tree-change", payload);',  color: '#60a5fa', delay: 0.9  },
  { text: 'Y.applyUpdate(doc, new Uint8Array(u));',color: '#a78bfa', delay: 1.2  },
  { text: 'io.to(roomId).emit("edit-granted");',   color: '#22d3ee', delay: 1.5  },
];

const FEATURES = [
  {
    icon: <Zap size={18} />,
    label: 'Real-time CRDT Sync',
    desc: 'Zero-conflict editing via Yjs',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.25)',
  },
  {
    icon: <Terminal size={18} />,
    label: '19 Languages',
    desc: 'Cloud execution sandbox',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.25)',
  },
  {
    icon: <Users size={18} />,
    label: 'Live Presence',
    desc: 'Role-based access control',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
    border: 'rgba(6,182,212,0.25)',
  },
];

// ── Floating orb component ────────────────────────────────────────────────────
function FloatingOrb({ x, y, size, color, blur, opacity, delay }) {
  return (
    <motion.div
      animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{
        position: 'absolute', left: x, top: y,
        width: size, height: size,
        borderRadius: '50%',
        background: color,
        filter: `blur(${blur}px)`,
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// ── Animated collaborators widget ─────────────────────────────────────────────
const COLLABORATORS = [
  { name: 'Alex', color: '#3b82f6', pos: { x: 60,  y: 40  }, cursor: '▮', delay: 0    },
  { name: 'Sam',  color: '#8b5cf6', pos: { x: 170, y: 80  }, cursor: '▮', delay: 0.4  },
  { name: 'Jordan',color:'#06b6d4', pos: { x: 110, y: 130 }, cursor: '▮', delay: 0.8  },
];

function CollabDemo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.8 }}
      style={{
        position: 'relative',
        width: '100%',
        height: '190px',
        background: 'rgba(6,6,18,0.7)',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
      }}
    >
      {/* Editor header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.3)',
      }}>
        {['#ff5f57','#febc2e','#28c840'].map(c => (
          <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          main.py — CollabCode
        </span>
        {/* Live users */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {COLLABORATORS.map(c => (
            <div key={c.name} style={{
              width: 22, height: 22, borderRadius: '50%',
              background: c.color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 9, fontWeight: 700,
              color: '#fff', border: '2px solid rgba(0,0,0,0.5)',
              boxShadow: `0 0 8px ${c.color}66`,
              fontFamily: 'Inter, sans-serif',
            }}>
              {c.name[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Code lines */}
      <div style={{ padding: '10px 14px', position: 'relative' }}>
        {CODE_LINES.slice(0,5).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + i * 0.12, duration: 0.4 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 3,
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, width: 14, textAlign: 'right', flexShrink: 0 }}>
              {i + 1}
            </span>
            <span style={{ color: line.color, fontSize: 11 }}>{line.text}</span>
          </motion.div>
        ))}

        {/* Floating cursor indicators */}
        {COLLABORATORS.map((c) => (
          <motion.div
            key={c.name}
            animate={{ opacity: [0.7, 1, 0.7], y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: c.delay, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: c.pos.x, top: c.pos.y,
              pointerEvents: 'none',
            }}
          >
            <div style={{
              background: c.color, color: '#fff',
              fontSize: 8, fontWeight: 700, padding: '1px 5px',
              borderRadius: '4px 4px 4px 0', fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap', boxShadow: `0 2px 8px ${c.color}66`,
              marginBottom: 1,
            }}>
              {c.name}
            </div>
            <div style={{ width: 2, height: 12, background: c.color, borderRadius: 1 }} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main LandingPage component ────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  // ── State (100% unchanged) ────────────────────────────────────────────────
  const [tab,            setTab]            = useState('create');
  const [createRoomId,   setCreateRoomId]   = useState(() => generateRoomId());
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [joinRoomId,     setJoinRoomId]     = useState('');
  const [joinPassword,   setJoinPassword]   = useState('');
  const [showJoinPass,   setShowJoinPass]   = useState(false);
  const [joinError,      setJoinError]      = useState('');
  const [copiedId,       setCopiedId]       = useState(false);

  // ── Handlers (100% unchanged) ─────────────────────────────────────────────
  const handleCreate = () => {
    const rid = createRoomId.trim().toUpperCase();
    if (!rid) return;
    if (createPassword.trim()) {
      localStorage.setItem(`room_pass_${rid}`, createPassword.trim());
    } else {
      localStorage.removeItem(`room_pass_${rid}`);
    }
    sessionStorage.setItem(`can_edit_${rid}`, 'true');
    navigate(`/editor?room=${rid}`);
  };

  const handleJoin = () => {
    const rid = joinRoomId.trim().toUpperCase();
    if (!rid) { setJoinError('Please enter a Room ID.'); return; }
    setJoinError('');
    const storedPass = localStorage.getItem(`room_pass_${rid}`);
    if (!storedPass) {
      sessionStorage.setItem(`can_edit_${rid}`, 'true');
      navigate(`/editor?room=${rid}`);
    } else if (joinPassword.trim() === storedPass) {
      sessionStorage.setItem(`can_edit_${rid}`, 'true');
      navigate(`/editor?room=${rid}`);
    } else {
      sessionStorage.removeItem(`can_edit_${rid}`);
      navigate(`/editor?room=${rid}&readonly=1`);
    }
  };

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(createRoomId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // ── Shared input style ────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 10,
    color: '#fff',
    padding: '11px 14px',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 7,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="landing-root" style={{ overflow: 'auto', minHeight: '100vh' }}>
      {/* ── Ambient orbs ── */}
      <FloatingOrb x="5%"  y="10%" size={600} color="radial-gradient(circle,#3b82f622,transparent)" blur={0}  opacity={1} delay={0} />
      <FloatingOrb x="55%" y="5%"  size={500} color="radial-gradient(circle,#8b5cf622,transparent)" blur={0}  opacity={1} delay={1} />
      <FloatingOrb x="30%" y="60%" size={400} color="radial-gradient(circle,#06b6d420,transparent)" blur={0}  opacity={1} delay={2} />

      {/* ── Grid texture overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      {/* ── Scanline effect ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <motion.div
          animate={{ y: ['-5%', '105%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
          style={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)',
          }}
        />
      </div>

      {/* ── Main two-column layout ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 1100,
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: 60,
          alignItems: 'center',
          padding: '40px 24px',
        }}
      >
        {/* ══ LEFT COLUMN: Hero ══════════════════════════════════════════════ */}
        <div>
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 99,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              marginBottom: 28,
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 6px #4ade80', animation: 'pulse-glow 2s infinite',
            }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a5b4fc', letterSpacing: '0.04em' }}>
              LIVE · Open Platform · No Account Needed
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16,1,0.3,1] }}
            className="hero-headline"
            style={{ marginBottom: 20 }}
          >
            Code Together.
            <br />
            Ship Faster.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            style={{
              fontSize: '1rem', color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.7, marginBottom: 36, maxWidth: 480,
            }}
          >
            A futuristic collaborative IDE with real-time sync, 19-language execution,
            and role-based access — all in the browser. No install required.
          </motion.p>

          {/* Feature chips */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 40 }}
          >
            {FEATURES.map(f => (
              <div key={f.label} className="feature-chip" style={{
                color: f.color, background: f.bg, borderColor: f.border,
              }}>
                {f.icon}
                <span>{f.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>— {f.desc}</span>
              </div>
            ))}
          </motion.div>

          {/* ── Collaboration demo widget ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
          >
            <CollabDemo />
          </motion.div>

          {/* Tech badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}
          >
            {[
              { name: 'React 19',    dot: '#61dafb' },
              { name: 'Yjs CRDT',   dot: '#8b5cf6' },
              { name: 'Monaco',     dot: '#3b82f6' },
              { name: 'Socket.io',  dot: '#10b981' },
              { name: 'Three.js',   dot: '#22d3ee' },
            ].map(t => (
              <div key={t.name} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
                fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.dot, boxShadow: `0 0 5px ${t.dot}` }} />
                {t.name}
              </div>
            ))}
          </motion.div>
        </div>

        {/* ══ RIGHT COLUMN: Room panel ════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: 30, y: 10 }}
          animate={{ opacity: 1, x: 0,  y: 0  }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16,1,0.3,1] }}
          style={{
            background: 'rgba(8,8,22,0.75)',
            backdropFilter: 'blur(32px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 24,
            padding: '32px 28px',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.8)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Panel glow accent */}
          <div style={{
            position: 'absolute', top: -80, right: -80, width: 200, height: 200,
            background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -60, left: -60, width: 160, height: 160,
            background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent)',
            pointerEvents: 'none',
          }} />

          {/* Logo inside panel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Code2 size={20} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                CollabCode 3D
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                Start a session in seconds
              </div>
            </div>
          </div>

          {/* ── Tab switcher ── */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.04)',
            borderRadius: 10, padding: 3, gap: 2, marginBottom: 24,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {[
              { key: 'create', label: 'Create Room', icon: <Plus size={13} /> },
              { key: 'join',   label: 'Join Room',   icon: <LogIn size={13} /> },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setJoinError(''); }}
                style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                  borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.2s',
                  background: tab === t.key
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))'
                    : 'transparent',
                  color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.35)',
                  boxShadow: tab === t.key ? '0 0 0 1px rgba(255,255,255,0.08)' : 'none',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ══ CREATE TAB ══════════════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            {tab === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Room ID */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Room ID</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        className="room-input"
                        value={createRoomId}
                        onChange={e => setCreateRoomId(e.target.value.toUpperCase())}
                        placeholder="e.g. ABC1234"
                        style={{
                          ...inputStyle,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          paddingRight: 40,
                        }}
                      />
                      <button
                        onClick={copyRoomId}
                        title="Copy room ID"
                        style={{
                          position: 'absolute', right: 10, top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: copiedId ? '#4ade80' : 'rgba(255,255,255,0.3)',
                          padding: 2, display: 'flex', transition: 'color 0.2s',
                        }}
                      >
                        {copiedId ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={() => setCreateRoomId(generateRoomId())}
                      title="Generate new ID"
                      style={{
                        padding: '0 12px', borderRadius: 10, flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.09)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: '0.78rem', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    >
                      <RefreshCw size={12} /> Random
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: 28 }}>
                  <label style={labelStyle}>
                    <Lock size={9} style={{ display: 'inline', marginRight: 5 }} />
                    Password{' '}
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      (optional)
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="room-input"
                      type={showCreatePass ? 'text' : 'password'}
                      value={createPassword}
                      onChange={e => setCreatePassword(e.target.value)}
                      placeholder="Leave blank for open room"
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <button
                      onClick={() => setShowCreatePass(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex',
                      }}
                    >
                      {showCreatePass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {!createPassword && (
                    <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.22)', marginTop: 6 }}>
                      No password = anyone can edit this room
                    </p>
                  )}
                </div>

                {/* CTA */}
                <motion.button
                  className="shine-btn"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
                    backgroundSize: '200% auto',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12, color: '#fff',
                    fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 0 20px rgba(99,102,241,0.3), 0 8px 24px rgba(0,0,0,0.4)',
                    letterSpacing: '-0.01em',
                    animation: 'gradient-flow 3s ease infinite',
                  }}
                >
                  <Rocket size={17} /> Launch Room
                  <ArrowRight size={15} style={{ marginLeft: 2 }} />
                </motion.button>
              </motion.div>
            )}

            {/* ══ JOIN TAB ═════════════════════════════════════════════════ */}
            {tab === 'join' && (
              <motion.div
                key="join"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Room ID */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Room ID</label>
                  <input
                    className="room-input"
                    value={joinRoomId}
                    onChange={e => { setJoinRoomId(e.target.value.toUpperCase()); setJoinError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    placeholder="Enter Room ID (e.g. ABC1234)"
                    style={{
                      ...inputStyle,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>
                    <Lock size={9} style={{ display: 'inline', marginRight: 5 }} />
                    Password{' '}
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      (optional)
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="room-input"
                      type={showJoinPass ? 'text' : 'password'}
                      value={joinPassword}
                      onChange={e => { setJoinPassword(e.target.value); setJoinError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                      placeholder="Enter password for edit access"
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <button
                      onClick={() => setShowJoinPass(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex',
                      }}
                    >
                      {showJoinPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', marginBottom: 18 }}>
                  Without a correct password you can still{' '}
                  <strong style={{ color: 'rgba(255,255,255,0.45)' }}>view</strong> the room in read-only mode.
                </p>

                {/* Error */}
                <AnimatePresence>
                  {joinError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 8, padding: '9px 12px',
                        color: '#fca5a5', fontSize: '0.8rem', marginBottom: 14,
                      }}
                    >
                      <AlertCircle size={13} /> {joinError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA */}
                <motion.button
                  className="shine-btn"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(6,182,212,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleJoin}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(135deg, #0891b2, #3b82f6, #6366f1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12, color: '#fff',
                    fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 0 20px rgba(6,182,212,0.3), 0 8px 24px rgba(0,0,0,0.4)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <LogIn size={17} /> Enter Room
                  <ArrowRight size={15} style={{ marginLeft: 2 }} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Footer note ── */}
          <div style={{
            marginTop: 22, paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)',
          }}>
            <Sparkles size={11} color="rgba(255,255,255,0.2)" />
            No account required · End-to-end collaborative · Free forever
          </div>
        </motion.div>
      </motion.div>

      {/* ── Bottom gradient fade ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(to top, rgba(2,2,9,0.8), transparent)',
        pointerEvents: 'none', zIndex: 1,
      }} />
    </div>
  );
}
