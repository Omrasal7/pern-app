// Login.tsx - High-polish authentication screen with demo account quick-fill
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.role, res.data.name);
      navigate('/enquiries');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-logo">E</div>
          <h2>PERN ERP System</h2>
          <p>Manufacturing & Supply Chain Management</p>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. sales@example.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.7rem', marginTop: '0.5rem', fontSize: '0.92rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Account'}
          </button>
        </form>

        <div className="quick-login-box">
          <div className="quick-login-title">
            <span>Quick Login (Demo Roles)</span>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Click to fill</span>
          </div>

          <div className="quick-btn-grid">
            <button 
              type="button" 
              className="quick-role-btn"
              onClick={() => handleFillDemo('sales@example.com', 'sales123')}
            >
              <div className="quick-role-name">
                <span>💼 Sales User</span>
              </div>
              <div className="quick-role-email">sales@example.com</div>
            </button>

            <button 
              type="button" 
              className="quick-role-btn"
              onClick={() => handleFillDemo('admin@example.com', 'admin123')}
            >
              <div className="quick-role-name">
                <span>🛡️ Admin User</span>
              </div>
              <div className="quick-role-email">admin@example.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
