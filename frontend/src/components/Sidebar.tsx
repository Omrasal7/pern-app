// Sidebar.tsx - Simple left navigation bar
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
        <h1>PERN ERP System</h1>
        <p>Manufacturing & Supply Chain</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/enquiries" 
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          Customer Enquiries
        </NavLink>

        <NavLink 
          to="/quotations" 
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          Quotations
        </NavLink>

        <NavLink 
          to="/sales-orders" 
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          Sales Orders
        </NavLink>

        <NavLink 
          to="/inventory" 
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          Inventory Stock
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div>{user.name || user.email}</div>
          <span className="role-pill">{user.role}</span>
        </div>

        <button 
          onClick={handleLogout} 
          className="btn btn-secondary btn-sm" 
          style={{ width: '100%' }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
