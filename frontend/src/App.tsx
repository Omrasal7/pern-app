// App.tsx - Application routing and base layout
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Enquiries from './pages/Enquiries';
import Quotations from './pages/Quotations';
import SalesOrders from './pages/SalesOrders';
import Inventory from './pages/Inventory';
import PrivateRoute from './components/PrivateRoute';

function MainLayout() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/enquiries" />} />
          <Route path="/enquiries" element={<PrivateRoute><Enquiries /></PrivateRoute>} />
          <Route path="/quotations" element={<PrivateRoute><Quotations /></PrivateRoute>} />
          <Route path="/sales-orders" element={<PrivateRoute><SalesOrders /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/enquiries" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
