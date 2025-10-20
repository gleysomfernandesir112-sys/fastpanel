import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import ClientManager from './components/ClientManager';
import SourcePlaylistManager from './components/SourcePlaylistManager'; // Changed this import
import Dashboard from './components/Dashboard';
import ResellerManager from './components/ResellerManager';
import MasterResellerManager from './components/MasterResellerManager';
import ServerManager from './components/ServerManager';
import TokenRegister from './components/auth/TokenRegister';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ApiDocumentation from './components/ApiDocumentation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<TokenRegister />} />

        {/* Protected routes wrapped by ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<ClientManager />} />
            {/* Changed the component for this route */}
            <Route path="playlists" element={<SourcePlaylistManager />} /> 
            <Route path="resellers" element={<ResellerManager />} />
            <Route path="master-resellers" element={<MasterResellerManager />} />
            <Route path="servers" element={<ServerManager />} />
            <Route path="api-docs" element={<ApiDocumentation />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
