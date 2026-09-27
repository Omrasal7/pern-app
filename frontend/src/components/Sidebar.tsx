// Sidebar.tsx - Authentic business software left navigation
import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">MANUFACTURING ERP</div>
        <div className="sidebar-subtitle">Internal Business Portal</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-label">Work</div>

        <NavLink 
          to="/enquiries" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Enquiries
        </NavLink>

        <NavLink 
          to="/quotations" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Quotations
        </NavLink>

        <NavLink 
          to="/sales-orders" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Sales Orders
        </NavLink>

        <div className="nav-group-label" style={{ marginTop: '0.65rem' }}>Inventory</div>

        <NavLink 
          to="/inventory" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Stock & Availability
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-email">{user.name || user.email}</div>
          <div className="user-role-tag">{user.role}</div>
        </div>

        <button 
          onClick={handleLogout} 
          className="btn btn-secondary btn-sm" 
          style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.76rem' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
