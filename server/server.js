require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Y = require('yjs');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const executeRoutes = require('./routes/execute');

// Allowed origins: localhost + any Vercel deployment + custom override via env
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  /\.vercel\.app$/,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
];

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/execute', executeRoutes);

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/collab-editor')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// In-memory Yjs docs per room
const docs = new Map();

// Room metadata: roomId -> { adminSocketId, members: Set<socketId> }
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    // Track room membership; first to join is the admin
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { adminSocketId: socket.id, members: new Set() });
      console.log(`${socket.id} is admin of room ${roomId}`);
    }
    rooms.get(roomId).members.add(socket.id);

    // Tell this client whether they are the admin
    const isAdmin = rooms.get(roomId).adminSocketId === socket.id;
    socket.emit('room-role', { isAdmin });

    // Initialize Yjs doc for this room if it doesn't exist
    if (!docs.has(roomId)) {
      docs.set(roomId, new Y.Doc());
    }
    const doc = docs.get(roomId);
    const stateVector   = Y.encodeStateVector(doc);
    const stateAsUpdate = Y.encodeStateAsUpdate(doc);
    socket.emit('sync-step-1', stateVector, stateAsUpdate);
  });

  // ── Yjs sync ─────────────────────────────────────────────────────────────
  // Payload: { fileName, update } tagged so receivers know which file changed
  socket.on('sync-update', (roomId, payload) => {
    const doc = docs.get(roomId);
    if (doc) {
      const updateArray = new Uint8Array(payload.update ?? payload);
      try { Y.applyUpdate(doc, updateArray); } catch (_) {}
      socket.to(roomId).emit('sync-update', payload);
    }
  });

  // ── Awareness (cursors) ──────────────────────────────────────────────────
  socket.on('awareness-update', (roomId, awarenessUpdate) => {
    socket.to(roomId).emit('awareness-update', awarenessUpdate);
  });

  // ── File/folder tree structural changes (add / delete) ───────────────────
  // Payload: { op: 'add'|'delete', path, node?, extraPaths? }
  socket.on('tree-change', (roomId, payload) => {
    // Just relay to all other clients in the room — no server-side state needed
    socket.to(roomId).emit('tree-change', payload);
  });

  // ── Edit access request flow ──────────────────────────────────────────────
  // Guest → Server → Admin
  socket.on('request-edit', ({ roomId, requesterName }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const adminId = room.adminSocketId;
    console.log(`Edit request from ${socket.id} (${requesterName}) in room ${roomId} → admin ${adminId}`);
    io.to(adminId).emit('edit-request', {
      requesterSocketId: socket.id,
      requesterName,
      roomId,
    });
  });

  // Admin approves → notify guest
  socket.on('grant-edit', ({ requesterSocketId, roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.adminSocketId !== socket.id) return; // only admin can grant
    console.log(`Admin granted edit to ${requesterSocketId} in room ${roomId}`);
    io.to(requesterSocketId).emit('edit-granted');
  });

  // Admin denies → notify guest
  socket.on('deny-edit', ({ requesterSocketId, roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.adminSocketId !== socket.id) return;
    console.log(`Admin denied edit to ${requesterSocketId} in room ${roomId}`);
    io.to(requesterSocketId).emit('edit-denied');
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    rooms.forEach((room, roomId) => {
      room.members.delete(socket.id);
      // If admin left, promote next member
      if (room.adminSocketId === socket.id) {
        const next = [...room.members][0];
        if (next) {
          room.adminSocketId = next;
          io.to(next).emit('room-role', { isAdmin: true });
          console.log(`New admin of ${roomId}: ${next}`);
        } else {
          rooms.delete(roomId);
          docs.delete(roomId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend Socket.io server running on port ${PORT}`);
});
