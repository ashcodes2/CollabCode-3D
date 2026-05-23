import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { X, Plus, ChevronRight } from 'lucide-react';

const Terminal = forwardRef(({ onRun, isRunning, language }, ref) => {
  const [history, setHistory] = useState([
    { type: 'system', text: 'Welcome to CollabCode Terminal. Click ▶ Run Code to execute.' },
  ]);
  const [inputLine, setInputLine] = useState('');
  const [pendingInputs, setPendingInputs] = useState([]);
  const historyEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom whenever history changes
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useImperativeHandle(ref, () => ({
    // Returns all queued stdin as newline-joined string
    getStdin: () => pendingInputs.join('\n'),
    getPendingInputs: () => pendingInputs,

    // Called by App to push output into history after execution
    pushOutput: (text) => {
      const lines = text.split('\n');
      setHistory(prev => [
        ...prev,
        ...lines.map(l => ({ type: 'output', text: l })),
      ]);
    },

    // Called by App to show system messages (errors, warnings)
    pushSystem: (text) => {
      setHistory(prev => [...prev, { type: 'system', text }]);
    },

    // Called after run to reset pending inputs
    clearPending: () => setPendingInputs([]),
  }));

  // Press Enter in the input line → queue an stdin value
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const val = inputLine.trim();
      if (val === 'clear' || val === 'cls') {
        setHistory([{ type: 'system', text: 'Terminal cleared.' }]);
        setPendingInputs([]);
        setInputLine('');
        return;
      }
      // Echo the typed value into history (green = stdin echo)
      setHistory(prev => [...prev, { type: 'stdin', text: val }]);
      setPendingInputs(prev => [...prev, val]);
      setInputLine('');
    }
  };

  const lineColor = (type) => {
    if (type === 'system')  return '#6b7280';   // grey
    if (type === 'stdin')   return '#4ade80';   // green (what user typed)
    if (type === 'error')   return '#f87171';   // red
    if (type === 'running') return '#60a5fa';   // blue
    return '#d4d4d4';                           // white-ish for output
  };

  const linePrefix = (type) => {
    if (type === 'stdin')   return '$ ';
    if (type === 'running') return '▶ ';
    return '';
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1e1e1e',
        fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
        fontSize: '13px',
        overflow: 'hidden',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* ── VS Code–style Tab Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#252526',
        borderBottom: '1px solid #3c3c3c',
        height: '35px',
        paddingLeft: '8px',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        {/* Active tab */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 12px',
          height: '100%',
          background: '#1e1e1e',
          borderTop: '1px solid #0078d4',  // blue active indicator
          color: '#fff',
          fontSize: '12px',
          cursor: 'default',
        }}>
          <span style={{ opacity: 0.7 }}>⬡</span>
          <span>bash</span>
          <X size={12} style={{ opacity: 0.5, cursor: 'pointer', marginLeft: '4px' }} />
        </div>

        {/* New terminal button */}
        <div style={{ marginLeft: '4px', padding: '4px', cursor: 'pointer', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
          <Plus size={14} color="#ccc" />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Pending input badge */}
        {pendingInputs.length > 0 && (
          <span style={{
            background: '#4ade8022',
            border: '1px solid #4ade8055',
            color: '#4ade80',
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '10px',
            marginRight: '8px',
          }}>
            {pendingInputs.length} input{pendingInputs.length > 1 ? 's' : ''} queued
          </span>
        )}

        {/* Run button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRun(); }}
          disabled={isRunning}
          style={{
            background: isRunning ? 'transparent' : '#0078d422',
            border: '1px solid ' + (isRunning ? '#555' : '#0078d4'),
            color: isRunning ? '#888' : '#4fc3f7',
            borderRadius: '4px',
            padding: '3px 12px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginRight: '4px',
            fontFamily: 'inherit',
          }}
        >
          {isRunning
            ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span>
            : '▶'
          }
          {isRunning ? 'Running...' : 'Run'}
        </button>

        {/* Clear button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setHistory([{ type: 'system', text: 'Terminal cleared.' }]);
            setPendingInputs([]);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '11px',
            padding: '3px 8px',
            marginRight: '8px',
            fontFamily: 'inherit',
          }}
        >
          Clear
        </button>
      </div>

      {/* ── History / Output Area ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 16px 4px',
          lineHeight: '1.55',
        }}
      >
        {history.map((entry, i) => (
          <div
            key={i}
            style={{
              color: lineColor(entry.type),
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <span style={{ opacity: 0.45, marginRight: '4px', userSelect: 'none' }}>
              {linePrefix(entry.type)}
            </span>
            {entry.text || '\u00a0'}
          </div>
        ))}
        <div ref={historyEndRef} />
      </div>

      {/* ── Input prompt line (always at bottom) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 16px',
        borderTop: '1px solid #3c3c3c',
        background: '#1e1e1e',
        flexShrink: 0,
        gap: '6px',
      }}>
        {/* Prompt symbol */}
        <ChevronRight size={13} color="#4ade80" style={{ flexShrink: 0 }} />

        {/* Actual input */}
        <input
          ref={inputRef}
          type="text"
          value={inputLine}
          onChange={(e) => setInputLine(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            language === 'python' ? "Type stdin value and press Enter to queue it... (e.g. Ashwani)"
            : language === 'java' || language === 'cpp' ? "Type input and press Enter to queue..."
            : "Run your code above to see output here..."
          }
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#4ade80',
            fontFamily: 'inherit',
            fontSize: '13px',
            caretColor: '#4ade80',
          }}
          autoFocus
        />
      </div>
    </div>
  );
});

export default Terminal;
