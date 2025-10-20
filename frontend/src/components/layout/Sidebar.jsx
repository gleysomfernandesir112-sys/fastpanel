import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext'; // Import useTheme
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    // Assuming logout logic is in AuthContext, which should be used via useAuth()
    // For now, keeping the simple localStorage removal
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="sidebar">
      <div>
        <div className="sidebar-header">
          FastPanel
        </div>
        <ul className="sidebar-nav">
          <li className="sidebar-nav-item">
            <NavLink to="/" className="sidebar-nav-link" end>
              Dashboard
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/clients" className="sidebar-nav-link">
              Gerenciar Clientes
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/playlists" className="sidebar-nav-link">
              Playlists de Origem
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/resellers" className="sidebar-nav-link">
              Revendedores
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/master-resellers" className="sidebar-nav-link">
              Revendedores Master
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/servers" className="sidebar-nav-link">
              Servidores
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/api-docs" className="sidebar-nav-link">
              Documentação da API
            </NavLink>
          </li>
        </ul>
      </div>

      <ul className="sidebar-footer">
        <li className="sidebar-nav-item">
            <div className="theme-toggle-container" onClick={toggleTheme}>
                <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                <label className="theme-toggle-switch">
                    <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                    <span className="slider"></span>
                </label>
            </div>
        </li>
        <li className="sidebar-nav-item logout-item">
          <button onClick={handleLogout} className="sidebar-nav-link logout-button">
            Sair
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
