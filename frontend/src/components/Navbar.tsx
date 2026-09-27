import { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h2 className="text-gradient" style={{ margin: 0 }}>PERN ERP</h2>
        <div className="nav-links">
          <Link to="/enquiries" className={`nav-link ${isActive('/enquiries')}`}>Enquiries</Link>
          <Link to="/quotations" className={`nav-link ${isActive('/quotations')}`}>Quotations</Link>
          <Link to="/sales-orders" className={`nav-link ${isActive('/sales-orders')}`}>Sales Orders</Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '2rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {user.role}
            </span>
            <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
