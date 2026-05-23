import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SpaceBackground from './components/SpaceBackground';
import LandingPage from './components/LandingPage';
import EditorPage from './components/EditorPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      {/* SpaceBackground placed outside Routes to persist continuously during navigation */}
      <SpaceBackground />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
