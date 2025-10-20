import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Button } from 'react-bootstrap';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarToggled(!isSidebarToggled);
  };

  return (
    <div className="dashboard-layout">
      <Button variant="dark" className="mobile-menu-toggle" onClick={toggleSidebar}>
        ☰
      </Button>
      <Sidebar />
      <main className="content-wrapper">
        <Outlet /> {/* Child routes will be rendered here */}
      </main>
    </div>
  );
};

export default DashboardLayout;
