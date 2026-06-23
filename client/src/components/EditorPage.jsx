import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { emmetHTML, emmetCSS, emmetJSX } from 'emmet-monaco-es';
import {
  Code2, Settings, Globe, RefreshCw, Copy, Check,
  FileCode, FileText, Braces, FileCog, Trash2,
  ChevronDown, ChevronRight, FolderOpen, Folder,
  FilePlus, FolderPlus, Play, Terminal as TerminalIcon,
  Layout, ChevronUp, Clock, Cpu, AlertCircle,
} from 'lucide-react';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import '../index.css';

// ══════════════════════════════════════════════════════════════════════════════
// ── Multi-language definitions ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export const LANGUAGES = [
  // ── Web & Scripting ────────────────────────────────
  {
    key: 'javascript', label: 'JavaScript', ext: 'js',
    monacoLang: 'javascript', color: '#f7df1e', bg: 'rgba(247,223,30,0.12)',
    icon: '𝙅𝙎',
    starter: `// JavaScript — Node.js ${new Date().getFullYear()}
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

let lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  console.log('Hello, World! 👋');
  console.log('Lines received:', lines);
});`,
  },
  {
    key: 'typescript', label: 'TypeScript', ext: 'ts',
    monacoLang: 'typescript', color: '#3178c6', bg: 'rgba(49,120,198,0.15)',
    icon: '𝙏𝙎',
    starter: `// TypeScript
function greet(name: string): string {
  return \`Hello, \${name}! 👋\`;
}

const message: string = greet('World');
console.log(message);`,
  },
  {
    key: 'python', label: 'Python', ext: 'py',
    monacoLang: 'python', color: '#3572A5', bg: 'rgba(53,114,165,0.15)',
    icon: '🐍',
    starter: `# Python 3
import sys

def solve():
    name = input("Enter name: ")
    print(f"Hello, {name}! 👋")
    
solve()`,
  },
  {
    key: 'ruby', label: 'Ruby', ext: 'rb',
    monacoLang: 'ruby', color: '#cc342d', bg: 'rgba(204,52,45,0.12)',
    icon: '💎',
    starter: `# Ruby
puts "Hello, World! 👋"
name = gets&.chomp || "World"
puts "Welcome, #{name}!"`,
  },
  {
    key: 'php', label: 'PHP', ext: 'php',
    monacoLang: 'php', color: '#777bb4', bg: 'rgba(119,123,180,0.15)',
    icon: '🐘',
    starter: `<?php
// PHP 8
$name = "World";
echo "Hello, $name! 👋\n";

$arr = [1, 2, 3, 4, 5];
$sum = array_sum($arr);
echo "Sum: $sum\n";`,
  },
  {
    key: 'perl', label: 'Perl', ext: 'pl',
    monacoLang: 'perl', color: '#0298c3', bg: 'rgba(2,152,195,0.12)',
    icon: '🔮',
    starter: `#!/usr/bin/perl
use strict;
use warnings;

my $name = "World";
print "Hello, $name! 👋\n";`,
  },

  // ── Systems / Compiled ─────────────────────────────
  {
    key: 'c', label: 'C', ext: 'c',
    monacoLang: 'c', color: '#555555', bg: 'rgba(85,85,85,0.15)',
    icon: '©',
    starter: `#include <stdio.h>

int main() {
    printf("Hello, World! 👋\\n");
    
    int n;
    scanf("%d", &n);
    printf("You entered: %d\\n", n);
    
    return 0;
}`,
  },
  {
    key: 'cpp', label: 'C++', ext: 'cpp',
    monacoLang: 'cpp', color: '#00599c', bg: 'rgba(0,89,156,0.15)',
    icon: '⊕',
    starter: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    cout << "Hello, World! 👋" << endl;
    
    int n;
    cin >> n;
    cout << "You entered: " << n << endl;
    
    return 0;
}`,
  },
  {
    key: 'java', label: 'Java', ext: 'java',
    monacoLang: 'java', color: '#b07219', bg: 'rgba(176,114,25,0.15)',
    icon: '☕',
    starter: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World! 👋");
        
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLine()) {
            String name = sc.nextLine();
            System.out.println("Welcome, " + name + "!");
        }
    }
}`,
  },
  {
    key: 'go', label: 'Go', ext: 'go',
    monacoLang: 'go', color: '#00ADD8', bg: 'rgba(0,173,216,0.12)',
    icon: '🐹',
    starter: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	fmt.Println("Hello, World! 👋")

	scanner := bufio.NewScanner(os.Stdin)
	if scanner.Scan() {
		fmt.Printf("Hello, %s!\\n", scanner.Text())
	}
}`,
  },
  {
    key: 'rust', label: 'Rust', ext: 'rs',
    monacoLang: 'rust', color: '#dea584', bg: 'rgba(222,165,132,0.12)',
    icon: '🦀',
    starter: `use std::io::{self, BufRead};

fn main() {
    println!("Hello, World! 👋");

    let stdin = io::stdin();
    if let Some(Ok(line)) = stdin.lock().lines().next() {
        println!("Hello, {}!", line);
    }
}`,
  },
  {
    key: 'kotlin', label: 'Kotlin', ext: 'kt',
    monacoLang: 'kotlin', color: '#A97BFF', bg: 'rgba(169,123,255,0.12)',
    icon: '🎯',
    starter: `fun main() {
    println("Hello, World! 👋")
    
    val name = readLine() ?: "World"
    println("Welcome, $name!")
}`,
  },
  {
    key: 'swift', label: 'Swift', ext: 'swift',
    monacoLang: 'swift', color: '#F05138', bg: 'rgba(240,81,56,0.12)',
    icon: '🐦',
    starter: `import Foundation

print("Hello, World! 👋")

if let name = readLine() {
    print("Welcome, \\(name)!")
}`,
  },
  {
    key: 'csharp', label: 'C#', ext: 'cs',
    monacoLang: 'csharp', color: '#239120', bg: 'rgba(35,145,32,0.12)',
    icon: '♯',
    starter: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World! 👋");
        
        string name = Console.ReadLine() ?? "World";
        Console.WriteLine($"Welcome, {name}!");
    }
}`,
  },
  {
    key: 'scala', label: 'Scala', ext: 'scala',
    monacoLang: 'scala', color: '#DC322F', bg: 'rgba(220,50,47,0.12)',
    icon: '⚖️',
    starter: `import scala.io.StdIn

object Main extends App {
  println("Hello, World! 👋")
  
  val name = StdIn.readLine()
  if (name != null) println(s"Welcome, $name!")
}`,
  },

  // ── Functional / Other ─────────────────────────────
  {
    key: 'haskell', label: 'Haskell', ext: 'hs',
    monacoLang: 'haskell', color: '#5e5086', bg: 'rgba(94,80,134,0.15)',
    icon: 'λ',
    starter: `main :: IO ()
main = do
    putStrLn "Hello, World! 👋"
    name <- getLine
    putStrLn $ "Welcome, " ++ name ++ "!"`,
  },
  {
    key: 'r', label: 'R', ext: 'r',
    monacoLang: 'r', color: '#276dc3', bg: 'rgba(39,109,195,0.12)',
    icon: '📊',
    starter: `# R
cat("Hello, World! 👋\n")
name <- readLines(con = stdin(), n = 1)
cat(paste("Welcome,", name, "!\n"))`,
  },
  {
    key: 'bash', label: 'Bash', ext: 'sh',
    monacoLang: 'shell', color: '#89e051', bg: 'rgba(137,224,81,0.10)',
    icon: '$_',
    starter: `#!/bin/bash
echo "Hello, World! 👋"
read -r name
echo "Welcome, $name!"`,
  },
  {
    key: 'sql', label: 'SQL', ext: 'sql',
    monacoLang: 'sql', color: '#e38c00', bg: 'rgba(227,140,0,0.12)',
    icon: '🗄️',
    starter: `-- SQL (SQLite)
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);

INSERT INTO users VALUES (1, 'Alice', 30);
INSERT INTO users VALUES (2, 'Bob', 25);
INSERT INTO users VALUES (3, 'Charlie', 35);

SELECT name, age FROM users WHERE age > 27 ORDER BY age DESC;`,
  },
];

const LANG_BY_KEY = Object.fromEntries(LANGUAGES.map(l => [l.key, l]));

// ── Starter content (web mode) ─────────────────────────────────────────────
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
const DEFAULT_TREE = {
  'index.html': { type: 'file', name: 'index.html', language: 'html',       value: STARTER_HTML('CollabCode 3D') },
  'style.css':  { type: 'file', name: 'style.css',  language: 'css',        value: STARTER_CSS },
  'script.js':  { type: 'file', name: 'script.js',  language: 'javascript', value: STARTER_JS },
};

// ── Pure helper functions ─────────────────────────────────────────────────────
function inferLanguage(name) {
  const ext = name.split('.').pop();
  return { html:'html', css:'css', js:'javascript', ts:'typescript', json:'json',
           py:'python', rb:'ruby', php:'php', pl:'perl', c:'c', cpp:'cpp',
           java:'java', go:'go', rs:'rust', kt:'kotlin', swift:'swift',
           cs:'csharp', scala:'scala', hs:'haskell', r:'r', sh:'shell', sql:'sql',
         }[ext] ?? 'plaintext';
}

function FileIcon({ name, size = 13 }) {
  const ext = name.split('.').pop();
  if (ext === 'html') return <FileCode size={size} color="#e44d26" />;
  if (ext === 'css')  return <FileCog  size={size} color="#5b8af5" />;
  if (ext === 'js')   return <Braces   size={size} color="#f7df1e" />;
  return <FileText size={size} color="#888" />;
}

function resolvePath(folderPath, href) {
  href = href.replace(/^\.\//, '');
  if (href.startsWith('../')) {
    const parts = folderPath.split('/').filter(Boolean);
    parts.pop();
    href = href.slice(3);
    return parts.length ? `${parts.join('/')}/${href}` : href;
  }
  return folderPath ? `${folderPath}/${href}` : href;
}

function buildSrcDoc(tree, previewPath) {
  const htmlNode = tree[previewPath];
  if (!htmlNode || htmlNode.type !== 'file') return '';
  const folderPath = previewPath.includes('/')
    ? previewPath.split('/').slice(0, -1).join('/')
    : '';

  let html = htmlNode.value ?? '';

  html = html.replace(
    /<link([^>]*)href=["']([^"']+\.css)["']([^>]*)>/gi,
    (_m, a, href, b) => {
      const node = tree[resolvePath(folderPath, href)];
      return node ? `<style>${node.value}</style>` : `<link${a}href="${href}"${b}>`;
    }
  );

  html = html.replace(
    /<script([^>]*)src=["']([^"']+\.js)["']([^>]*)><\/script>/gi,
    (_m, a, src, b) => {
      const node = tree[resolvePath(folderPath, src)];
      return node ? `<script${a}${b}>\n${node.value}\n</script>` : `<script${a}src="${src}"${b}></script>`;
    }
  );

  return html;
}

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

const btnStyle = {
  background:'transparent', border:'none', cursor:'pointer',
  color:'rgba(255,255,255,0.2)', display:'flex', padding:'1px', flexShrink:0,
};
const hoverOn  = color => e => { e.currentTarget.style.color = color; };
const hoverOff = e => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; };

// ══════════════════════════════════════════════════════════════════════════════
// ── Language Selector Dropdown ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function LanguageSelector({ currentLang, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const lang = LANG_BY_KEY[currentLang] ?? LANGUAGES[0];

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const groups = [
    { label: 'Web & Scripting', keys: ['javascript','typescript','python','ruby','php','perl'] },
    { label: 'Systems', keys: ['c','cpp','java','go','rust','kotlin','swift','csharp','scala'] },
    { label: 'Other', keys: ['haskell','r','bash','sql'] },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px', borderRadius: '8px', cursor: disabled ? 'default' : 'pointer',
          background: lang.bg, border: `1px solid ${lang.color}44`,
          color: '#fff', fontSize: '0.82rem', fontWeight: '700',
          transition: 'all 0.2s', minWidth: '145px',
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{lang.icon}</span>
        <span style={{ flex: 1 }}>{lang.label}</span>
        <ChevronDown size={13} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 9999,
          background: '#111118', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px', padding: '8px', minWidth: '220px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          maxHeight: '420px', overflowY: 'auto',
        }}>
          {groups.map(group => (
            <div key={group.label}>
              <div style={{
                fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
                padding: '6px 10px 3px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '4px',
              }}>{group.label}</div>
              {group.keys.map(key => {
                const l = LANG_BY_KEY[key];
                const isActive = key === currentLang;
                return (
                  <div
                    key={key}
                    onClick={() => { onChange(key); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '7px 10px', borderRadius: '7px', cursor: 'pointer',
                      background: isActive ? `${l.color}22` : 'transparent',
                      border: isActive ? `1px solid ${l.color}44` : '1px solid transparent',
                      marginBottom: '2px', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: '0.9rem', width: '22px', textAlign: 'center' }}>{l.icon}</span>
                    <span style={{ fontSize: '0.83rem', color: isActive ? l.color : 'rgba(255,255,255,0.75)', fontWeight: isActive ? '700' : '400' }}>
                      {l.label}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                      .{l.ext}
                    </span>
                  </div>
                );
              })}
              <div style={{ height: '6px' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Code-mode Terminal / Output Panel ────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function OutputPanel({ output, isRunning, onRun, stdin, onStdinChange, cpuTime, memory, canEdit }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [output]);

  const hasOutput = output !== null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0d0d0d', fontFamily: "'JetBrains Mono', Consolas, monospace",
      fontSize: '13px', overflow: 'hidden',
    }}>
      {/* ── Header bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 14px', background: '#141414',
        borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
      }}>
        <TerminalIcon size={14} color="#4ade80" />
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Output
        </span>
        <div style={{ flex: 1 }} />
        {cpuTime && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
            <Clock size={11} /> {cpuTime}s
          </span>
        )}
        {memory && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
            <Cpu size={11} /> {memory}KB
          </span>
        )}
        {canEdit && (
          <button
            onClick={onRun}
            disabled={isRunning}
            id="run-code-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer',
              background: isRunning ? 'rgba(74,222,128,0.1)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: isRunning ? '#4ade80' : '#fff', fontWeight: '700', fontSize: '0.8rem',
              fontFamily: 'inherit', transition: 'all 0.2s',
              boxShadow: isRunning ? 'none' : '0 4px 12px rgba(34,197,94,0.35)',
            }}
          >
            {isRunning
              ? <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>↻</span>
              : <Play size={12} fill="currentColor" />}
            {isRunning ? 'Running…' : 'Run Code'}
          </button>
        )}
      </div>

      {/* ── Stdin row ── */}
      {canEdit && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '8px 14px', background: '#111',
          borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: '4px', whiteSpace: 'nowrap' }}>
            stdin
          </span>
          <textarea
            value={stdin}
            onChange={e => onStdinChange(e.target.value)}
            placeholder="Provide input here (one value per line)…"
            rows={2}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px',
              color: '#4ade80', fontFamily: 'inherit', fontSize: '12px',
              padding: '5px 8px', outline: 'none', resize: 'none',
              lineHeight: '1.5', caretColor: '#4ade80',
            }}
          />
        </div>
      )}

      {/* ── Output area ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {!hasOutput && !isRunning && (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem', marginTop: '8px' }}>
            Click <strong style={{ color: '#4ade80' }}>Run Code</strong> to execute your program…
          </div>
        )}
        {isRunning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '0.82rem' }}>
            <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>↻</span>
            Executing on JDoodle sandbox…
          </div>
        )}
        {hasOutput && !isRunning && (
          <pre style={{
            color: '#d4d4d4', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            margin: 0, lineHeight: '1.6', fontSize: '13px',
          }}>
            {output}
          </pre>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main EditorPage ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
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

  // ── Editor mode: 'web' | 'code' ───────────────────────────────────────────
  const [editorMode, setEditorMode] = useState('web');

  // ── Multi-language code mode state ───────────────────────────────────────
  const [selectedLang,   setSelectedLang]   = useState('javascript');
  const [codeContent,    setCodeContent]    = useState(() => LANG_BY_KEY['javascript'].starter);
  const [stdinValue,     setStdinValue]     = useState('');
  const [codeOutput,     setCodeOutput]     = useState(null);
  const [isRunning,      setIsRunning]      = useState(false);
  const [runMeta,        setRunMeta]        = useState({ cpuTime: null, memory: null });

  // Code mode file key (virtual — stored in fileTree for sync)
  const codeModeKey = useCallback(lang => `__code__/main.${LANG_BY_KEY[lang]?.ext ?? 'txt'}`, []);

  // ── File tree state ───────────────────────────────────────────────────────
  const [fileTree,        setFileTree]        = useState(DEFAULT_TREE);
  const [activeFilePath,  setActiveFilePath]  = useState('index.html');
  const [previewFilePath, setPreviewFilePath] = useState('index.html');
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const [newItem, setNewItem] = useState({ visible:false, parent:'', type:'file', name:'' });
  const newItemRef = useRef(null);

  // ── Yjs / Socket refs ─────────────────────────────────────────────────────
  const yjsDocs   = useRef(new Map());
  const socketRef = useRef(null);

  // ── Layout ────────────────────────────────────────────────────────────────
  const [splitPct,  setSplitPct]  = useState(55);
  const isDragging  = useRef(false);
  const containerRef = useRef(null);
  const SIDEBAR_W = 210;

  // ── Header misc ───────────────────────────────────────────────────────────
  const [copied,  setCopied]  = useState(false);
  const [srcDoc,  setSrcDoc]  = useState('');

  // ── Live preview ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (editorMode !== 'web') return;
    const t = setTimeout(() => setSrcDoc(buildSrcDoc(fileTree, previewFilePath)), 300);
    return () => clearTimeout(t);
  }, [fileTree, previewFilePath, editorMode]);

  // ── Socket.io + Yjs bootstrap ─────────────────────────────────────────────
  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');
    socketRef.current = socket;

    // Pre-init Yjs docs for default web files
    Object.keys(DEFAULT_TREE).forEach(p => {
      if (!yjsDocs.current.has(p)) yjsDocs.current.set(p, new Y.Doc());
    });

    socket.on('connect', () => socket.emit('join-room', roomId));

    socket.on('room-role', ({ isAdmin: f }) => {
      setIsAdmin(f);
      if (f) {
        setCanEdit(true);
        sessionStorage.setItem(`can_edit_${roomId}`, 'true');
      } else {
        setCanEdit(false);
        sessionStorage.removeItem(`can_edit_${roomId}`);
      }
    });

    // Per-file state sync on join (server sends one event per file)
    socket.on('sync-step-1', ({ fileName, update }) => {
      if (!fileName || !update) return;
      if (!yjsDocs.current.has(fileName)) yjsDocs.current.set(fileName, new Y.Doc());
      const doc = yjsDocs.current.get(fileName);
      try {
        Y.applyUpdate(doc, new Uint8Array(update));
        const newValue = doc.getText('content').toString();
        if (newValue) {
          // Handle code mode virtual files
          if (fileName.startsWith('__code__/')) {
            const ext = fileName.split('.').pop();
            const langKey = LANGUAGES.find(l => l.ext === ext)?.key ?? 'javascript';
            setSelectedLang(langKey);
            setCodeContent(newValue);
          }
          setFileTree(prev => {
            if (!prev[fileName]) {
              const name = fileName.split('/').pop();
              return {
                ...prev,
                [fileName]: { type: 'file', name, language: inferLanguage(name), value: newValue },
              };
            }
            return { ...prev, [fileName]: { ...prev[fileName], value: newValue } };
          });
        }
      } catch (_) {}
    });

    // Incremental content update
    socket.on('sync-update', ({ fileName, update }) => {
      if (!fileName || !update) return;
      if (!yjsDocs.current.has(fileName)) yjsDocs.current.set(fileName, new Y.Doc());
      const doc = yjsDocs.current.get(fileName);
      try {
        Y.applyUpdate(doc, new Uint8Array(update));
        const newValue = doc.getText('content').toString();
        // Handle code mode virtual files
        if (fileName.startsWith('__code__/')) {
          const ext = fileName.split('.').pop();
          const langKey = LANGUAGES.find(l => l.ext === ext)?.key ?? 'javascript';
          setSelectedLang(langKey);
          setCodeContent(newValue);
        }
        setFileTree(prev => {
          if (!prev[fileName]) {
            const name = fileName.split('/').pop();
            return {
              ...prev,
              [fileName]: { type: 'file', name, language: inferLanguage(name), value: newValue },
            };
          }
          return { ...prev, [fileName]: { ...prev[fileName], value: newValue } };
        });
      } catch (_) {}
    });

    // Full tree sync for late-joining guests
    socket.on('tree-init', (serverTree) => {
      Object.entries(serverTree).forEach(([p, n]) => {
        if (n.type === 'file') {
          if (!yjsDocs.current.has(p)) {
            const doc = new Y.Doc();
            if (n.value) {
              const yText = doc.getText('content');
              if (yText.length === 0) {
                doc.transact(() => { yText.insert(0, n.value); });
              }
            }
            yjsDocs.current.set(p, doc);
          }
          // Restore code mode state from server tree
          if (p.startsWith('__code__/') && n.value) {
            const ext = p.split('.').pop();
            const langKey = LANGUAGES.find(l => l.ext === ext)?.key ?? 'javascript';
            setSelectedLang(langKey);
            setCodeContent(n.value);
            setEditorMode('code');
          }
        }
      });
      setFileTree(prev => ({ ...prev, ...serverTree }));
      const folders = Object.entries(serverTree)
        .filter(([, n]) => n.type === 'folder')
        .map(([p]) => p);
      if (folders.length) {
        setExpandedFolders(prev => new Set([...prev, ...folders]));
      }
    });

    // Tree structure change
    socket.on('tree-change', ({ op, path, node, extraPaths }) => {
      if (op === 'add') {
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

    // ── Mode sync: when admin switches mode, guests follow ─────────────────
    socket.on('mode-change', ({ mode, lang }) => {
      setEditorMode(mode);
      if (lang) setSelectedLang(lang);
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

  // ── Yjs update → broadcast (web mode: active file; code mode: code key) ───
  const activeSyncKey = editorMode === 'code' ? codeModeKey(selectedLang) : activeFilePath;

  useEffect(() => {
    if (!yjsDocs.current.has(activeSyncKey)) {
      yjsDocs.current.set(activeSyncKey, new Y.Doc());
    }
    const doc = yjsDocs.current.get(activeSyncKey);
    const onUpdate = update => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync-update', roomId, {
          fileName: activeSyncKey,
          update: Array.from(update),
        });
      }
    };
    doc.on('update', onUpdate);
    return () => doc.off('update', onUpdate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSyncKey, roomId]);

  // ── Editor change → Yjs + local state ────────────────────────────────────
  const handleEditorChange = useCallback(val => {
    const newVal = val ?? '';
    if (editorMode === 'code') {
      setCodeContent(newVal);
    } else {
      setFileTree(prev => ({
        ...prev,
        [activeFilePath]: { ...prev[activeFilePath], value: newVal },
      }));
    }
    const doc = yjsDocs.current.get(activeSyncKey);
    if (doc) {
      const yText = doc.getText('content');
      if (yText.toString() !== newVal) {
        doc.transact(() => { yText.delete(0, yText.length); yText.insert(0, newVal); });
      }
    }
  }, [activeFilePath, activeSyncKey, editorMode]);

  // ── Language change in code mode ──────────────────────────────────────────
  const handleLangChange = useCallback(newKey => {
    const lang = LANG_BY_KEY[newKey];
    if (!lang) return;
    setSelectedLang(newKey);
    // Reset code content to that language's starter
    setCodeContent(lang.starter);
    setCodeOutput(null);
    setRunMeta({ cpuTime: null, memory: null });
    // Init new Yjs doc for new language file key
    const key = codeModeKey(newKey);
    if (!yjsDocs.current.has(key)) yjsDocs.current.set(key, new Y.Doc());
    // Broadcast language change so guests follow
    socketRef.current?.emit('mode-change', roomId, { mode: 'code', lang: newKey });
  }, [codeModeKey, roomId]);

  // ── Mode switch ───────────────────────────────────────────────────────────
  const handleModeSwitch = useCallback(mode => {
    setEditorMode(mode);
    setCodeOutput(null);
    socketRef.current?.emit('mode-change', roomId, { mode, lang: selectedLang });
  }, [roomId, selectedLang]);

  // ── Run code ──────────────────────────────────────────────────────────────
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setCodeOutput(null);
    setRunMeta({ cpuTime: null, memory: null });
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          sourceCode: codeContent,
          stdin: stdinValue,
        }),
      });
      const data = await res.json();
      setCodeOutput(data.run?.output ?? 'No output.');
      setRunMeta({ cpuTime: data.run?.cpuTime ?? null, memory: data.run?.memory ?? null });
    } catch (err) {
      setCodeOutput(`❌ Network error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, selectedLang, codeContent, stdinValue]);

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
    if (fileTree[fullPath]) return;

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

  const activeFileNode = editorMode === 'web' ? fileTree[activeFilePath] : null;
  const rootChildren   = getChildren(fileTree, '');
  const pathParts      = activeFilePath.split('/');
  const fileName       = pathParts.pop();
  const dirPart        = pathParts.join('/');

  const currentLangDef = LANG_BY_KEY[selectedLang] ?? LANGUAGES[0];

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
        .output-scroll::-webkit-scrollbar { width: 5px; }
        .output-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .mode-btn { transition: all 0.2s; }
        .mode-btn:hover { transform: translateY(-1px); }
      `}</style>

      {/* ── Header ── */}
      <header className="glass-header">
        <Link to="/" style={{ textDecoration:'none' }} className="logo-text">
          <Code2 size={22} color="#6366f1" />
          <span>CollabCode 3D</span>
        </Link>

        {/* ── Mode Toggle (Web / Code) ── */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            className="mode-btn"
            onClick={() => handleModeSwitch('web')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: editorMode === 'web' ? 'linear-gradient(135deg,rgba(99,102,241,0.4),rgba(168,85,247,0.35))' : 'transparent',
              color: editorMode === 'web' ? '#fff' : 'rgba(255,255,255,0.4)',
              fontWeight: '600', fontSize: '0.78rem',
              boxShadow: editorMode === 'web' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
              border: editorMode === 'web' ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
            }}
          >
            <Layout size={13} /> Web
          </button>
          <button
            className="mode-btn"
            onClick={() => handleModeSwitch('code')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: editorMode === 'code' ? `linear-gradient(135deg,${currentLangDef.bg},rgba(34,197,94,0.15))` : 'transparent',
              color: editorMode === 'code' ? '#fff' : 'rgba(255,255,255,0.4)',
              fontWeight: '600', fontSize: '0.78rem',
              boxShadow: editorMode === 'code' ? '0 2px 8px rgba(34,197,94,0.2)' : 'none',
              border: editorMode === 'code' ? `1px solid ${currentLangDef.color}44` : '1px solid transparent',
            }}
          >
            <TerminalIcon size={13} /> Code
          </button>
        </div>

        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          {/* Language selector (code mode only) */}
          {editorMode === 'code' && (
            <LanguageSelector
              currentLang={selectedLang}
              onChange={handleLangChange}
              disabled={!canEdit}
            />
          )}

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

        {/* ── SIDEBAR (web mode only) ── */}
        {editorMode === 'web' && (
          <div style={{ width:`${SIDEBAR_W}px`, flexShrink:0, marginRight:'8px', background:'rgba(0,0,0,0.12)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', display:'flex', flexDirection:'column', overflow:'hidden' }}>

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
        )}

        {/* ── CODE MODE: Language info sidebar ── */}
        {editorMode === 'code' && (
          <div style={{
            width: '48px', flexShrink: 0, marginRight: '8px',
            background: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '12px 0', gap: '8px', overflow: 'hidden',
          }}>
            {LANGUAGES.map(l => (
              <button
                key={l.key}
                title={l.label}
                onClick={() => canEdit && handleLangChange(l.key)}
                style={{
                  width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                  cursor: canEdit ? 'pointer' : 'default',
                  background: l.key === selectedLang ? l.bg : 'transparent',
                  border: l.key === selectedLang ? `1px solid ${l.color}55` : '1px solid transparent',
                  color: 'white', fontSize: '0.72rem', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', transition: 'all 0.15s',
                  boxShadow: l.key === selectedLang ? `0 0 10px ${l.color}33` : 'none',
                }}
                onMouseEnter={e => { if (l.key !== selectedLang) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { if (l.key !== selectedLang) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '0.65rem', lineHeight: 1, textAlign: 'center', userSelect: 'none' }}>
                  {l.icon}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── EDITOR PANEL ── */}
        <div style={{ flex:`0 0 calc((100% - ${editorMode === 'web' ? SIDEBAR_W + 16 : 64}px) * ${splitPct/100})`, display:'flex', flexDirection:'column', borderRadius:'12px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.1)', backdropFilter:'blur(10px)', minWidth:0 }}>

          {/* Active file tab */}
          <div style={{ display:'flex', background:'rgba(0,0,0,0.05)', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ padding:'9px 18px', background:'rgba(255,255,255,0.05)', borderBottom:`1.5px solid ${editorMode === 'code' ? currentLangDef.color : '#6366f1'}`, color:'#fff', fontSize:'0.78rem', fontWeight:'600', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap', overflow:'hidden', maxWidth:'60%' }}>
              {editorMode === 'web' ? (
                <>
                  {activeFileNode && <FileIcon name={activeFileNode.name}/>}
                  {dirPart && (
                    <span style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.7rem' }}>{dirPart} /&nbsp;</span>
                  )}
                  <span>{fileName}</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.9rem' }}>{currentLangDef.icon}</span>
                  <span>main.{currentLangDef.ext}</span>
                  <span style={{ fontSize: '0.68rem', color: currentLangDef.color, background: currentLangDef.bg, padding: '1px 7px', borderRadius: '10px', border: `1px solid ${currentLangDef.color}44` }}>
                    {currentLangDef.label}
                  </span>
                </>
              )}
            </div>
            {editorMode === 'code' && canEdit && (
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  margin: '0 12px', padding: '4px 12px', borderRadius: '6px',
                  border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer',
                  background: isRunning ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.2)',
                  color: '#4ade80', fontWeight: '700', fontSize: '0.75rem',
                  fontFamily: 'inherit', border: `1px solid rgba(34,197,94,${isRunning ? '0.2' : '0.4'})`,
                }}
              >
                {isRunning
                  ? <span style={{ display:'inline-block', animation:'spin 0.8s linear infinite' }}>↻</span>
                  : <Play size={11} fill="currentColor" />}
                {isRunning ? 'Running…' : '▶ Run'}
              </button>
            )}
          </div>

          <div style={{ flex:1, minHeight:0 }}>
            <MonacoEditor
              path={editorMode === 'code' ? codeModeKey(selectedLang) : activeFilePath}
              height="100%"
              language={editorMode === 'code' ? currentLangDef.monacoLang : (activeFileNode?.language ?? 'plaintext')}
              value={editorMode === 'code' ? codeContent : (activeFileNode?.value ?? '')}
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

        {/* ── RIGHT PANEL: Live Preview (web) OR Output (code) ── */}
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', borderRadius:'12px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.1)', backdropFilter:'blur(10px)' }}>

          {editorMode === 'web' ? (
            <>
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
            </>
          ) : (
            <OutputPanel
              output={codeOutput}
              isRunning={isRunning}
              onRun={handleRunCode}
              stdin={stdinValue}
              onStdinChange={setStdinValue}
              cpuTime={runMeta.cpuTime}
              memory={runMeta.memory}
              canEdit={canEdit}
            />
          )}
        </div>
      </main>
    </div>
  );
}
