import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { emmetHTML, emmetCSS, emmetJSX } from 'emmet-monaco-es';
import {
  Code2, Settings, Globe, RefreshCw, Copy, Check,
  FileCode, FileText, Braces, FileCog, Trash2,
  ChevronDown, ChevronRight, FolderOpen, Folder,
  FilePlus, FolderPlus,
} from 'lucide-react';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import '../index.css';

// ── Starter content ───────────────────────────────────────────────────────────
const STARTER_HTML = (title = 'My Page') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Hello from ${title}! 👋</h1>
    <p>Edit the files to see a live preview.</p>
    <button onclick="greet()">Click me!</button>
    <p id="output"></p>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

const STARTER_CSS = `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  color: white;
}
.container {
  text-align: center; padding: 40px;
  background: rgba(255,255,255,0.07);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
}
h1 {
  font-size: 2.5rem; margin-bottom: 16px;
  background: linear-gradient(90deg, #6366f1, #ec4899);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
p { opacity: 0.7; margin-bottom: 24px; font-size: 1.1rem; }
button {
  padding: 12px 28px;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  border: none; border-radius: 50px; color: white;
  font-size: 1rem; font-weight: 600; cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
button:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
#output { margin-top: 20px; font-size: 1.2rem; color: #4ade80; }`;

const STARTER_JS = `function greet() {
  const msgs = [
    "Hello from JavaScript! 🚀",
    "CollabCode is awesome! ✨",
    "Build together, ship faster! 💻",
    "Real-time collaboration rocks! 🎉",
  ];
  document.getElementById('output').textContent =
    msgs[Math.floor(Math.random() * msgs.length)];
}`;

// ── Default flat-path tree (key = full path) ──────────────────────────────────
// Folders: { type:'folder', name }
// Files:   { type:'file', name, language, value }
const DEFAULT_TREE = {
  'index.html': { type: 'file', name: 'index.html', language: 'html',       value: STARTER_HTML('CollabCode 3D') },
  'style.css':  { type: 'file', name: 'style.css',  language: 'css',        value: STARTER_CSS },
  'script.js':  { type: 'file', name: 'script.js',  language: 'javascript', value: STARTER_JS },
};

// ── Pure helper functions ─────────────────────────────────────────────────────
function inferLanguage(name) {
  const ext = name.split('.').pop();
  return { html:'html', css:'css', js:'javascript', ts:'typescript', json:'json' }[ext] ?? 'plaintext';
}

function FileIcon({ name, size = 13 }) {
  const ext = name.split('.').pop();
  if (ext === 'html') return <FileCode size={size} color="#e44d26" />;
  if (ext === 'css')  return <FileCog  size={size} color="#5b8af5" />;
  if (ext === 'js')   return <Braces   size={size} color="#f7df1e" />;
  return <FileText size={size} color="#888" />;
}

/**
 * Resolve a relative href/src to an absolute tree key.
 * e.g. resolvePath('about', '../shared/reset.css') → 'shared/reset.css'
 */
function resolvePath(folderPath, href) {
  href = href.replace(/^\.\//, ''); // strip leading ./
  if (href.startsWith('../')) {
    const parts = folderPath.split('/').filter(Boolean);
    parts.pop();
    href = href.slice(3);
    return parts.length ? `${parts.join('/')}/${href}` : href;
  }
  return folderPath ? `${folderPath}/${href}` : href;
}

/**
 * Build the srcdoc for the iframe.
 * Inlines all <link href="*.css"> and <script src="*.js"> found in the
 * selected HTML file, resolving paths relative to that file's folder.
 * This avoids any cross-origin / blob-URL issues with the sandbox.
 */
function buildSrcDoc(tree, previewPath) {
  const htmlNode = tree[previewPath];
  if (!htmlNode || htmlNode.type !== 'file') return '';
  const folderPath = previewPath.includes('/')
    ? previewPath.split('/').slice(0, -1).join('/')
    : '';

  let html = htmlNode.value ?? '';

  // Inline <link rel="stylesheet" href="*.css">
  html = html.replace(
    /<link([^>]*)href=["']([^"']+\.css)["']([^>]*)>/gi,
    (_m, a, href, b) => {
      const node = tree[resolvePath(folderPath, href)];
      return node ? `<style>${node.value}</style>` : `<link${a}href="${href}"${b}>`;
    }
  );

  // Inline <script src="*.js"></script>
  html = html.replace(
    /<script([^>]*)src=["']([^"']+\.js)["']([^>]*)><\/script>/gi,
    (_m, a, src, b) => {
      const node = tree[resolvePath(folderPath, src)];
      return node ? `<script${a}${b}>\n${node.value}\n</script>` : `<script${a}src="${src}"${b}></script>`;
    }
  );

  return html;
}

/**
 * Return direct children of `prefix` in the flat tree, sorted
 * folders-first then alphabetically.
 */
function getChildren(tree, prefix) {
  return Object.entries(tree)
    .filter(([path]) => {
      if (prefix === '') return !path.includes('/');
      const rest = path.slice(prefix.length + 1);
      return path.startsWith(prefix + '/') && !rest.includes('/');
    })
    .sort(([, a], [, b]) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (b.type === 'folder' && a.type !== 'folder') return  1;
      return 0;
    });
}

/** Create the three starter files for a brand-new folder. */
function starterFiles(folderPath) {
  const name = folderPath.split('/').pop();
  return {
    [`${folderPath}/index.html`]: { type:'file', name:'index.html', language:'html',       value: STARTER_HTML(name) },
    [`${folderPath}/style.css`]:  { type:'file', name:'style.css',  language:'css',        value: STARTER_CSS },
    [`${folderPath}/script.js`]:  { type:'file', name:'script.js',  language:'javascript', value: STARTER_JS },
  };
}

// ── Monaco theme + Emmet (init once) ─────────────────────────────────────────
let emmetInitialized = false;
function defineTheme(monaco) {
  monaco.editor.defineTheme('collab-dark', {
    base: 'vs-dark', inherit: true, rules: [],
    colors: {
      'editor.background':              '#0d0d0d',
      'editor.lineHighlightBackground': '#ffffff08',
      'editorLineNumber.foreground':    '#ffffff28',
      'editorGutter.background':        '#0d0d0d',
    },
  });
  monaco.editor.setTheme('collab-dark');
  if (!emmetInitialized) {
    emmetHTML(monaco, ['html','php','vue']);
    emmetCSS(monaco, ['css','scss','less']);
    emmetJSX(monaco, ['javascript','typescript','jsx','tsx']);
    emmetInitialized = true;
  }
  const jsD = monaco.languages.typescript.javascriptDefaults;
  jsD.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true, esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    allowJs: true, typeRoots: ['node_modules/@types'],
  });
  jsD.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
  jsD.setEagerModelSync(true);
  monaco.languages.html.htmlDefaults.setOptions({ format:{ tabSize:2, insertSpaces:true }, suggest:{ html5:true } });
  monaco.languages.css.cssDefaults.setOptions({ validate: true });
}

// ── Recursive Tree Node Component ─────────────────────────────────────────────
function TreeNode({
  path, node, tree, level = 0,
  activeFilePath, previewFilePath,
  onFileClick, onSetPreview, onDelete,
  expandedFolders, toggleFolder,
  onAddFile, onAddFolder,
}) {
  const indent = level * 14;

  // ── FOLDER ──────────────────────────────────────────────────────────────
  if (node.type === 'folder') {
    const isOpen = expandedFolders.has(path);
    const children = getChildren(tree, path);
    return (
      <>
        <div
          onClick={() => toggleFolder(path)}
          style={{
            display:'flex', alignItems:'center', gap:'5px',
            padding:`6px 10px 6px ${10 + indent}px`,
            cursor:'pointer', color:'rgba(255,255,255,0.78)',
            fontSize:'0.8rem', userSelect:'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
        >
          {isOpen
            ? <ChevronDown  size={11} color="rgba(255,255,255,0.35)" />
            : <ChevronRight size={11} color="rgba(255,255,255,0.35)" />}
          {isOpen
            ? <FolderOpen size={13} color="#fbbf24" />
            : <Folder     size={13} color="#fbbf24" />}
          <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {node.name}
          </span>
          {/* Folder action buttons */}
          <button onClick={e=>{ e.stopPropagation(); onAddFile(path); }}
            title="New file in folder"
            style={btnStyle} onMouseEnter={hoverOn('#c084fc')} onMouseLeave={hoverOff}>
            <FilePlus size={10}/>
          </button>
          <button onClick={e=>{ e.stopPropagation(); onDelete(path); }}
            title="Delete folder"
            style={btnStyle} onMouseEnter={hoverOn('#f87171')} onMouseLeave={hoverOff}>
            <Trash2 size={10}/>
          </button>
        </div>

        {isOpen && children.map(([childPath, childNode]) => (
          <TreeNode
            key={childPath}
            path={childPath} node={childNode} tree={tree}
            level={level + 1}
            activeFilePath={activeFilePath} previewFilePath={previewFilePath}
            onFileClick={onFileClick} onSetPreview={onSetPreview} onDelete={onDelete}
            expandedFolders={expandedFolders} toggleFolder={toggleFolder}
            onAddFile={onAddFile} onAddFolder={onAddFolder}
          />
        ))}
      </>
    );
  }

  // ── FILE ────────────────────────────────────────────────────────────────
  const isActive  = activeFilePath  === path;
  const isPreview = previewFilePath === path;
  const isHtml    = node.name.endsWith('.html');

  return (
    <div
      onClick={() => onFileClick(path)}
      style={{
        display:'flex', alignItems:'center', gap:'6px',
        padding:`6px 10px 6px ${10 + indent}px`,
        cursor:'pointer',
        background:   isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
        borderLeft:  `2px solid ${isActive ? '#6366f1' : 'transparent'}`,
        color:        isActive ? '#fff' : 'rgba(255,255,255,0.55)',
        fontSize:'0.8rem', transition:'background 0.12s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; }}
    >
      <FileIcon name={node.name} />
      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {node.name}
      </span>

      {/* Set-as-preview button (HTML files only) */}
      {isHtml && (
        <button
          title="Set as live preview"
          onClick={e => { e.stopPropagation(); onSetPreview(path); }}
          style={{
            background: isPreview ? 'rgba(16,185,129,0.2)' : 'transparent',
            border:`1px solid ${isPreview ? 'rgba(16,185,129,0.5)' : 'transparent'}`,
            borderRadius:'3px', cursor:'pointer',
            color: isPreview ? '#6ee7b7' : 'rgba(255,255,255,0.25)',
            padding:'1px 3px', display:'flex', alignItems:'center', flexShrink:0,
          }}
          onMouseEnter={e => { if (!isPreview) e.currentTarget.style.color='#6ee7b7'; }}
          onMouseLeave={e => { if (!isPreview) e.currentTarget.style.color='rgba(255,255,255,0.25)'; }}
        >
          <Globe size={9} />
        </button>
      )}

      <button onClick={e=>{ e.stopPropagation(); onDelete(path); }}
        title="Delete file"
        style={btnStyle} onMouseEnter={hoverOn('#f87171')} onMouseLeave={hoverOff}>
        <Trash2 size={10}/>
      </button>
    </div>
  );
}

// Tiny shared styles for icon-buttons in the tree
const btnStyle = {
  background:'transparent', border:'none', cursor:'pointer',
  color:'rgba(255,255,255,0.2)', display:'flex', padding:'1px', flexShrink:0,
};
const hoverOn  = color => e => { e.currentTarget.style.color = color; };
const hoverOff = e => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; };

// ════════════════════════════════════════════════════════════════════════════
export default function EditorPage() {
  // ── Room & permission ─────────────────────────────────────────────────────
  const [roomId] = useState(() => {
    const u = new URLSearchParams(window.location.search);
    let r = u.get('room');
    if (!r) { r = Math.random().toString(36).substring(2,9).toUpperCase(); window.history.replaceState(null,'',`?room=${r}`); }
    return r;
  });
  const [canEdit, setCanEdit] = useState(() => {
    const rid = new URLSearchParams(window.location.search).get('room') ?? '';
    return sessionStorage.getItem(`can_edit_${rid}`) === 'true';
  });
  const [isAdmin,             setIsAdmin]             = useState(false);
  const [editRequestPending,  setEditRequestPending]  = useState(false);
  const [incomingRequests,    setIncomingRequests]    = useState([]);
  const [toasts,              setToasts]              = useState([]);

  const addToast = useCallback((msg, type='info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  // ── File tree state ───────────────────────────────────────────────────────
  const [fileTree,        setFileTree]        = useState(DEFAULT_TREE);
  const [activeFilePath,  setActiveFilePath]  = useState('index.html');
  const [previewFilePath, setPreviewFilePath] = useState('index.html');
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // New-item creation form state
  const [newItem, setNewItem] = useState({ visible:false, parent:'', type:'file', name:'' });
  const newItemRef = useRef(null);

  // ── Yjs / Socket refs ─────────────────────────────────────────────────────
  const yjsDocs  = useRef(new Map());   // path → Y.Doc
  const socketRef = useRef(null);

  // ── Layout ────────────────────────────────────────────────────────────────
  const [splitPct,  setSplitPct]  = useState(50);
  const isDragging  = useRef(false);
  const containerRef = useRef(null);
  const SIDEBAR_W = 210;

  // ── Header misc ───────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [srcDoc,  setSrcDoc]  = useState('');

  // ── Live preview: rebuild whenever tree or preview path changes ───────────
  useEffect(() => {
    const t = setTimeout(() => setSrcDoc(buildSrcDoc(fileTree, previewFilePath)), 300);
    return () => clearTimeout(t);
  }, [fileTree, previewFilePath]);

  // ── Socket.io + Yjs bootstrap ─────────────────────────────────────────────
  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');
    socketRef.current = socket;

    // Pre-init Yjs docs for all default files
    Object.keys(DEFAULT_TREE).forEach(p => {
      if (!yjsDocs.current.has(p)) yjsDocs.current.set(p, new Y.Doc());
    });

    socket.on('connect', () => socket.emit('join-room', roomId));

    socket.on('room-role', ({ isAdmin: f }) => {
      setIsAdmin(f);
      if (f) {
        setCanEdit(true);
        sessionStorage.setItem(`can_edit_${roomId}`, 'true');
      }
    });

    // Full-state sync on join
    socket.on('sync-step-1', (_sv, stateAsUpdate) => {
      yjsDocs.current.forEach(doc => {
        try { Y.applyUpdate(doc, new Uint8Array(stateAsUpdate)); } catch (_) {}
      });
    });

    // Incremental content update for a specific file
    socket.on('sync-update', ({ fileName, update }) => {
      const doc = yjsDocs.current.get(fileName);
      if (doc) {
        Y.applyUpdate(doc, new Uint8Array(update));
        const newValue = doc.getText('content').toString();
        setFileTree(prev => {
          if (!prev[fileName]) return prev;
          return { ...prev, [fileName]: { ...prev[fileName], value: newValue } };
        });
      }
    });

    // Tree structure change: another client added or deleted a file/folder
    socket.on('tree-change', ({ op, path, node, extraPaths }) => {
      if (op === 'add') {
        // Init Yjs docs for any new files
        if (node?.type === 'file' && !yjsDocs.current.has(path)) {
          yjsDocs.current.set(path, new Y.Doc());
        }
        if (extraPaths) {
          Object.entries(extraPaths).forEach(([p, n]) => {
            if (n.type === 'file' && !yjsDocs.current.has(p)) {
              yjsDocs.current.set(p, new Y.Doc());
            }
          });
        }
        setFileTree(prev => ({ ...prev, [path]: node, ...(extraPaths ?? {}) }));
        if (node?.type === 'folder') {
          setExpandedFolders(prev => new Set([...prev, path]));
        }
      } else if (op === 'delete') {
        setFileTree(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(k => {
            if (k === path || k.startsWith(path + '/')) delete next[k];
          });
          return next;
        });
      }
    });

    // Permission events
    socket.on('edit-request', req  => setIncomingRequests(p => [...p, req]));
    socket.on('edit-granted',  ()  => {
      setEditRequestPending(false); setCanEdit(true);
      sessionStorage.setItem(`can_edit_${roomId}`, 'true');
      addToast('✅ Edit access granted! You can now type.', 'success');
    });
    socket.on('edit-denied', () => {
      setEditRequestPending(false);
      addToast('❌ Request denied by admin.', 'error');
    });

    return () => {
      socket.disconnect();
      yjsDocs.current.forEach(doc => doc.destroy());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── Yjs update → broadcast whenever active file changes ──────────────────
  useEffect(() => {
    if (!yjsDocs.current.has(activeFilePath)) {
      yjsDocs.current.set(activeFilePath, new Y.Doc());
    }
    const doc = yjsDocs.current.get(activeFilePath);
    const onUpdate = update => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync-update', roomId, {
          fileName: activeFilePath,
          update: Array.from(update),
        });
      }
    };
    doc.on('update', onUpdate);
    return () => doc.off('update', onUpdate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilePath, roomId]);

  // ── Editor change → Yjs doc + local state ────────────────────────────────
  const handleEditorChange = useCallback(val => {
    const newVal = val ?? '';
    setFileTree(prev => ({
      ...prev,
      [activeFilePath]: { ...prev[activeFilePath], value: newVal },
    }));
    const doc = yjsDocs.current.get(activeFilePath);
    if (doc) {
      const yText = doc.getText('content');
      if (yText.toString() !== newVal) {
        doc.transact(() => { yText.delete(0, yText.length); yText.insert(0, newVal); });
      }
    }
  }, [activeFilePath]);

  // ── File tree operations ──────────────────────────────────────────────────
  const handleFileClick  = useCallback(path => setActiveFilePath(path), []);
  const handleSetPreview = useCallback(path => setPreviewFilePath(path), []);

  const toggleFolder = useCallback(path => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  const handleDeleteItem = useCallback(path => {
    // Fall back to first remaining file if the active one is deleted
    if (activeFilePath === path || activeFilePath.startsWith(path + '/')) {
      const remaining = Object.entries(fileTree).find(
        ([k, n]) => k !== path && !k.startsWith(path + '/') && n.type === 'file'
      );
      if (remaining) setActiveFilePath(remaining[0]);
    }
    if (previewFilePath === path || previewFilePath.startsWith(path + '/')) {
      const remaining = Object.entries(fileTree).find(
        ([k, n]) => k !== path && !k.startsWith(path + '/') && n.type === 'file' && k.endsWith('.html')
      );
      if (remaining) setPreviewFilePath(remaining[0]);
    }
    setFileTree(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k === path || k.startsWith(path + '/')) delete next[k];
      });
      return next;
    });
    socketRef.current?.emit('tree-change', roomId, { op:'delete', path });
  }, [activeFilePath, previewFilePath, fileTree, roomId]);

  // Open new-item form (called from sidebar header or folder row)
  const openNewItemForm = useCallback((type, parent = '') => {
    setNewItem({ visible:true, parent, type, name:'' });
    if (parent) setExpandedFolders(prev => new Set([...prev, parent]));
    setTimeout(() => newItemRef.current?.focus(), 60);
  }, []);

  const handleCreateItem = useCallback(() => {
    const { parent, type, name } = newItem;
    const trimmed = name.trim();
    if (!trimmed) { setNewItem({ visible:false, parent:'', type:'file', name:'' }); return; }
    const fullPath = parent ? `${parent}/${trimmed}` : trimmed;
    if (fileTree[fullPath]) return; // already exists

    if (type === 'folder') {
      const folderNode = { type:'folder', name: trimmed };
      const starters   = starterFiles(fullPath);
      setFileTree(prev => ({ ...prev, [fullPath]: folderNode, ...starters }));
      setExpandedFolders(prev => new Set([...prev, fullPath]));
      setActiveFilePath(`${fullPath}/index.html`);
      Object.keys(starters).forEach(p => {
        if (!yjsDocs.current.has(p)) yjsDocs.current.set(p, new Y.Doc());
      });
      socketRef.current?.emit('tree-change', roomId, { op:'add', path:fullPath, node:folderNode, extraPaths:starters });
    } else {
      const lang = inferLanguage(trimmed);
      const node = { type:'file', name:trimmed, language:lang, value:'' };
      setFileTree(prev => ({ ...prev, [fullPath]: node }));
      setActiveFilePath(fullPath);
      if (!yjsDocs.current.has(fullPath)) yjsDocs.current.set(fullPath, new Y.Doc());
      socketRef.current?.emit('tree-change', roomId, { op:'add', path:fullPath, node });
    }
    setNewItem({ visible:false, parent:'', type:'file', name:'' });
  }, [newItem, fileTree, roomId]);

  // ── Permission actions ────────────────────────────────────────────────────
  const requestEditAccess = useCallback(() => {
    if (!socketRef.current?.connected || editRequestPending) return;
    setEditRequestPending(true);
    socketRef.current.emit('request-edit', {
      roomId,
      requesterName: `Guest_${socketRef.current.id?.slice(0,4) ?? '???'}`,
    });
    addToast('📨 Edit request sent to admin…', 'info');
  }, [editRequestPending, roomId, addToast]);

  const respondToRequest = useCallback((req, approved) => {
    if (!socketRef.current?.connected) return;
    setIncomingRequests(p => p.filter(r => r.requesterSocketId !== req.requesterSocketId));
    if (approved) {
      socketRef.current.emit('grant-edit', { requesterSocketId: req.requesterSocketId, roomId });
      addToast(`✅ Granted edit access to ${req.requesterName}`, 'success');
    } else {
      socketRef.current.emit('deny-edit',  { requesterSocketId: req.requesterSocketId, roomId });
      addToast(`❌ Denied request from ${req.requesterName}`, 'error');
    }
  }, [roomId, addToast]);

  // ── Drag-to-resize ────────────────────────────────────────────────────────
  const onDragStart = useCallback(e => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMove = e => {
      if (!isDragging.current || !containerRef.current) return;
      const rect  = containerRef.current.getBoundingClientRect();
      const avail = rect.width - SIDEBAR_W - 10;
      const x     = e.clientX - rect.left - SIDEBAR_W - 5;
      setSplitPct(Math.min(80, Math.max(20, (x / avail) * 100)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // ── Misc ──────────────────────────────────────────────────────────────────
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const refreshPreview = () => {
    setSrcDoc('');
    setTimeout(() => setSrcDoc(buildSrcDoc(fileTree, previewFilePath)), 60);
  };

  const activeFileNode = fileTree[activeFilePath];
  const rootChildren   = getChildren(fileTree, '');

  // Breadcrumb for the active tab
  const pathParts = activeFilePath.split('/');
  const fileName  = pathParts.pop();
  const dirPart   = pathParts.join('/');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .tree-scroll::-webkit-scrollbar { width: 4px; }
        .tree-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* ── Header ── */}
      <header className="glass-header">
        <Link to="/" style={{ textDecoration:'none' }} className="logo-text">
          <Code2 size={22} color="#6366f1" />
          <span>CollabCode 3D</span>
        </Link>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          {isAdmin && (
            <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:'700', background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.4)', color:'#818cf8', display:'flex', alignItems:'center', gap:'5px' }}>
              👑 Admin
            </span>
          )}
          {!canEdit && !isAdmin && (
            <>
              <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:'700', background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.35)', color:'#fbbf24', display:'flex', alignItems:'center', gap:'5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                View Only
              </span>
              <button onClick={requestEditAccess} disabled={editRequestPending}
                style={{ padding:'6px 14px', cursor: editRequestPending ? 'default':'pointer', borderRadius:'6px', fontSize:'0.78rem', fontWeight:'700', display:'flex', alignItems:'center', gap:'6px', border: editRequestPending ? '1px solid rgba(168,85,247,0.3)':'1px solid rgba(168,85,247,0.6)', background: editRequestPending ? 'rgba(168,85,247,0.07)':'rgba(168,85,247,0.18)', color: editRequestPending ? 'rgba(168,85,247,0.6)':'#c084fc', transition:'all 0.2s' }}>
                {editRequestPending
                  ? <><span style={{ display:'inline-block', width:11, height:11, border:'2px solid #a855f7', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Waiting…</>
                  : '🔓 Request Edit Access'}
              </button>
            </>
          )}
          <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)' }}>
            Room:&nbsp;<strong style={{ color:'#fff' }}>{roomId}</strong>
          </span>
          <button onClick={copyLink} style={{ padding:'6px 14px', cursor:'pointer', borderRadius:'6px', border:`1px solid ${copied ? 'rgba(16,185,129,0.5)':'rgba(99,102,241,0.4)'}`, background: copied ? 'rgba(16,185,129,0.12)':'rgba(99,102,241,0.1)', color:'#fff', fontWeight:'600', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:'5px' }}>
            {copied ? <Check size={13} color="#10b981"/> : <Copy size={13}/>}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <Settings size={16} color="rgba(255,255,255,0.4)" style={{ cursor:'pointer' }}/>
        </div>
      </header>

      {/* ── Toast layer + admin popup ── */}
      <div style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:9999, display:'flex', flexDirection:'column', gap:'10px', alignItems:'flex-end', pointerEvents:'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding:'12px 20px', borderRadius:'12px', fontSize:'0.85rem', fontWeight:'600',
            backdropFilter:'blur(16px)', pointerEvents:'auto', animation:'slideInRight 0.35s ease',
            background: t.type==='success' ? 'rgba(16,185,129,0.18)' : t.type==='error' ? 'rgba(239,68,68,0.18)' : 'rgba(99,102,241,0.18)',
            border:     t.type==='success' ? '1px solid rgba(16,185,129,0.4)'  : t.type==='error' ? '1px solid rgba(239,68,68,0.4)'  : '1px solid rgba(99,102,241,0.4)',
            color:      t.type==='success' ? '#6ee7b7'                         : t.type==='error' ? '#fca5a5'                        : '#a5b4fc',
            boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
          }}>{t.msg}</div>
        ))}
        {incomingRequests.slice(0,1).map(req => (
          <div key={req.requesterSocketId} style={{ width:'300px', borderRadius:'16px', overflow:'hidden', backdropFilter:'blur(20px)', pointerEvents:'auto', background:'rgba(10,10,20,0.85)', border:'1px solid rgba(168,85,247,0.4)', boxShadow:'0 0 40px rgba(168,85,247,0.25),0 8px 32px rgba(0,0,0,0.6)', animation:'slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ padding:'14px 18px 10px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>👤</div>
              <div>
                <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.06em' }}>Edit Request</div>
                <div style={{ fontSize:'0.9rem', fontWeight:'700', color:'#fff' }}>{req.requesterName}</div>
              </div>
              {incomingRequests.length > 1 && (
                <span style={{ marginLeft:'auto', fontSize:'0.7rem', background:'rgba(168,85,247,0.25)', padding:'2px 8px', borderRadius:'20px', color:'#c084fc', fontWeight:'700' }}>
                  +{incomingRequests.length - 1} more
                </span>
              )}
            </div>
            <div style={{ padding:'12px 18px', fontSize:'0.82rem', color:'rgba(255,255,255,0.55)' }}>
              Wants to <strong style={{ color:'#fff' }}>edit</strong> this room. Grant access?
            </div>
            <div style={{ display:'flex', gap:'8px', padding:'0 18px 16px' }}>
              <button onClick={()=>respondToRequest(req,true)} style={{ flex:1, padding:'9px', borderRadius:'10px', border:'1px solid rgba(16,185,129,0.4)', background:'rgba(16,185,129,0.15)', color:'#6ee7b7', fontWeight:'700', fontSize:'0.82rem', cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(16,185,129,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(16,185,129,0.15)'}>✅ Approve</button>
              <button onClick={()=>respondToRequest(req,false)} style={{ flex:1, padding:'9px', borderRadius:'10px', border:'1px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.12)', color:'#fca5a5', fontWeight:'700', fontSize:'0.82rem', cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.25)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.12)'}>❌ Deny</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main layout ── */}
      <main ref={containerRef} style={{ display:'flex', flex:1, padding:'8px', gap:'0', overflow:'hidden' }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width:`${SIDEBAR_W}px`, flexShrink:0, marginRight:'8px', background:'rgba(0,0,0,0.12)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Sidebar header */}
          <div style={{ padding:'8px 10px', fontSize:'0.61rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <ChevronDown size={11}/> Explorer
            </span>
            <div style={{ display:'flex', gap:'3px' }}>
              <button title="New File" onClick={() => openNewItemForm('file', '')}
                style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', display:'flex', padding:'2px 3px', borderRadius:'3px' }}
                onMouseEnter={e=>{ e.currentTarget.style.color='#c084fc'; e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.4)'; e.currentTarget.style.background='transparent'; }}>
                <FilePlus size={13}/>
              </button>
              <button title="New Folder" onClick={() => openNewItemForm('folder', '')}
                style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', display:'flex', padding:'2px 3px', borderRadius:'3px' }}
                onMouseEnter={e=>{ e.currentTarget.style.color='#fbbf24'; e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.4)'; e.currentTarget.style.background='transparent'; }}>
                <FolderPlus size={13}/>
              </button>
            </div>
          </div>

          {/* New-item input form */}
          {newItem.visible && (
            <div style={{ padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:'5px', flexShrink:0, background:'rgba(99,102,241,0.06)' }}>
              {newItem.type === 'folder'
                ? <Folder   size={12} color="#fbbf24"/>
                : <FileText size={12} color="#888"/>}
              <input
                ref={newItemRef}
                value={newItem.name}
                onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleCreateItem();
                  if (e.key === 'Escape') setNewItem({ visible:false, parent:'', type:'file', name:'' });
                }}
                placeholder={newItem.type === 'folder' ? 'folder-name' : 'filename.html'}
                style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(99,102,241,0.5)', borderRadius:'4px', color:'#fff', padding:'3px 7px', fontSize:'0.78rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box', minWidth:0 }}
              />
              {newItem.parent && (
                <span style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.3)', flexShrink:0 }}>in {newItem.parent}</span>
              )}
            </div>
          )}

          {/* File tree */}
          <div className="tree-scroll" style={{ flex:1, overflowY:'auto' }}>
            {rootChildren.map(([path, node]) => (
              <TreeNode
                key={path}
                path={path} node={node} tree={fileTree} level={0}
                activeFilePath={activeFilePath} previewFilePath={previewFilePath}
                onFileClick={handleFileClick}   onSetPreview={handleSetPreview}
                onDelete={handleDeleteItem}
                expandedFolders={expandedFolders} toggleFolder={toggleFolder}
                onAddFile={p  => openNewItemForm('file',   p)}
                onAddFolder={p => openNewItemForm('folder', p)}
              />
            ))}
          </div>
        </div>

        {/* ── EDITOR ── */}
        <div style={{ flex:`0 0 calc((100% - ${SIDEBAR_W + 16}px) * ${splitPct/100})`, display:'flex', flexDirection:'column', borderRadius:'12px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.1)', backdropFilter:'blur(10px)', minWidth:0 }}>

          {/* Active file tab (breadcrumb) */}
          <div style={{ display:'flex', background:'rgba(0,0,0,0.05)', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
            <div style={{ padding:'9px 18px', background:'rgba(255,255,255,0.05)', borderBottom:'1.5px solid #6366f1', color:'#fff', fontSize:'0.78rem', fontWeight:'600', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap', overflow:'hidden', maxWidth:'100%' }}>
              {activeFileNode && <FileIcon name={activeFileNode.name}/>}
              {dirPart && (
                <span style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.7rem' }}>{dirPart} /&nbsp;</span>
              )}
              <span>{fileName}</span>
            </div>
          </div>

          <div style={{ flex:1, minHeight:0 }}>
            <MonacoEditor
              path={activeFilePath}
              height="100%"
              language={activeFileNode?.language ?? 'plaintext'}
              value={activeFileNode?.value ?? ''}
              onChange={handleEditorChange}
              onMount={(_, monaco) => defineTheme(monaco)}
              theme="collab-dark"
              options={{
                minimap:                    { enabled: false },
                fontSize:                   14,
                fontFamily:                 "'JetBrains Mono', Consolas, monospace",
                fontLigatures:              true,
                wordWrap:                   'on',
                padding:                    { top: 14 },
                scrollbar:                  { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
                overviewRulerBorder:        false,
                renderLineHighlight:        'all',
                readOnly:                   !canEdit,
                domReadOnly:                !canEdit,
                cursorBlinking:             'smooth',
                cursorSmoothCaretAnimation: 'on',
                quickSuggestions:           canEdit ? { other:true, comments:true, strings:true } : false,
                suggestOnTriggerCharacters: canEdit,
                wordBasedSuggestions:       'currentDocument',
                snippetSuggestions:         'inline',
                parameterHints:             { enabled: canEdit },
                autoClosingBrackets:        'always',
                autoClosingQuotes:          'always',
                autoSurround:               'languageDefined',
                formatOnType:               canEdit,
                formatOnPaste:              canEdit,
                autoClosingTags:            true,
                linkedEditing:              canEdit,
                automaticLayout:            true,
              }}
            />
          </div>
        </div>

        {/* ── DRAG HANDLE ── */}
        <div onMouseDown={onDragStart} style={{ width:'8px', flexShrink:0, cursor:'col-resize', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
          <div style={{ width:'3px', height:'48px', borderRadius:'3px', background:'rgba(255,255,255,0.1)', transition:'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.8)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
          />
        </div>

        {/* ── LIVE PREVIEW ── */}
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', borderRadius:'12px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.1)', backdropFilter:'blur(10px)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 14px', background:'rgba(0,0,0,0.05)', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
              <span style={{ width:9, height:9, borderRadius:'50%', background:'#ff5f57', display:'inline-block' }}/>
              <span style={{ width:9, height:9, borderRadius:'50%', background:'#febc2e', display:'inline-block' }}/>
              <span style={{ width:9, height:9, borderRadius:'50%', background:'#28c840', display:'inline-block' }}/>
              <div style={{ marginLeft:'10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'5px', padding:'3px 12px', fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:'5px', maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                <Globe size={10}/> {previewFilePath}
              </div>
            </div>
            <button onClick={refreshPreview} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'0.72rem', padding:'3px 6px', borderRadius:'4px' }}
              onMouseEnter={e=>e.currentTarget.style.color='#fff'}
              onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.35)'}>
              <RefreshCw size={12}/> Refresh
            </button>
          </div>
          <iframe
            srcDoc={srcDoc}
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin"
            style={{ flex:1, border:'none', background:'#fff', width:'100%' }}
          />
        </div>
      </main>
    </div>
  );
}
