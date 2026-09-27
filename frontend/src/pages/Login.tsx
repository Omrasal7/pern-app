// Login.tsx - Clean internal business application login
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
    <div className="login-screen">
      <div className="login-form-box">
        <h1 className="login-app-title">Manufacturing ERP</h1>
        <p className="login-app-subtitle">Employee Access Portal</p>
        
        {error && <div className="app-alert app-alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
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
            style={{ width: '100%', marginTop: '0.65rem', padding: '0.55rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="login-demo-helper">
          <div style={{ fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
            Demo User Accounts:
          </div>
          
          <button 
            type="button" 
            className="demo-role-btn"
            onClick={() => handleFillDemo('sales@example.com', 'sales123')}
          >
            <span><strong>Sales User</strong></span>
            <code style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>sales@example.com / sales123</code>
          </button>

          <button 
            type="button" 
            className="demo-role-btn"
            onClick={() => handleFillDemo('admin@example.com', 'admin123')}
          >
            <span><strong>Admin User</strong></span>
            <code style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>admin@example.com / admin123</code>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
