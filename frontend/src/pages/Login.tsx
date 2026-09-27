// Login.tsx - Clean student project login page
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
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">PERN ERP Application</h2>
        <p className="login-subtitle">Sign in with your assigned role credentials</p>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
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
              placeholder="Enter password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="test-accounts-box">
          <p>Demo Login Accounts (Click to autofill):</p>
          <div 
            className="test-account-row"
            onClick={() => handleFillDemo('sales@example.com', 'sales123')}
          >
            <strong>Sales User:</strong>
            <code>sales@example.com / sales123</code>
          </div>
          <div 
            className="test-account-row"
            onClick={() => handleFillDemo('admin@example.com', 'admin123')}
          >
            <strong>Admin User:</strong>
            <code>admin@example.com / admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
