# 💻 CollabCode 3D — Client Application

This directory houses the modern, high-fidelity front-end React client for the 3D Collaborative Code Editor. It provides an immersive 3D paired programming experience, real-time code editing using Yjs CRDTs, awareness cursor telemetry, and customizable panels.

---

## 🛠️ Technology Stack

* **UI Library**: React 19
* **Build System**: Vite 8 (extremely fast build speeds and Hot Module Replacement)
* **Code Editor**: Monaco Editor (via `@monaco-editor/react`)
* **Real-time Sync**: Yjs (Yjs, Y-protocols, and Y-Monaco) + Socket.io-client
* **3D Visualizer**: Three.js, React Three Fiber (`@react-three/fiber`), and Drei (`@react-three/drei`)
* **Transitions & Animations**: Framer Motion
* **Iconography**: Lucide React
* **Layout Structure**: React Resizable Panels

---

## ⚙️ Development Setup

### 1. Installation
Ensure you have run `npm install` within this directory (or used `npm run install-all` from the root).
```bash
npm install
```

### 2. Environment Configurations
Create a `.env` file from the example template:
```bash
cp .env.example .env
```
Ensure `VITE_BACKEND_URL` points to your running backend socket/express server (typically `http://localhost:3001`).

### 3. Available Scripts

* **`npm run dev`**: Starts the local development server at `http://localhost:5173`.
* **`npm run build`**: Compiles the highly-optimized static bundle for production to the `dist/` directory.
* **`npm run preview`**: Serves the compiled production bundle locally for previewing.
* **`npm run lint`**: Inspects code quality and runs static analysis rules via ESLint.

---

## 📂 Key Source Code Structure

```text
client/src/
├── components/
│   ├── EditorPage.jsx          # Primary workspace layout integrating editor & 3D canvas
│   ├── EditorContainer.jsx     # Monaco editor container and CRDT Yjs initialization
│   ├── Canvas3D.jsx            # React Three Fiber canvas handling spatial rendering
│   ├── DeveloperAvatar.jsx     # 3D representation of active collaborative peers
│   ├── Sidebar.jsx             # File explorer tree & connection details panel
│   └── Terminal.jsx            # Output terminal for executing code segments
├── App.jsx                     # Layout setup and system routing bindings
└── main.jsx                    # Root render and styles mount point
```
