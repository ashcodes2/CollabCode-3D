import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { io } from 'socket.io-client';

const Editor = forwardRef(({ roomId, language, username = `Guest_${Math.floor(Math.random() * 1000)}` }, ref) => {
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const bindingRef = useRef(null);
  const docRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      return editorRef.current ? editorRef.current.getValue() : '';
    }
  }));

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // We can define custom themes here for the editor to match our glassmorphism
    monaco.editor.defineTheme('transparent-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { background: '00000000' }
      ],
      colors: {
        'editor.background': '#00000000', // Transparent background
        'editor.lineHighlightBackground': '#ffffff10',
        'editorLineNumber.foreground': '#ffffff50',
      }
    });
    
    monaco.editor.setTheme('transparent-dark');

    // Initialize Yjs and Socket.io
    const doc = new Y.Doc();
    docRef.current = doc;
    const type = doc.getText('monaco');

    // Connect to the backend
    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to signaling server');
      socket.emit('join-room', roomId);
    });

    // Handle incoming updates from the server
    socket.on('sync-update', (update) => {
      Y.applyUpdate(doc, new Uint8Array(update));
    });

    // Handle initial sync when joining
    socket.on('sync-step-1', (stateVector, stateAsUpdate) => {
      Y.applyUpdate(doc, new Uint8Array(stateAsUpdate));
    });

    // When the local Yjs document changes, send it to the server
    doc.on('update', (update) => {
      socket.emit('sync-update', roomId, Array.from(update));
    });

    // Bind Yjs to Monaco
    // Note: The third argument is usually the awareness object for cursors.
    // For simplicity right now, we are binding the text. Remote cursors will be added next.
    bindingRef.current = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), null);
  };

  useEffect(() => {
    return () => {
      if (bindingRef.current) bindingRef.current.destroy();
      if (socketRef.current) socketRef.current.disconnect();
      if (docRef.current) docRef.current.destroy();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MonacoEditor
        height="100%"
        language={language}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 16,
          fontFamily: 'JetBrains Mono, Consolas, monospace',
          wordWrap: 'on',
          padding: { top: 24, bottom: 24 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          formatOnPaste: true,
        }}
      />
    </div>
  );
});

export default Editor;
