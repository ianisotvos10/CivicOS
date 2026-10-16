import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CitizenPage from './pages/CitizenPage';
import AdminPage from './pages/AdminPage';

export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        {/* Portalul Cetățean - Adresa principală */}
        <Route path="/" element={<CitizenPage />} />
        <Route path="/citizen" element={<CitizenPage />} />
        <Route path="/portal" element={<CitizenPage />} />

        {/* Portalul Administrație - Adresă dedicată exclusiv funcționarilor */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/*" element={<AdminPage />} />

        {/* Rută fallback - Redirecționare automată */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
