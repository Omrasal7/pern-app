// Login.tsx - Clean authentication screen with test account helpers
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
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>PERN ERP System</h2>
          <p>Sign in to access your account</p>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
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
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-credentials">
          <strong>Test Credentials (Click to fill):</strong>
          <div 
            className="demo-row" 
            style={{ cursor: 'pointer', padding: '0.2rem 0' }}
            onClick={() => handleFillDemo('sales@example.com', 'sales123')}
            title="Click to fill Sales login"
          >
            <span>Sales User:</span>
            <code>sales@example.com / sales123</code>
          </div>
          <div 
            className="demo-row" 
            style={{ cursor: 'pointer', padding: '0.2rem 0' }}
            onClick={() => handleFillDemo('admin@example.com', 'admin123')}
            title="Click to fill Admin login"
          >
            <span>Admin User:</span>
            <code>admin@example.com / admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
