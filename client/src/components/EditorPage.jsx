import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { emmetHTML, emmetCSS, emmetJSX } from 'emmet-monaco-es';
import {
  Code2, Globe, RefreshCw, Copy, Check,
  FileCode, FileText, Braces, FileCog, Trash2,
  ChevronDown, ChevronRight, FolderOpen, Folder,
  FilePlus, FolderPlus, Play, Terminal as TerminalIcon,
  Layout, Clock, Cpu, Zap, MoreHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import '../index.css';

// ══════════════════════════════════════════════════════════════════════════════
// ── Language definitions (UNCHANGED) ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export const LANGUAGES = [
  { key:'javascript', label:'JavaScript', ext:'js',    monacoLang:'javascript', color:'#f7df1e', bg:'rgba(247,223,30,0.12)',    icon:'𝙅𝙎', starter:`// JavaScript — Node.js\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nlet lines = [];\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n  console.log('Hello, World! 👋');\n});` },
  { key:'typescript', label:'TypeScript', ext:'ts',    monacoLang:'typescript', color:'#3178c6', bg:'rgba(49,120,198,0.15)',    icon:'𝙏𝙎', starter:`// TypeScript\nfunction greet(name: string): string {\n  return \`Hello, \${name}! 👋\`;\n}\nconsole.log(greet('World'));` },
  { key:'python',     label:'Python',     ext:'py',    monacoLang:'python',     color:'#3572A5', bg:'rgba(53,114,165,0.15)',    icon:'🐍', starter:`# Python 3\ndef solve():\n    name = input("Enter name: ")\n    print(f"Hello, {name}! 👋")\nsolve()` },
  { key:'ruby',       label:'Ruby',       ext:'rb',    monacoLang:'ruby',       color:'#cc342d', bg:'rgba(204,52,45,0.12)',     icon:'💎', starter:`# Ruby\nputs "Hello, World! 👋"\nname = gets&.chomp || "World"\nputs "Welcome, #{name}!"` },
  { key:'php',        label:'PHP',        ext:'php',   monacoLang:'php',        color:'#777bb4', bg:'rgba(119,123,180,0.15)',   icon:'🐘', starter:`<?php\n$name = "World";\necho "Hello, $name! 👋\\n";` },
  { key:'perl',       label:'Perl',       ext:'pl',    monacoLang:'perl',       color:'#0298c3', bg:'rgba(2,152,195,0.12)',     icon:'🔮', starter:`#!/usr/bin/perl\nuse strict;\nmy $name = "World";\nprint "Hello, $name! 👋\\n";` },
  { key:'c',          label:'C',          ext:'c',     monacoLang:'c',          color:'#555555', bg:'rgba(85,85,85,0.15)',      icon:'©',  starter:`#include <stdio.h>\nint main() {\n    printf("Hello, World! 👋\\n");\n    return 0;\n}` },
  { key:'cpp',        label:'C++',        ext:'cpp',   monacoLang:'cpp',        color:'#00599c', bg:'rgba(0,89,156,0.15)',      icon:'⊕',  starter:`#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    cout << "Hello, World! 👋" << endl;\n    return 0;\n}` },
  { key:'java',       label:'Java',       ext:'java',  monacoLang:'java',       color:'#b07219', bg:'rgba(176,114,25,0.15)',    icon:'☕', starter:`import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World! 👋");\n    }\n}` },
  { key:'go',         label:'Go',         ext:'go',    monacoLang:'go',         color:'#00ADD8', bg:'rgba(0,173,216,0.12)',     icon:'🐹', starter:`package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World! 👋")\n}` },
  { key:'rust',       label:'Rust',       ext:'rs',    monacoLang:'rust',       color:'#dea584', bg:'rgba(222,165,132,0.12)',   icon:'🦀', starter:`fn main() {\n    println!("Hello, World! 👋");\n}` },
  { key:'kotlin',     label:'Kotlin',     ext:'kt',    monacoLang:'kotlin',     color:'#A97BFF', bg:'rgba(169,123,255,0.12)',   icon:'🎯', starter:`fun main() {\n    println("Hello, World! 👋")\n}` },
  { key:'swift',      label:'Swift',      ext:'swift', monacoLang:'swift',      color:'#F05138', bg:'rgba(240,81,56,0.12)',     icon:'🐦', starter:`import Foundation\nprint("Hello, World! 👋")` },
  { key:'csharp',     label:'C#',         ext:'cs',    monacoLang:'csharp',     color:'#239120', bg:'rgba(35,145,32,0.12)',     icon:'♯',  starter:`using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World! 👋");\n    }\n}` },
  { key:'scala',      label:'Scala',      ext:'scala', monacoLang:'scala',      color:'#DC322F', bg:'rgba(220,50,47,0.12)',     icon:'⚖️', starter:`object Main extends App {\n  println("Hello, World! 👋")\n}` },
  { key:'haskell',    label:'Haskell',    ext:'hs',    monacoLang:'haskell',    color:'#5e5086', bg:'rgba(94,80,134,0.15)',     icon:'λ',  starter:`main :: IO ()\nmain = putStrLn "Hello, World! 👋"` },
  { key:'r',          label:'R',          ext:'r',     monacoLang:'r',          color:'#276dc3', bg:'rgba(39,109,195,0.12)',    icon:'📊', starter:`cat("Hello, World! 👋\\n")` },
  { key:'bash',       label:'Bash',       ext:'sh',    monacoLang:'shell',      color:'#89e051', bg:'rgba(137,224,81,0.10)',    icon:'$_', starter:`#!/bin/bash\necho "Hello, World! 👋"` },
  { key:'sql',        label:'SQL',        ext:'sql',   monacoLang:'sql',        color:'#e38c00', bg:'rgba(227,140,0,0.12)',     icon:'🗄️', starter:`-- SQL (SQLite)\nCREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);\nINSERT INTO users VALUES (1, 'Alice');\nSELECT * FROM users;` },
];
const LANG_BY_KEY = Object.fromEntries(LANGUAGES.map(l => [l.key, l]));

// ── Web mode starters (UNCHANGED) ─────────────────────────────────────────────
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
  border-radius: 20px; border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
}
h1 { font-size: 2.5rem; margin-bottom: 16px; background: linear-gradient(90deg,#6366f1,#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
p { opacity:0.7; margin-bottom:24px; font-size:1.1rem; }
button { padding:12px 28px; background:linear-gradient(135deg,#6366f1,#ec4899); border:none; border-radius:50px; color:white; font-size:1rem; font-weight:600; cursor:pointer; }
#output { margin-top:20px; font-size:1.2rem; color:#4ade80; }`;

const STARTER_JS = `function greet() {
  const msgs = ["Hello from JavaScript! 🚀","CollabCode is awesome! ✨","Build together, ship faster! 💻"];
  document.getElementById('output').textContent = msgs[Math.floor(Math.random()*msgs.length)];
}`;

const DEFAULT_TREE = {
  'index.html': { type:'file', name:'index.html', language:'html',       value: STARTER_HTML('CollabCode 3D') },
  'style.css':  { type:'file', name:'style.css',  language:'css',        value: STARTER_CSS },
  'script.js':  { type:'file', name:'script.js',  language:'javascript', value: STARTER_JS },
};

// ── Pure helpers (UNCHANGED) ──────────────────────────────────────────────────
function inferLanguage(name) {
  const ext = name.split('.').pop();
  return { html:'html',css:'css',js:'javascript',ts:'typescript',json:'json',
           py:'python',rb:'ruby',php:'php',pl:'perl',c:'c',cpp:'cpp',
           java:'java',go:'go',rs:'rust',kt:'kotlin',swift:'swift',
           cs:'csharp',scala:'scala',hs:'haskell',r:'r',sh:'shell',sql:'sql' }[ext] ?? 'plaintext';
}

function resolvePath(folderPath, href) {
  href = href.replace(/^\.\//, '');
  if (href.startsWith('../')) {
    const parts = folderPath.split('/').filter(Boolean); parts.pop(); href = href.slice(3);
    return parts.length ? `${parts.join('/')}/${href}` : href;
  }
  return folderPath ? `${folderPath}/${href}` : href;
}

function buildSrcDoc(tree, previewPath) {
  const htmlNode = tree[previewPath];
  if (!htmlNode || htmlNode.type !== 'file') return '';
  const folderPath = previewPath.includes('/') ? previewPath.split('/').slice(0,-1).join('/') : '';
  let html = htmlNode.value ?? '';
  html = html.replace(/<link([^>]*)href=["']([^"']+\.css)["']([^>]*)>/gi,
    (_m,a,href,b) => { const n=tree[resolvePath(folderPath,href)]; return n?`<style>${n.value}</style>`:`<link${a}href="${href}"${b}>`; });
  html = html.replace(/<script([^>]*)src=["']([^"']+\.js)["']([^>]*)><\/script>/gi,
    (_m,a,src,b) => { const n=tree[resolvePath(folderPath,src)]; return n?`<script${a}${b}>\n${n.value}\n</script>`:`<script${a}src="${src}"${b}></script>`; });
  return html;
}

function getChildren(tree, prefix) {
  return Object.entries(tree)
    .filter(([path]) => {
      if (prefix==='') return !path.includes('/');
      const rest = path.slice(prefix.length+1);
      return path.startsWith(prefix+'/') && !rest.includes('/');
    })
    .sort(([,a],[,b]) => {
      if (a.type==='folder'&&b.type!=='folder') return -1;
      if (b.type==='folder'&&a.type!=='folder') return  1;
      return 0;
    });
}

function starterFiles(folderPath) {
  const name = folderPath.split('/').pop();
  return {
    [`${folderPath}/index.html`]:{ type:'file',name:'index.html',language:'html',      value:STARTER_HTML(name) },
    [`${folderPath}/style.css`]: { type:'file',name:'style.css', language:'css',       value:STARTER_CSS },
    [`${folderPath}/script.js`]: { type:'file',name:'script.js', language:'javascript',value:STARTER_JS },
  };
}

// ── Monaco theme (UNCHANGED) ──────────────────────────────────────────────────
let emmetInitialized = false;
function defineTheme(monaco) {
  monaco.editor.defineTheme('collab-dark', {
    base:'vs-dark', inherit:true, rules:[],
    colors:{
      'editor.background':              '#06060f',
      'editor.lineHighlightBackground': '#ffffff06',
      'editorLineNumber.foreground':    '#ffffff1a',
      'editorGutter.background':        '#06060f',
    },
  });
  monaco.editor.setTheme('collab-dark');
  if (!emmetInitialized) {
    emmetHTML(monaco,['html','php','vue']);
    emmetCSS(monaco,['css','scss','less']);
    emmetJSX(monaco,['javascript','typescript','jsx','tsx']);
    emmetInitialized = true;
  }
  const jsD = monaco.languages.typescript.javascriptDefaults;
  jsD.setCompilerOptions({ target:monaco.languages.typescript.ScriptTarget.ESNext, allowNonTsExtensions:true, moduleResolution:monaco.languages.typescript.ModuleResolutionKind.NodeJs, module:monaco.languages.typescript.ModuleKind.CommonJS, noEmit:true, esModuleInterop:true, jsx:monaco.languages.typescript.JsxEmit.React, allowJs:true, typeRoots:['node_modules/@types'] });
  jsD.setDiagnosticsOptions({ noSemanticValidation:false, noSyntaxValidation:false });
  jsD.setEagerModelSync(true);
  monaco.languages.html.htmlDefaults.setOptions({ format:{tabSize:2,insertSpaces:true}, suggest:{html5:true} });
  monaco.languages.css.cssDefaults.setOptions({ validate:true });
}

// ══════════════════════════════════════════════════════════════════════════════
// ── File icon (redesigned) ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function FileIcon({ name, size=13 }) {
  const ext = name.split('.').pop();
  if (ext==='html') return <FileCode  size={size} color="#e44d26" />;
  if (ext==='css')  return <FileCog   size={size} color="#5b8af5" />;
  if (ext==='js')   return <Braces    size={size} color="#f7df1e" />;
  return <FileText size={size} color="rgba(255,255,255,0.3)" />;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── TreeNode (redesigned visuals, identical props/logic) ──────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function TreeNode({ path,node,tree,level=0, activeFilePath,previewFilePath, onFileClick,onSetPreview,onDelete, expandedFolders,toggleFolder, onAddFile,onAddFolder }) {
  const [hovered, setHovered] = useState(false);
  const indent = level * 13;

  if (node.type === 'folder') {
    const isOpen = expandedFolders.has(path);
    const children = getChildren(tree, path);
    return (
      <>
        <div
          onClick={() => toggleFolder(path)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display:'flex', alignItems:'center', gap:5,
            padding:`5px 10px 5px ${8+indent}px`,
            cursor:'pointer', color: hovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)',
            fontSize:'0.78rem', userSelect:'none', borderRadius:6,
            background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
            transition:'all 0.15s',
          }}
        >
          {isOpen
            ? <ChevronDown  size={10} color="rgba(255,255,255,0.25)" />
            : <ChevronRight size={10} color="rgba(255,255,255,0.25)" />}
          {isOpen
            ? <FolderOpen size={12} color="#fbbf24" />
            : <Folder     size={12} color="#fbbf24" />}
          <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.77rem' }}>
            {node.name}
          </span>
          {hovered && (
            <div style={{ display:'flex', gap:2 }}>
              <button onClick={e=>{e.stopPropagation();onAddFile(path);}} title="New file"
                style={treeBtn} onMouseEnter={e=>e.currentTarget.style.color='#a78bfa'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.2)'}>
                <FilePlus size={10}/>
              </button>
              <button onClick={e=>{e.stopPropagation();onDelete(path);}} title="Delete"
                style={treeBtn} onMouseEnter={e=>e.currentTarget.style.color='#f87171'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.2)'}>
                <Trash2 size={10}/>
              </button>
            </div>
          )}
        </div>
        {isOpen && children.map(([cp,cn]) => (
          <TreeNode key={cp} path={cp} node={cn} tree={tree} level={level+1}
            activeFilePath={activeFilePath} previewFilePath={previewFilePath}
            onFileClick={onFileClick} onSetPreview={onSetPreview} onDelete={onDelete}
            expandedFolders={expandedFolders} toggleFolder={toggleFolder}
            onAddFile={onAddFile} onAddFolder={onAddFolder} />
        ))}
      </>
    );
  }

  const isActive  = activeFilePath  === path;
  const isPreview = previewFilePath === path;
  const isHtml    = node.name.endsWith('.html');

  return (
    <div
      onClick={() => onFileClick(path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', alignItems:'center', gap:6,
        padding:`5px 10px 5px ${8+indent}px`,
        cursor:'pointer', borderRadius:6,
        background:  isActive ? 'rgba(99,102,241,0.15)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: `2px solid ${isActive ? '#6366f1' : 'transparent'}`,
        color:       isActive ? '#fff' : hovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
        fontSize:'0.77rem', transition:'all 0.12s',
      }}
    >
      <FileIcon name={node.name} />
      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {node.name}
      </span>
      {isHtml && (
        <button title="Set as live preview"
          onClick={e=>{e.stopPropagation();onSetPreview(path);}}
          style={{
            background: isPreview?'rgba(16,185,129,0.15)':'transparent',
            border:`1px solid ${isPreview?'rgba(16,185,129,0.4)':'transparent'}`,
            borderRadius:4, cursor:'pointer',
            color: isPreview?'#6ee7b7':'rgba(255,255,255,0.2)',
            padding:'1px 4px', display:'flex', alignItems:'center', transition:'all 0.15s',
          }}
          onMouseEnter={e=>{if(!isPreview)e.currentTarget.style.color='#6ee7b7';}}
          onMouseLeave={e=>{if(!isPreview)e.currentTarget.style.color='rgba(255,255,255,0.2)';}}>
          <Globe size={9}/>
        </button>
      )}
      {hovered && (
        <button onClick={e=>{e.stopPropagation();onDelete(path);}} title="Delete file"
          style={treeBtn} onMouseEnter={e=>e.currentTarget.style.color='#f87171'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.2)'}>
          <Trash2 size={10}/>
        </button>
      )}
    </div>
  );
}
const treeBtn = { background:'transparent',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.2)',display:'flex',padding:'1px',flexShrink:0,transition:'color 0.15s' };

// ══════════════════════════════════════════════════════════════════════════════
// ── Language Selector (redesigned) ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function LanguageSelector({ currentLang, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const lang = LANG_BY_KEY[currentLang] ?? LANGUAGES[0];

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const groups = [
    { label:'Web & Scripting', keys:['javascript','typescript','python','ruby','php','perl'] },
    { label:'Systems',         keys:['c','cpp','java','go','rust','kotlin','swift','csharp','scala'] },
    { label:'Other',           keys:['haskell','r','bash','sql'] },
  ];

  return (
    <div ref={ref} style={{ position:'relative', userSelect:'none' }}>
      <button
        onClick={() => !disabled && setOpen(o=>!o)}
        disabled={disabled}
        style={{
          display:'flex', alignItems:'center', gap:7,
          padding:'5px 10px 5px 8px', borderRadius:8, cursor:disabled?'default':'pointer',
          background: open ? 'rgba(255,255,255,0.08)' : lang.bg,
          border:`1px solid ${lang.color}33`,
          color:'#fff', fontSize:'0.78rem', fontWeight:600,
          transition:'all 0.2s', minWidth:130, whiteSpace:'nowrap',
          boxShadow: open ? `0 0 16px ${lang.color}22` : 'none',
        }}
      >
        <span style={{ fontSize:'0.88rem', lineHeight:1 }}>{lang.icon}</span>
        <span style={{ flex:1 }}>{lang.label}</span>
        <ChevronDown size={12} style={{ opacity:0.5, transform:open?'rotate(180deg)':'none', transition:'transform 0.2s' }}/>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:-6, scale:0.97 }}
            animate={{ opacity:1, y:0,  scale:1    }}
            exit={{    opacity:0, y:-6, scale:0.97 }}
            transition={{ duration:0.15 }}
            className="lang-dropdown"
            style={{
              position:'absolute', top:'110%', left:0, zIndex:9999,
              background:'rgba(8,8,24,0.97)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12, padding:'6px',
              minWidth:210, maxHeight:400, overflowY:'auto',
              boxShadow:'0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
              backdropFilter:'blur(20px)',
            }}
          >
            {groups.map(group => (
              <div key={group.label}>
                <div style={{ fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.1em', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', padding:'6px 8px 3px', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:3 }}>
                  {group.label}
                </div>
                {group.keys.map(key => {
                  const l = LANG_BY_KEY[key];
                  const isActive = key === currentLang;
                  return (
                    <div key={key} onClick={() => { onChange(key); setOpen(false); }}
                      style={{
                        display:'flex', alignItems:'center', gap:8,
                        padding:'6px 8px', borderRadius:7, cursor:'pointer',
                        background: isActive ? `${l.color}18` : 'transparent',
                        border:`1px solid ${isActive ? `${l.color}33` : 'transparent'}`,
                        marginBottom:2, transition:'background 0.12s',
                      }}
                      onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background='transparent'; }}
                    >
                      <span style={{ fontSize:'0.82rem', width:20, textAlign:'center', flexShrink:0 }}>{l.icon}</span>
                      <span style={{ fontSize:'0.78rem', color: isActive ? l.color : 'rgba(255,255,255,0.7)', fontWeight: isActive?700:400, flex:1 }}>{l.label}</span>
                      <span style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.2)', fontFamily:'monospace' }}>.{l.ext}</span>
                    </div>
                  );
                })}
                <div style={{ height:4 }}/>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Output Panel (redesigned) ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function OutputPanel({ output, isRunning, onRun, stdin, onStdinChange, cpuTime, memory, canEdit }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [output]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#06060f', fontFamily:"'JetBrains Mono',monospace", overflow:'hidden' }}>
      {/* ── Top bar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.4)', fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'Inter,sans-serif' }}>
          <TerminalIcon size={12} color="#4ade80" />
          Output
        </div>
        <div style={{ flex:1 }}/>
        {cpuTime && (
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.65rem', color:'rgba(255,255,255,0.25)', fontFamily:'Inter,sans-serif' }}>
            <Clock size={10}/> {cpuTime}s
          </div>
        )}
        {memory && (
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.65rem', color:'rgba(255,255,255,0.25)', fontFamily:'Inter,sans-serif' }}>
            <Cpu size={10}/> {memory}KB
          </div>
        )}
        {canEdit && (
          <motion.button
            whileHover={{ scale:1.04 }}
            whileTap={{ scale:0.97 }}
            onClick={onRun}
            disabled={isRunning}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'5px 14px', borderRadius:7, border:'none',
              cursor: isRunning?'not-allowed':'pointer',
              background: isRunning ? 'rgba(74,222,128,0.07)' : 'linear-gradient(135deg,#22c55e,#059669)',
              color: isRunning?'#4ade80':'#fff',
              fontWeight:700, fontSize:'0.75rem', fontFamily:'Inter,sans-serif',
              boxShadow: isRunning?'none':'0 0 16px rgba(34,197,94,0.3)',
              transition:'box-shadow 0.2s',
            }}
          >
            {isRunning
              ? <span style={{ display:'inline-block', animation:'spin 0.8s linear infinite' }}>↻</span>
              : <Play size={11} fill="currentColor"/>}
            {isRunning ? 'Running…' : 'Run Code'}
          </motion.button>
        )}
      </div>

      {/* ── stdin ── */}
      {canEdit && (
        <div style={{ display:'flex', gap:10, padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', flexShrink:0, background:'rgba(255,255,255,0.01)' }}>
          <span style={{ fontSize:'0.62rem', fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.1em', paddingTop:5, whiteSpace:'nowrap', fontFamily:'Inter,sans-serif' }}>stdin</span>
          <textarea
            value={stdin}
            onChange={e => onStdinChange(e.target.value)}
            placeholder="Provide input (one value per line)…"
            rows={2}
            style={{ flex:1, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, color:'#4ade80', fontFamily:"'JetBrains Mono',monospace", fontSize:12, padding:'5px 8px', outline:'none', resize:'none', lineHeight:1.5, caretColor:'#4ade80' }}
          />
        </div>
      )}

      {/* ── Output area ── */}
      <div className="output-scroll" style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
        {!output && !isRunning && (
          <div style={{ color:'rgba(255,255,255,0.18)', fontSize:'0.78rem', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
            <Zap size={13} color="rgba(255,255,255,0.15)"/>
            Click <strong style={{ color:'#4ade80', margin:'0 4px' }}>Run Code</strong> to execute your program
          </div>
        )}
        {isRunning && (
          <div style={{ display:'flex', alignItems:'center', gap:8, color:'#60a5fa', fontSize:'0.78rem', fontFamily:'Inter,sans-serif' }}>
            <span style={{ display:'inline-block', animation:'spin 0.8s linear infinite' }}>↻</span>
            Executing on JDoodle sandbox…
          </div>
        )}
        {output && !isRunning && (
          <pre style={{ color:'#d4d4d4', whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0, lineHeight:1.65, fontSize:'12.5px' }}>
            {output}
          </pre>
        )}
        <div ref={endRef}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Toast notification (redesigned) ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function Toast({ t }) {
  const colors = {
    success: { bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.3)', text:'#6ee7b7' },
    error:   { bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.3)',  text:'#fca5a5' },
    info:    { bg:'rgba(99,102,241,0.12)', border:'rgba(99,102,241,0.3)', text:'#a5b4fc' },
  };
  const c = colors[t.type] || colors.info;
  return (
    <motion.div
      initial={{ x:80, opacity:0 }}
      animate={{ x:0,  opacity:1 }}
      exit={{    x:80, opacity:0 }}
      transition={{ type:'spring', stiffness:400, damping:30 }}
      style={{
        padding:'11px 18px', borderRadius:12, fontSize:'0.82rem', fontWeight:600,
        backdropFilter:'blur(20px)', background:c.bg, border:`1px solid ${c.border}`,
        color:c.text, boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
        fontFamily:'Inter,sans-serif',
      }}
    >
      {t.msg}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Edit-request popup (redesigned) ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function EditRequestPopup({ req, onApprove, onDeny, extraCount }) {
  return (
    <motion.div
      initial={{ x:80, opacity:0, scale:0.95 }}
      animate={{ x:0,  opacity:1, scale:1    }}
      exit={{    x:80, opacity:0, scale:0.95 }}
      transition={{ type:'spring', stiffness:350, damping:28 }}
      style={{
        width:300, borderRadius:16, overflow:'hidden',
        background:'rgba(7,7,22,0.95)', backdropFilter:'blur(24px)',
        border:'1px solid rgba(168,85,247,0.35)',
        boxShadow:'0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(168,85,247,0.15)',
      }}
    >
      <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',flexShrink:0,boxShadow:'0 0 16px rgba(168,85,247,0.4)' }}>
          👤
        </div>
        <div>
          <div style={{ fontSize:'0.62rem',color:'rgba(255,255,255,0.35)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',fontFamily:'Inter,sans-serif' }}>Edit Request</div>
          <div style={{ fontSize:'0.88rem',fontWeight:700,color:'#fff',fontFamily:'Inter,sans-serif' }}>{req.requesterName}</div>
        </div>
        {extraCount > 0 && (
          <span style={{ marginLeft:'auto',fontSize:'0.65rem',background:'rgba(168,85,247,0.2)',padding:'2px 7px',borderRadius:99,color:'#c084fc',fontWeight:700,fontFamily:'Inter,sans-serif' }}>
            +{extraCount}
          </span>
        )}
      </div>
      <div style={{ padding:'10px 16px', fontSize:'0.78rem',color:'rgba(255,255,255,0.5)',fontFamily:'Inter,sans-serif' }}>
        Wants to <strong style={{ color:'#fff' }}>edit</strong> this room. Grant access?
      </div>
      <div style={{ display:'flex',gap:8,padding:'0 16px 14px' }}>
        <button onClick={onApprove} style={{ flex:1,padding:'8px',borderRadius:9,border:'1px solid rgba(16,185,129,0.35)',background:'rgba(16,185,129,0.12)',color:'#6ee7b7',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'background 0.15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(16,185,129,0.25)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(16,185,129,0.12)'}>
          ✅ Approve
        </button>
        <button onClick={onDeny} style={{ flex:1,padding:'8px',borderRadius:9,border:'1px solid rgba(239,68,68,0.35)',background:'rgba(239,68,68,0.1)',color:'#fca5a5',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'background 0.15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.22)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}>
          ❌ Deny
        </button>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main EditorPage ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function EditorPage() {
  // ── Room & permission (UNCHANGED) ─────────────────────────────────────────
  const [roomId] = useState(() => {
    const u = new URLSearchParams(window.location.search);
    let r = u.get('room');
    if (!r) { r = Math.random().toString(36).substring(2,9).toUpperCase(); window.history.replaceState(null,'',`?room=${r}`); }
    return r;
  });
  const [canEdit,            setCanEdit]            = useState(() => { const rid=new URLSearchParams(window.location.search).get('room')??''; return sessionStorage.getItem(`can_edit_${rid}`) === 'true'; });
  const [isAdmin,            setIsAdmin]            = useState(false);
  const [editRequestPending, setEditRequestPending] = useState(false);
  const [incomingRequests,   setIncomingRequests]   = useState([]);
  const [toasts,             setToasts]             = useState([]);

  const addToast = useCallback((msg, type='info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  // ── Editor mode (UNCHANGED) ───────────────────────────────────────────────
  const [editorMode,   setEditorMode]   = useState('web');
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [codeContent,  setCodeContent]  = useState(() => LANG_BY_KEY['javascript'].starter);
  const [stdinValue,   setStdinValue]   = useState('');
  const [codeOutput,   setCodeOutput]   = useState(null);
  const [isRunning,    setIsRunning]    = useState(false);
  const [runMeta,      setRunMeta]      = useState({ cpuTime:null, memory:null });

  const codeModeKey = useCallback(lang => `__code__/main.${LANG_BY_KEY[lang]?.ext ?? 'txt'}`, []);

  // ── File tree state (UNCHANGED) ───────────────────────────────────────────
  const [fileTree,        setFileTree]        = useState(DEFAULT_TREE);
  const [activeFilePath,  setActiveFilePath]  = useState('index.html');
  const [previewFilePath, setPreviewFilePath] = useState('index.html');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [newItem,         setNewItem]         = useState({ visible:false, parent:'', type:'file', name:'' });
  const newItemRef = useRef(null);

  // ── Yjs / Socket refs (UNCHANGED) ────────────────────────────────────────
  const yjsDocs  = useRef(new Map());
  const socketRef = useRef(null);

  // ── Layout (UNCHANGED) ───────────────────────────────────────────────────
  const [splitPct, setSplitPct] = useState(55);
  const isDragging  = useRef(false);
  const containerRef = useRef(null);
  const SIDEBAR_W = 200;

  // ── Misc (UNCHANGED) ─────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [srcDoc,  setSrcDoc]  = useState('');

  // ── Live preview (UNCHANGED) ──────────────────────────────────────────────
  useEffect(() => {
    if (editorMode !== 'web') return;
    const t = setTimeout(() => setSrcDoc(buildSrcDoc(fileTree, previewFilePath)), 300);
    return () => clearTimeout(t);
  }, [fileTree, previewFilePath, editorMode]);

  // ── Socket.io + Yjs bootstrap (UNCHANGED) ─────────────────────────────────
  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');
    socketRef.current = socket;
    Object.keys(DEFAULT_TREE).forEach(p => { if (!yjsDocs.current.has(p)) yjsDocs.current.set(p, new Y.Doc()); });

    socket.on('connect', () => socket.emit('join-room', roomId));

    socket.on('room-role', ({ isAdmin: f }) => {
      setIsAdmin(f);
      if (f) { setCanEdit(true); sessionStorage.setItem(`can_edit_${roomId}`, 'true'); }
      else   { setCanEdit(false); sessionStorage.removeItem(`can_edit_${roomId}`); }
    });

    socket.on('sync-step-1', ({ fileName, update }) => {
      if (!fileName || !update) return;
      if (!yjsDocs.current.has(fileName)) yjsDocs.current.set(fileName, new Y.Doc());
      const doc = yjsDocs.current.get(fileName);
      try {
        Y.applyUpdate(doc, new Uint8Array(update));
        const newValue = doc.getText('content').toString();
        if (newValue) {
          if (fileName.startsWith('__code__/')) {
            const ext = fileName.split('.').pop();
            const langKey = LANGUAGES.find(l => l.ext === ext)?.key ?? 'javascript';
            setSelectedLang(langKey); setCodeContent(newValue);
          }
          setFileTree(prev => {
            if (!prev[fileName]) { const name=fileName.split('/').pop(); return {...prev,[fileName]:{type:'file',name,language:inferLanguage(name),value:newValue}}; }
            return {...prev,[fileName]:{...prev[fileName],value:newValue}};
          });
        }
      } catch(_) {}
    });

    socket.on('sync-update', ({ fileName, update }) => {
      if (!fileName || !update) return;
      if (!yjsDocs.current.has(fileName)) yjsDocs.current.set(fileName, new Y.Doc());
      const doc = yjsDocs.current.get(fileName);
      try {
        Y.applyUpdate(doc, new Uint8Array(update));
        const newValue = doc.getText('content').toString();
        if (fileName.startsWith('__code__/')) {
          const ext = fileName.split('.').pop();
          const langKey = LANGUAGES.find(l => l.ext === ext)?.key ?? 'javascript';
          setSelectedLang(langKey); setCodeContent(newValue);
        }
        setFileTree(prev => {
          if (!prev[fileName]) { const name=fileName.split('/').pop(); return {...prev,[fileName]:{type:'file',name,language:inferLanguage(name),value:newValue}}; }
          return {...prev,[fileName]:{...prev[fileName],value:newValue}};
        });
      } catch(_) {}
    });

    socket.on('tree-init', (serverTree) => {
      Object.entries(serverTree).forEach(([p,n]) => {
        if (n.type==='file') {
          if (!yjsDocs.current.has(p)) {
            const doc=new Y.Doc();
            if (n.value) { const yText=doc.getText('content'); if(yText.length===0) doc.transact(()=>{yText.insert(0,n.value);}); }
            yjsDocs.current.set(p, doc);
          }
          if (p.startsWith('__code__/') && n.value) {
            const ext=p.split('.').pop();
            const langKey=LANGUAGES.find(l=>l.ext===ext)?.key??'javascript';
            setSelectedLang(langKey); setCodeContent(n.value); setEditorMode('code');
          }
        }
      });
      setFileTree(prev => ({...prev,...serverTree}));
      const folders=Object.entries(serverTree).filter(([,n])=>n.type==='folder').map(([p])=>p);
      if (folders.length) setExpandedFolders(prev=>new Set([...prev,...folders]));
    });

    socket.on('tree-change', ({ op, path, node, extraPaths }) => {
      if (op==='add') {
        if (node?.type==='file'&&!yjsDocs.current.has(path)) yjsDocs.current.set(path, new Y.Doc());
        if (extraPaths) Object.entries(extraPaths).forEach(([p,n])=>{ if(n.type==='file'&&!yjsDocs.current.has(p)) yjsDocs.current.set(p,new Y.Doc()); });
        setFileTree(prev=>({...prev,[path]:node,...(extraPaths??{})}));
        if (node?.type==='folder') setExpandedFolders(prev=>new Set([...prev,path]));
      } else if (op==='delete') {
        setFileTree(prev=>{ const next={...prev}; Object.keys(next).forEach(k=>{if(k===path||k.startsWith(path+'/'))delete next[k];}); return next; });
      }
    });

    socket.on('mode-change', ({ mode, lang }) => { setEditorMode(mode); if(lang) setSelectedLang(lang); });

    socket.on('edit-request', req  => setIncomingRequests(p=>[...p,req]));
    socket.on('edit-granted',  ()  => { setEditRequestPending(false); setCanEdit(true); sessionStorage.setItem(`can_edit_${roomId}`,'true'); addToast('✅ Edit access granted! You can now type.','success'); });
    socket.on('edit-denied',   ()  => { setEditRequestPending(false); addToast('❌ Request denied by admin.','error'); });

    return () => { socket.disconnect(); yjsDocs.current.forEach(doc=>doc.destroy()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── Yjs broadcast (UNCHANGED) ────────────────────────────────────────────
  const activeSyncKey = editorMode==='code' ? codeModeKey(selectedLang) : activeFilePath;

  useEffect(() => {
    if (!yjsDocs.current.has(activeSyncKey)) yjsDocs.current.set(activeSyncKey, new Y.Doc());
    const doc = yjsDocs.current.get(activeSyncKey);
    const onUpdate = update => { if(socketRef.current?.connected) socketRef.current.emit('sync-update',roomId,{fileName:activeSyncKey,update:Array.from(update)}); };
    doc.on('update', onUpdate);
    return () => doc.off('update', onUpdate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSyncKey, roomId]);

  // ── Editor change (UNCHANGED) ─────────────────────────────────────────────
  const handleEditorChange = useCallback(val => {
    const newVal = val ?? '';
    if (editorMode==='code') { setCodeContent(newVal); }
    else { setFileTree(prev=>({...prev,[activeFilePath]:{...prev[activeFilePath],value:newVal}})); }
    const doc = yjsDocs.current.get(activeSyncKey);
    if (doc) { const yText=doc.getText('content'); if(yText.toString()!==newVal) doc.transact(()=>{yText.delete(0,yText.length);yText.insert(0,newVal);}); }
  }, [activeFilePath, activeSyncKey, editorMode]);

  // ── Language change (UNCHANGED) ───────────────────────────────────────────
  const handleLangChange = useCallback(newKey => {
    const lang = LANG_BY_KEY[newKey]; if (!lang) return;
    setSelectedLang(newKey); setCodeContent(lang.starter); setCodeOutput(null); setRunMeta({cpuTime:null,memory:null});
    const key = codeModeKey(newKey);
    if (!yjsDocs.current.has(key)) yjsDocs.current.set(key, new Y.Doc());
    socketRef.current?.emit('mode-change', roomId, { mode:'code', lang:newKey });
  }, [codeModeKey, roomId]);

  // ── Mode switch (UNCHANGED) ───────────────────────────────────────────────
  const handleModeSwitch = useCallback(mode => {
    setEditorMode(mode); setCodeOutput(null);
    socketRef.current?.emit('mode-change', roomId, { mode, lang:selectedLang });
  }, [roomId, selectedLang]);

  // ── Run code (UNCHANGED) ──────────────────────────────────────────────────
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true); setCodeOutput(null); setRunMeta({cpuTime:null,memory:null});
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/execute`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({language:selectedLang,sourceCode:codeContent,stdin:stdinValue}) });
      const data = await res.json();
      setCodeOutput(data.run?.output ?? 'No output.');
      setRunMeta({ cpuTime:data.run?.cpuTime??null, memory:data.run?.memory??null });
    } catch(err) { setCodeOutput(`❌ Network error: ${err.message}`); }
    finally { setIsRunning(false); }
  }, [isRunning, selectedLang, codeContent, stdinValue]);

  // ── File tree operations (UNCHANGED) ──────────────────────────────────────
  const handleFileClick  = useCallback(path => setActiveFilePath(path), []);
  const handleSetPreview = useCallback(path => setPreviewFilePath(path), []);
  const toggleFolder     = useCallback(path => { setExpandedFolders(prev => { const next=new Set(prev); next.has(path)?next.delete(path):next.add(path); return next; }); }, []);

  const handleDeleteItem = useCallback(path => {
    if (activeFilePath===path||activeFilePath.startsWith(path+'/')) { const r=Object.entries(fileTree).find(([k,n])=>k!==path&&!k.startsWith(path+'/')&&n.type==='file'); if(r) setActiveFilePath(r[0]); }
    if (previewFilePath===path||previewFilePath.startsWith(path+'/')) { const r=Object.entries(fileTree).find(([k,n])=>k!==path&&!k.startsWith(path+'/')&&n.type==='file'&&k.endsWith('.html')); if(r) setPreviewFilePath(r[0]); }
    setFileTree(prev => { const next={...prev}; Object.keys(next).forEach(k=>{if(k===path||k.startsWith(path+'/'))delete next[k];}); return next; });
    socketRef.current?.emit('tree-change', roomId, { op:'delete', path });
  }, [activeFilePath, previewFilePath, fileTree, roomId]);

  const openNewItemForm = useCallback((type, parent='') => {
    setNewItem({visible:true,parent,type,name:''}); if(parent) setExpandedFolders(prev=>new Set([...prev,parent]));
    setTimeout(()=>newItemRef.current?.focus(), 60);
  }, []);

  const handleCreateItem = useCallback(() => {
    const {parent,type,name} = newItem; const trimmed = name.trim();
    if (!trimmed) { setNewItem({visible:false,parent:'',type:'file',name:''}); return; }
    const fullPath = parent?`${parent}/${trimmed}`:trimmed;
    if (fileTree[fullPath]) return;
    if (type==='folder') {
      const folderNode={type:'folder',name:trimmed}; const starters=starterFiles(fullPath);
      setFileTree(prev=>({...prev,[fullPath]:folderNode,...starters})); setExpandedFolders(prev=>new Set([...prev,fullPath]));
      setActiveFilePath(`${fullPath}/index.html`);
      Object.keys(starters).forEach(p=>{ if(!yjsDocs.current.has(p)) yjsDocs.current.set(p,new Y.Doc()); });
      socketRef.current?.emit('tree-change', roomId, {op:'add',path:fullPath,node:folderNode,extraPaths:starters});
    } else {
      const lang=inferLanguage(trimmed); const node={type:'file',name:trimmed,language:lang,value:''};
      setFileTree(prev=>({...prev,[fullPath]:node})); setActiveFilePath(fullPath);
      if(!yjsDocs.current.has(fullPath)) yjsDocs.current.set(fullPath,new Y.Doc());
      socketRef.current?.emit('tree-change', roomId, {op:'add',path:fullPath,node});
    }
    setNewItem({visible:false,parent:'',type:'file',name:''});
  }, [newItem, fileTree, roomId]);

  // ── Permission actions (UNCHANGED) ────────────────────────────────────────
  const requestEditAccess = useCallback(() => {
    if (!socketRef.current?.connected||editRequestPending) return;
    setEditRequestPending(true);
    socketRef.current.emit('request-edit',{roomId,requesterName:`Guest_${socketRef.current.id?.slice(0,4)??'???'}`});
    addToast('📨 Edit request sent to admin…','info');
  }, [editRequestPending, roomId, addToast]);

  const respondToRequest = useCallback((req, approved) => {
    if (!socketRef.current?.connected) return;
    setIncomingRequests(p=>p.filter(r=>r.requesterSocketId!==req.requesterSocketId));
    if (approved) { socketRef.current.emit('grant-edit',{requesterSocketId:req.requesterSocketId,roomId}); addToast(`✅ Granted edit to ${req.requesterName}`,'success'); }
    else          { socketRef.current.emit('deny-edit', {requesterSocketId:req.requesterSocketId,roomId}); addToast(`❌ Denied ${req.requesterName}`,'error'); }
  }, [roomId, addToast]);

  // ── Drag to resize (UNCHANGED) ────────────────────────────────────────────
  const onDragStart = useCallback(e => { e.preventDefault(); isDragging.current=true; document.body.style.cursor='col-resize'; document.body.style.userSelect='none'; }, []);
  useEffect(() => {
    const onMove = e => { if(!isDragging.current||!containerRef.current) return; const rect=containerRef.current.getBoundingClientRect(); const avail=rect.width-SIDEBAR_W-10; const x=e.clientX-rect.left-SIDEBAR_W-5; setSplitPct(Math.min(80,Math.max(20,(x/avail)*100))); };
    const onUp = () => { isDragging.current=false; document.body.style.cursor=''; document.body.style.userSelect=''; };
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
    return () => { window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); };
  }, []);

  // ── Misc (UNCHANGED) ─────────────────────────────────────────────────────
  const copyRoomId = async () => { await navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const refreshPreview = () => { setSrcDoc(''); setTimeout(()=>setSrcDoc(buildSrcDoc(fileTree,previewFilePath)),60); };

  const activeFileNode  = editorMode==='web' ? fileTree[activeFilePath] : null;
  const rootChildren    = getChildren(fileTree, '');
  const pathParts       = activeFilePath.split('/');
  const fileName        = pathParts.pop();
  const dirPart         = pathParts.join('/');
  const currentLangDef  = LANG_BY_KEY[selectedLang] ?? LANGUAGES[0];
  const sidebarW        = editorMode==='web' ? SIDEBAR_W : 46;

  // ══════════════════════════════════════════════════════════════════════════
  // ── RENDER ────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="app-container">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="glass-header">
        {/* Logo */}
        <Link to="/" className="logo-text" style={{ flexShrink:0 }}>
          <Code2 size={17} color="#818cf8" style={{ filter:'drop-shadow(0 0 6px #818cf866)' }} />
          <span>CollabCode</span>
        </Link>

        {/* Divider */}
        <div style={{ width:1, height:18, background:'rgba(255,255,255,0.07)', flexShrink:0 }}/>

        {/* Mode toggle */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:2, gap:2, flexShrink:0 }}>
          {[
            { mode:'web',  icon:<Layout size={12}/>,       label:'Web'  },
            { mode:'code', icon:<TerminalIcon size={12}/>, label:'Code' },
          ].map(m => {
            const active = editorMode === m.mode;
            return (
              <button key={m.mode} className="mode-btn" onClick={() => handleModeSwitch(m.mode)}
                style={{
                  display:'flex', alignItems:'center', gap:5, padding:'4px 11px',
                  borderRadius:6, border:'none', cursor:'pointer',
                  background: active
                    ? m.mode==='code'
                      ? `${currentLangDef.bg}`
                      : 'rgba(99,102,241,0.2)'
                    : 'transparent',
                  color: active
                    ? m.mode==='code' ? currentLangDef.color : '#818cf8'
                    : 'rgba(255,255,255,0.35)',
                  fontWeight:600, fontSize:'0.75rem', fontFamily:'Inter,sans-serif',
                  boxShadow: active ? '0 0 0 1px rgba(255,255,255,0.08)' : 'none',
                  transition:'all 0.2s',
                }}
              >
                {m.icon} {m.label}
              </button>
            );
          })}
        </div>

        {/* Language selector (code mode) */}
        {editorMode === 'code' && (
          <LanguageSelector currentLang={selectedLang} onChange={handleLangChange} disabled={!canEdit} />
        )}

        <div style={{ flex:1 }}/>

        {/* Right side controls */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Admin badge */}
          {isAdmin && (
            <div style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'3px 10px', borderRadius:99,
              background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)',
              fontSize:'0.7rem', fontWeight:700, color:'#818cf8',
              fontFamily:'Inter,sans-serif',
            }}>
              👑 Admin
            </div>
          )}

          {/* View-only + request button */}
          {!canEdit && !isAdmin && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.25)', fontSize:'0.7rem', fontWeight:700, color:'#fbbf24', fontFamily:'Inter,sans-serif' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                View Only
              </div>
              <button onClick={requestEditAccess} disabled={editRequestPending}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, cursor:editRequestPending?'default':'pointer', border:'1px solid rgba(168,85,247,0.4)', background:'rgba(168,85,247,0.1)', color:editRequestPending?'rgba(168,85,247,0.5)':'#c084fc', fontWeight:600, fontSize:'0.72rem', fontFamily:'Inter,sans-serif', transition:'all 0.2s' }}>
                {editRequestPending
                  ? <><span style={{ width:9,height:9,border:'1.5px solid #a855f7',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }}/> Waiting…</>
                  : '🔓 Request Edit'}
              </button>
            </>
          )}

          {/* Room ID */}
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:7, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', fontSize:'0.72rem', fontFamily:'Inter,sans-serif' }}>
            <div style={{ width:5,height:5,borderRadius:'50%',background:'#4ade80',boxShadow:'0 0 6px #4ade80',animation:'pulse-glow 2.5s infinite' }}/>
            <span style={{ color:'rgba(255,255,255,0.35)' }}>Room</span>
            <strong style={{ color:'#fff', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.06em' }}>{roomId}</strong>
          </div>

          {/* Copy Room ID button */}
          <motion.button
            whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={copyRoomId}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, cursor:'pointer', border:`1px solid ${copied?'rgba(16,185,129,0.4)':'rgba(99,102,241,0.35)'}`, background:copied?'rgba(16,185,129,0.1)':'rgba(99,102,241,0.1)', color:'#fff', fontWeight:600, fontSize:'0.72rem', fontFamily:'Inter,sans-serif', transition:'all 0.2s' }}>
            {copied ? <Check size={12} color="#4ade80"/> : <Copy size={12}/>}
            {copied ? 'Copied!' : 'Copy ID'}
          </motion.button>
        </div>
      </header>

      {/* ── TOAST LAYER ──────────────────────────────────────────────────────── */}
      <div style={{ position:'fixed', bottom:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end', pointerEvents:'none' }}>
        <AnimatePresence>
          {toasts.map(t => <Toast key={t.id} t={t} />)}
        </AnimatePresence>
        <AnimatePresence>
          {incomingRequests.slice(0,1).map(req => (
            <div key={req.requesterSocketId} style={{ pointerEvents:'auto' }}>
              <EditRequestPopup
                req={req}
                extraCount={incomingRequests.length-1}
                onApprove={() => respondToRequest(req,true)}
                onDeny={()    => respondToRequest(req,false)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── MAIN LAYOUT ──────────────────────────────────────────────────────── */}
      <main ref={containerRef} style={{ display:'flex', flex:1, padding:'6px', gap:0, overflow:'hidden', minHeight:0 }}>

        {/* ══ WEB MODE SIDEBAR ══════════════════════════════════════════════ */}
        {editorMode === 'web' && (
          <div style={{
            width:`${SIDEBAR_W}px`, flexShrink:0, marginRight:6,
            background:'rgba(6,6,18,0.7)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.06)', borderRadius:12,
            display:'flex', flexDirection:'column', overflow:'hidden',
          }}>
            {/* Sidebar header */}
            <div style={{ padding:'8px 10px', fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.25)', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, fontFamily:'Inter,sans-serif' }}>
              <span>Explorer</span>
              <div style={{ display:'flex', gap:2 }}>
                {[
                  { icon:<FilePlus size={12}/>,   title:'New File',   cb:()=>openNewItemForm('file',''),   hc:'#a78bfa' },
                  { icon:<FolderPlus size={12}/>, title:'New Folder', cb:()=>openNewItemForm('folder',''), hc:'#fbbf24' },
                ].map((btn,i) => (
                  <button key={i} onClick={btn.cb} title={btn.title}
                    style={{ background:'transparent',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',display:'flex',padding:'3px',borderRadius:4,transition:'all 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.color=btn.hc;e.currentTarget.style.background='rgba(255,255,255,0.06)';}}
                    onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.3)';e.currentTarget.style.background='transparent';}}>
                    {btn.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* New-item input */}
            {newItem.visible && (
              <div style={{ padding:'6px 8px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:5, flexShrink:0, background:'rgba(99,102,241,0.05)' }}>
                {newItem.type==='folder' ? <Folder size={11} color="#fbbf24"/> : <FileText size={11} color="rgba(255,255,255,0.3)"/>}
                <input
                  ref={newItemRef}
                  value={newItem.name}
                  onChange={e=>setNewItem(p=>({...p,name:e.target.value}))}
                  onKeyDown={e=>{if(e.key==='Enter')handleCreateItem();if(e.key==='Escape')setNewItem({visible:false,parent:'',type:'file',name:''}); }}
                  placeholder={newItem.type==='folder'?'folder-name':'filename.ext'}
                  style={{ flex:1,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(99,102,241,0.4)',borderRadius:4,color:'#fff',padding:'3px 6px',fontSize:'0.74rem',outline:'none',fontFamily:'Inter,sans-serif',boxSizing:'border-box',minWidth:0 }}
                />
              </div>
            )}

            {/* File tree */}
            <div className="tree-scroll" style={{ flex:1, overflowY:'auto', padding:'4px 4px' }}>
              {rootChildren.map(([path,node]) => (
                <TreeNode key={path} path={path} node={node} tree={fileTree} level={0}
                  activeFilePath={activeFilePath} previewFilePath={previewFilePath}
                  onFileClick={handleFileClick} onSetPreview={handleSetPreview} onDelete={handleDeleteItem}
                  expandedFolders={expandedFolders} toggleFolder={toggleFolder}
                  onAddFile={p=>openNewItemForm('file',p)} onAddFolder={p=>openNewItemForm('folder',p)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ══ CODE MODE LANG STRIP ══════════════════════════════════════════ */}
        {editorMode === 'code' && (
          <div style={{
            width:46, flexShrink:0, marginRight:6,
            background:'rgba(6,6,18,0.7)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.06)', borderRadius:12,
            display:'flex', flexDirection:'column', alignItems:'center',
            padding:'8px 0', gap:3, overflowY:'auto',
          }}>
            {LANGUAGES.map(l => {
              const active = l.key === selectedLang;
              return (
                <button key={l.key} title={l.label}
                  onClick={() => canEdit && handleLangChange(l.key)}
                  style={{
                    width:32, height:32, borderRadius:7, border:'none',
                    cursor:canEdit?'pointer':'default',
                    background: active ? l.bg : 'transparent',
                    border:`1px solid ${active ? `${l.color}44` : 'transparent'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.65rem', color:'white', transition:'all 0.15s',
                    boxShadow: active ? `0 0 12px ${l.color}33` : 'none',
                  }}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background='rgba(255,255,255,0.06)';}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}>
                  <span style={{ userSelect:'none', lineHeight:1 }}>{l.icon}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ══ EDITOR PANEL ═════════════════════════════════════════════════ */}
        <div style={{
          flex:`0 0 calc((100% - ${sidebarW + 14}px) * ${splitPct/100})`,
          display:'flex', flexDirection:'column', borderRadius:12, overflow:'hidden',
          border:'1px solid rgba(255,255,255,0.07)',
          background:'rgba(6,6,15,0.85)', backdropFilter:'blur(20px)',
          minWidth:0,
        }}>
          {/* Tab bar */}
          <div style={{ display:'flex', alignItems:'center', background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0, height:36 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, padding:'0 16px', height:'100%', borderBottom:`2px solid ${editorMode==='code'?currentLangDef.color:'#6366f1'}`, color:'#fff', fontSize:'0.75rem', fontWeight:600, fontFamily:'Inter,sans-serif' }}>
              {editorMode === 'web' ? (
                <>
                  {activeFileNode && <FileIcon name={activeFileNode.name} size={12}/>}
                  {dirPart && <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.68rem' }}>{dirPart} /&nbsp;</span>}
                  <span>{fileName}</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize:'0.82rem', lineHeight:1 }}>{currentLangDef.icon}</span>
                  <span>main.{currentLangDef.ext}</span>
                  <span style={{ fontSize:'0.62rem', color:currentLangDef.color, background:currentLangDef.bg, padding:'1px 6px', borderRadius:99, border:`1px solid ${currentLangDef.color}33` }}>
                    {currentLangDef.label}
                  </span>
                </>
              )}
            </div>
            <div style={{ flex:1 }}/>
            {editorMode==='code' && canEdit && (
              <motion.button
                whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={handleRunCode} disabled={isRunning}
                style={{ display:'flex', alignItems:'center', gap:5, margin:'0 10px', padding:'3px 12px', borderRadius:6, border:`1px solid rgba(34,197,94,${isRunning?0.2:0.4})`, background:isRunning?'rgba(34,197,94,0.05)':'rgba(34,197,94,0.12)', color:'#4ade80', fontWeight:700, fontSize:'0.72rem', fontFamily:'Inter,sans-serif', cursor:isRunning?'not-allowed':'pointer', transition:'all 0.15s' }}>
                {isRunning
                  ? <span style={{ display:'inline-block', animation:'spin 0.8s linear infinite' }}>↻</span>
                  : <Play size={10} fill="currentColor"/>}
                {isRunning ? 'Running…' : '▶ Run'}
              </motion.button>
            )}
          </div>

          {/* Monaco */}
          <div style={{ flex:1, minHeight:0 }}>
            <MonacoEditor
              path={editorMode==='code' ? codeModeKey(selectedLang) : activeFilePath}
              height="100%"
              language={editorMode==='code' ? currentLangDef.monacoLang : (activeFileNode?.language ?? 'plaintext')}
              value={editorMode==='code' ? codeContent : (activeFileNode?.value ?? '')}
              onChange={handleEditorChange}
              onMount={(_,monaco) => defineTheme(monaco)}
              theme="collab-dark"
              options={{
                minimap:{enabled:false}, fontSize:14,
                fontFamily:"'JetBrains Mono',Consolas,monospace", fontLigatures:true,
                wordWrap:'on', padding:{top:14},
                scrollbar:{verticalScrollbarSize:4,horizontalScrollbarSize:4},
                overviewRulerBorder:false, renderLineHighlight:'line',
                readOnly:!canEdit, domReadOnly:!canEdit,
                cursorBlinking:'smooth', cursorSmoothCaretAnimation:'on',
                quickSuggestions:canEdit?{other:true,comments:true,strings:true}:false,
                suggestOnTriggerCharacters:canEdit,
                wordBasedSuggestions:'currentDocument', snippetSuggestions:'inline',
                parameterHints:{enabled:canEdit}, autoClosingBrackets:'always',
                autoClosingQuotes:'always', autoSurround:'languageDefined',
                formatOnType:canEdit, formatOnPaste:canEdit,
                autoClosingTags:true, linkedEditing:canEdit, automaticLayout:true,
              }}
            />
          </div>
        </div>

        {/* ══ DRAG HANDLE ══════════════════════════════════════════════════ */}
        <div onMouseDown={onDragStart}
          style={{ width:8, flexShrink:0, cursor:'col-resize', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
          <div style={{ width:2, height:40, borderRadius:2, background:'rgba(255,255,255,0.08)', transition:'background 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.7)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}/>
        </div>

        {/* ══ RIGHT PANEL ══════════════════════════════════════════════════ */}
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)', background:'rgba(6,6,15,0.85)', backdropFilter:'blur(20px)' }}>
          {editorMode === 'web' ? (
            <>
              {/* Preview bar */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', height:36, background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  {['#ff5f57','#febc2e','#28c840'].map(c => <span key={c} style={{ width:8,height:8,borderRadius:'50%',background:c,display:'inline-block' }}/>)}
                  <div style={{ marginLeft:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:5, padding:'2px 10px', fontSize:'0.68rem', color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center', gap:5, fontFamily:'Inter,sans-serif' }}>
                    <Globe size={9}/> {previewFilePath}
                  </div>
                </div>
                <button onClick={refreshPreview}
                  style={{ background:'transparent',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:'0.68rem',padding:'3px 6px',borderRadius:4,fontFamily:'Inter,sans-serif',transition:'color 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.color='#fff'}
                  onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.3)'}>
                  <RefreshCw size={11}/> Refresh
                </button>
              </div>
              <iframe srcDoc={srcDoc} title="Live Preview" sandbox="allow-scripts allow-same-origin"
                style={{ flex:1,border:'none',background:'#fff',width:'100%' }}/>
            </>
          ) : (
            <OutputPanel
              output={codeOutput} isRunning={isRunning} onRun={handleRunCode}
              stdin={stdinValue} onStdinChange={setStdinValue}
              cpuTime={runMeta.cpuTime} memory={runMeta.memory} canEdit={canEdit}
            />
          )}
        </div>
      </main>
    </div>
  );
}
