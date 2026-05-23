import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Rocket, Lock, LogIn, Plus, Eye, EyeOff, AlertCircle } from 'lucide-react';
import '../index.css';

function generateRoomId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

export default function LandingPage() {
  const navigate = useNavigate();

  // Tab: 'create' | 'join'
  const [tab, setTab] = useState('create');

  // Create Room state
  const [createRoomId, setCreateRoomId]   = useState(() => generateRoomId());
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePass, setShowCreatePass] = useState(false);

  // Join Room state
  const [joinRoomId, setJoinRoomId]       = useState('');
  const [joinPassword, setJoinPassword]   = useState('');
  const [showJoinPass, setShowJoinPass]   = useState(false);
  const [joinError, setJoinError]         = useState('');

  // ── Create Room ──────────────────────────────────────────────────────────
  const handleCreate = () => {
    const rid = createRoomId.trim().toUpperCase();
    if (!rid) return;

    if (createPassword.trim()) {
      localStorage.setItem(`room_pass_${rid}`, createPassword.trim());
    } else {
      localStorage.removeItem(`room_pass_${rid}`);
    }
    // Creator always gets edit access
    sessionStorage.setItem(`can_edit_${rid}`, 'true');
    navigate(`/editor?room=${rid}`);
  };

  // ── Join Room ────────────────────────────────────────────────────────────
  const handleJoin = () => {
    const rid = joinRoomId.trim().toUpperCase();
    if (!rid) { setJoinError('Please enter a Room ID.'); return; }
    setJoinError('');

    const storedPass = localStorage.getItem(`room_pass_${rid}`);

    if (!storedPass) {
      // Room has no password set — anyone can edit
      sessionStorage.setItem(`can_edit_${rid}`, 'true');
      navigate(`/editor?room=${rid}`);
    } else if (joinPassword.trim() === storedPass) {
      // Correct password
      sessionStorage.setItem(`can_edit_${rid}`, 'true');
      navigate(`/editor?room=${rid}`);
    } else {
      // Wrong / no password → read-only access
      sessionStorage.removeItem(`can_edit_${rid}`);
      navigate(`/editor?room=${rid}&readonly=1`);
    }
  };

  // ── Shared input style ───────────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: '#fff',
    padding: '11px 14px',
    fontSize: '0.92rem',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: '600',
    letterSpacing: '0.06em',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        perspective: '1000px',
      }}
    >
      <style>{`
        @keyframes auto-shine {
          0%   { left: -100%; }
          20%  { left: 200%; }
          100% { left: 200%; }
        }
        .shine-btn { position: relative; overflow: hidden; }
        .shine-btn::before {
          content: "";
          position: absolute; top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-20deg);
          animation: auto-shine 3s infinite;
        }
        .room-input:focus { border-color: rgba(99,102,241,0.7) !important; }
        .tab-btn { transition: all 0.2s; }
      `}</style>

      {/* Background glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '15%', left: '20%',
          width: '300px', height: '300px',
          background: '#06b6d4', filter: 'blur(100px)',
          borderRadius: '50%', zIndex: 0,
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute', bottom: '10%', right: '15%',
          width: '400px', height: '400px',
          background: '#a855f7', filter: 'blur(120px)',
          borderRadius: '50%', zIndex: 0,
        }}
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ zIndex: 10, position: 'relative', width: '100%', maxWidth: '520px' }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          style={{
            background: 'rgba(10, 10, 15, 0.55)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '48px 40px 40px',
            textAlign: 'center',
            boxShadow: '0 0 60px rgba(168,85,247,0.18), 0 8px 32px 0 rgba(0,0,0,0.8)',
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, type: 'spring', bounce: 0.5 }}
            style={{ marginBottom: '18px', display: 'flex', justifyContent: 'center' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))',
              padding: '18px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Code2 size={48} color="#06b6d4" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 style={{
            fontSize: '2.8rem', fontWeight: '900', marginBottom: '6px',
            background: 'linear-gradient(90deg, #06b6d4, #a855f7, #06b6d4)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            CollabCode Editor
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', marginBottom: '32px' }}>
            The futuristic 3D workspace for collaborative web development.
          </p>

          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px', padding: '4px', marginBottom: '28px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {[
              { key: 'create', label: 'Create Room', icon: <Plus size={14} /> },
              { key: 'join',   label: 'Join Room',   icon: <LogIn size={14} /> },
            ].map(t => (
              <button
                key={t.key}
                className="tab-btn"
                onClick={() => { setTab(t.key); setJoinError(''); }}
                style={{
                  flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
                  borderRadius: '9px', fontSize: '0.85rem', fontWeight: '600',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: tab === t.key
                    ? 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(168,85,247,0.25))'
                    : 'transparent',
                  color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: tab === t.key ? '0 0 12px rgba(99,102,241,0.2)' : 'none',
                  border: tab === t.key ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── CREATE ROOM ─────────────────────────────────── */}
          {tab === 'create' && (
            <div style={{ textAlign: 'left' }}>
              {/* Room ID */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Room ID</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="room-input"
                    value={createRoomId}
                    onChange={e => setCreateRoomId(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC1234"
                    style={{ ...inputStyle, flex: 1, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}
                  />
                  <button
                    onClick={() => setCreateRoomId(generateRoomId())}
                    title="Generate new ID"
                    style={{
                      padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap',
                    }}
                  >
                    🎲 Random
                  </button>
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '28px' }}>
                <label style={labelStyle}>
                  <Lock size={10} style={{ display: 'inline', marginRight: '4px' }} />
                  Password <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="room-input"
                    type={showCreatePass ? 'text' : 'password'}
                    value={createPassword}
                    onChange={e => setCreatePassword(e.target.value)}
                    placeholder="Leave blank for open room"
                    style={{ ...inputStyle, paddingRight: '44px' }}
                  />
                  <button
                    onClick={() => setShowCreatePass(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex',
                    }}
                  >
                    {showCreatePass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {!createPassword && (
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: '5px' }}>
                    No password = anyone can edit this room
                  </p>
                )}
              </div>

              {/* CTA */}
              <motion.button
                className="shine-btn"
                whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(168,85,247,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCreate}
                style={{
                  width: '100%', padding: '15px',
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.85), rgba(168,85,247,0.85))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px', color: 'white',
                  fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                }}
              >
                <Rocket size={20} /> Create &amp; Start Coding
              </motion.button>
            </div>
          )}

          {/* ── JOIN ROOM ────────────────────────────────────── */}
          {tab === 'join' && (
            <div style={{ textAlign: 'left' }}>
              {/* Room ID */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Room ID</label>
                <input
                  className="room-input"
                  value={joinRoomId}
                  onChange={e => { setJoinRoomId(e.target.value.toUpperCase()); setJoinError(''); }}
                  placeholder="Enter Room ID"
                  style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>
                  <Lock size={10} style={{ display: 'inline', marginRight: '4px' }} />
                  Password <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="room-input"
                    type={showJoinPass ? 'text' : 'password'}
                    value={joinPassword}
                    onChange={e => { setJoinPassword(e.target.value); setJoinError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    placeholder="Enter password for edit access"
                    style={{ ...inputStyle, paddingRight: '44px' }}
                  />
                  <button
                    onClick={() => setShowJoinPass(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex',
                    }}
                  >
                    {showJoinPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Info note */}
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }}>
                Without a correct password you can still <strong style={{ color: 'rgba(255,255,255,0.5)' }}>view</strong> the room in read-only mode.
              </p>

              {/* Error */}
              {joinError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px', padding: '9px 12px',
                  color: '#fca5a5', fontSize: '0.82rem', marginBottom: '14px',
                }}>
                  <AlertCircle size={14} /> {joinError}
                </div>
              )}

              {/* CTA */}
              <motion.button
                className="shine-btn"
                whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(168,85,247,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleJoin}
                style={{
                  width: '100%', padding: '15px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.85), rgba(168,85,247,0.85))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px', color: 'white',
                  fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                }}
              >
                <LogIn size={20} /> Join Room
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Bottom tech badges */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '30px', display: 'flex', gap: '16px', zIndex: 10, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {[
          { name: 'React',   color: '#61dafb' },
          { name: 'Monaco',  color: '#818cf8' },
          { name: 'Vite',    color: '#fbbf24' },
        ].map((tech, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '5px 14px', background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px',
            backdropFilter: 'blur(10px)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: tech.color, boxShadow: `0 0 6px ${tech.color}` }} />
            {tech.name}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
