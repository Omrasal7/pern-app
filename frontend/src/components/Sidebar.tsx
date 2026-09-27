// Sidebar.tsx - Modern sidebar with brand icon, navigation links and user card
import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { IconEnquiry, IconQuotation, IconSalesOrder, IconInventory, IconLogout } from './Icons';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : (user.role === 'ADMIN' ? 'A' : 'S');
  const isAdmin = user.role === 'ADMIN';

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">E</div>
        <div className="brand-text">
          <h1>PERN ERP</h1>
          <p>Supply & Manufacturing</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Modules</div>

        <NavLink 
          to="/enquiries" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <IconEnquiry />
          <span>Customer Enquiries</span>
        </NavLink>

        <NavLink 
          to="/quotations" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <IconQuotation />
          <span>Quotations</span>
        </NavLink>

        <NavLink 
          to="/sales-orders" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <IconSalesOrder />
          <span>Sales Orders</span>
        </NavLink>

        <div className="nav-section-label" style={{ marginTop: '0.5rem' }}>Inventory</div>

        <NavLink 
          to="/inventory" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <IconInventory />
          <span>Stock & Availability</span>
        </NavLink>
      </nav>

      {/* Footer / User Profile */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{userInitial}</div>
          <div className="user-meta">
            <div className="user-name">{user.name || user.email || 'Current User'}</div>
            <div className={`user-role-badge ${isAdmin ? 'role-admin' : 'role-sales'}`}>
              <span className="status-dot"></span>
              {user.role}
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          className="btn btn-secondary btn-sm" 
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <IconLogout />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
