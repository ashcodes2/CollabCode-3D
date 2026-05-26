# 🌐 CollabCode 3D — Real-Time 3D Collaborative Code Editor

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Three.js](https://img.shields.io/badge/Three.js-r184-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Yjs CRDT](https://img.shields.io/badge/Yjs-CRDT-orange?style=for-the-badge)](https://yjs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://client-sigma-murex.vercel.app)

## 🌍 Live Demo

| Service | URL |
| :--- | :--- |
| 🌐 **Frontend (Vercel)** | [https://client-sigma-murex.vercel.app](https://client-sigma-murex.vercel.app) |
| ⚙️ **Backend (Railway)** | [https://collabcode-3d-backend-production.up.railway.app](https://collabcode-3d-backend-production.up.railway.app) |
| 📦 **GitHub Repository** | [https://github.com/ashcodes2/CollabCode-3D](https://github.com/ashcodes2/CollabCode-3D) |

---

CollabCode 3D is a highly immersive, production-grade **3D Collaborative Code Editor**. It features an elegant real-time Monaco-based editor integrated with Yjs conflict-free replicated data types (CRDTs) alongside a breathtaking interactive 3D visual workspace where multiple developers can interact, visually coordinate, and pair program in a shared virtual room.

---

## ✨ Key Features

* 🚀 **Real-Time Collaborative Editing**: Powered by Yjs CRDTs and Monaco Editor for frictionless, conflict-free simultaneous code editing with multi-client synchronization.
* 👥 **Immersive 3D Visual Workspace**: Fully-featured 3D scene built with Three.js (React Three Fiber & Drei) where developers are visually represented, enhancing presence and spatial awareness.
* 📍 **Live Cursor & Selection Awareness**: Real-time cursor positions and active text selections are styled and synced instantly across all peers.
* 🛡️ **Role-Based Admin Approvals**: Granular administrative authorization control. Admins can grant or deny edit permissions dynamically for guests in the workspace.
* ⚡ **Live Code Execution**: Direct execution of code snippets via integrated sandboxed compilation (JDoodle API support) with live terminal output.
* 🔐 **Secure Authentication & Persistence**: Robust JWT-based authorization, user login/signup, and project persistence backed by MongoDB.
* 📁 **Shared File System Tree**: Collaborative real-time creation, editing, and deletion of files and folders synced dynamically across all active clients.

---

## 🏗️ System Architecture & Sync Flow

The application synchronizes standard editing inputs using Yjs CRDTs via Socket.io relay rooms. Admin permission requests and spatial awareness updates are managed as isolated, highly optimized WebSocket events.

```mermaid
graph TD
    subgraph Client Space (Multiple Peers)
        C1[Client 1 - React/Monaco] <-->|Y-Monaco Binding| Y1[Yjs CRDT Doc]
        C2[Client 2 - React/Monaco] <-->|Y-Monaco Binding| Y2[Yjs CRDT Doc]
        C1 -.->|Request Edit Permission| S
        C2 -.->|Spatial Avatar Movements| S
    end

    subgraph Communication Layer
        Y1 <-->|sync-update| S(Express + Socket.io Server)
        Y2 <-->|sync-update| S
    end

    subgraph Backend & DB
        S <-->|Mongoose ODM| DB[(MongoDB)]
        S -->|Execute Snippet| JD[JDoodle API]
    end

    style C1 fill:#58a6ff,stroke:#1f6feb,stroke-width:2px,color:#fff
    style C2 fill:#58a6ff,stroke:#1f6feb,stroke-width:2px,color:#fff
    style Y1 fill:#d29922,stroke:#bb8009,stroke-width:2px,color:#fff
    style Y2 fill:#d29922,stroke:#bb8009,stroke-width:2px,color:#fff
    style S fill:#238636,stroke:#2ea043,stroke-width:2px,color:#fff
    style DB fill:#8b949e,stroke:#484f58,stroke-width:2px,color:#fff
```

---

## 📂 Repository Directory Layout

```text
├── client/                     # Front-end React Application
│   ├── src/                    # Source files
│   │   ├── components/         # Monaco editor, 3D Canvas, UI panels, etc.
│   │   ├── App.jsx             # Root layout and router bindings
│   │   └── main.jsx            # Entry point
│   ├── public/                 # Static assets (3D textures, models)
│   ├── .env.example            # Client-side configuration template
│   └── package.json            # Client packages & scripts
├── server/                     # Back-end Node/Express Server
│   ├── models/                 # Mongoose Schemas (User, Project)
│   ├── routes/                 # Express API endpoints (Auth, Projects, Execution)
│   │   ├── auth.js
│   │   ├── execute.js
│   │   └── projects.js
│   ├── server.js               # Express & Socket.io server entry point
│   ├── .env.example            # Server-side configuration template
│   └── package.json            # Server packages & scripts
├── .gitignore                  # Main Git ignore configuration
├── package.json                # Root package.json managing concurrent execution
└── README.md                   # Comprehensive project documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
* **Node.js** (v18.x or v20.x recommended)
* **MongoDB** (local database running on default port `27017` or a MongoDB Atlas URI)

### Quick Start Guide

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ashcodes2/CollabCode-3D.git
   cd CollabCode-3D
   ```

2. **Install All Dependencies**
   Run the utility script in the root directory to install front-end, back-end, and root packages in one step:
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables**
   * **Backend**: Copy the environment template in the `server/` directory and configure your keys:
     ```bash
     cp server/.env.example server/.env
     ```
   * **Frontend**: Copy the environment template in the `client/` directory:
     ```bash
     cp client/.env.example client/.env
     ```

4. **Run the Development Workspace**
   Launch both the Express backend and Vite frontend concurrently using:
   ```bash
   npm start
   ```
   * Client: [http://localhost:5173](http://localhost:5173)
   * Server: [http://localhost:3001](http://localhost:3001)

---

## 🔒 Configuration Variables Reference

### Backend (`server/.env`)
| Variable Name | Purpose | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Local server port for Express and WebSockets | `3001` |
| `JWT_SECRET` | Secret key used to encrypt Auth tokens | `super-secret-change-me` |
| `MONGODB_URI` | Standard URI for your Mongo database connection | `mongodb://127.0.0.1:27017/collab-editor` |
| `JDOODLE_CLIENT_ID` | Client ID for compiling snippets | *(Obtain from JDoodle)* |
| `JDOODLE_CLIENT_SECRET` | Client secret key for compiling snippets | *(Obtain from JDoodle)* |

### Frontend (`client/.env`)
| Variable Name | Purpose | Default |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | Complete HTTP endpoint linking backend API services | `http://localhost:3001` |

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
