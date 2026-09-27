// SalesOrders.tsx - Manage sales orders, stock reservation, and dispatch
import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { IconCheck, IconTruck } from '../components/Icons';

const SalesOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [dispatchModal, setDispatchModal] = useState<{ orderId: number | null; vehicle: string; driver: string }>({
    orderId: null,
    vehicle: '',
    driver: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setTableLoading(true);
    try {
      const res = await api.get('/sales-orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch sales orders', err);
    } finally {
      setTableLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    setError('');
    setSuccessMsg('');
    try {
      await api.post(`/sales-orders/${id}/confirm`);
      setSuccessMsg('Sales Order confirmed! Stock atomically reserved in PostgreSQL.');
      fetchOrders();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm order');
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModal.orderId) return;
    setError('');
    setSuccessMsg('');

    try {
      await api.post(`/sales-orders/${dispatchModal.orderId}/dispatch`, {
        dispatch_number: `DSP-${Date.now().toString().slice(-6)}`,
        vehicle_number: dispatchModal.vehicle,
        driver_name: dispatchModal.driver,
      });

      setSuccessMsg('Sales Order dispatched! Physical and reserved inventory deducted in transaction.');
      setDispatchModal({ orderId: null, vehicle: '', driver: '' });
      fetchOrders();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to dispatch order');
    }
  };

  // Metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED').length;
  const dispatchedOrders = orders.filter(o => o.status === 'DISPATCHED').length;

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Sales Orders</h1>
          <p>Fulfill accepted customer orders, perform inventory reservations, and manage dispatch</p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📦</div>
          <div className="stat-info">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{totalOrders}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">⏳</div>
          <div className="stat-info">
            <span className="stat-label">Pending Approval</span>
            <span className="stat-value">{pendingOrders}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">🔒</div>
          <div className="stat-info">
            <span className="stat-label">Stock Reserved</span>
            <span className="stat-value">{confirmedOrders}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">🚛</div>
          <div className="stat-info">
            <span className="stat-label">Dispatched</span>
            <span className="stat-value">{dispatchedOrders}</span>
          </div>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">✓ {successMsg}</div>}
      {error && <div className="alert alert-danger">⚠ {error}</div>}

      {/* Dispatch Modal Box */}
      {dispatchModal.orderId && (
        <div className="card" style={{ borderColor: 'var(--success-border)', background: 'var(--success-bg)' }}>
          <div className="card-header" style={{ borderBottomColor: 'var(--success-border)' }}>
            <h2 className="card-title" style={{ color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconTruck />
              <span>Dispatch Process for Order #{orders.find(o => o.id === dispatchModal.orderId)?.order_number}</span>
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--success-text)', fontWeight: 600 }}>PostgreSQL Transaction</span>
          </div>

          <form onSubmit={handleDispatch}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--success-text)' }}>Vehicle / Transport Number *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. MH-04-AB-1234"
                  value={dispatchModal.vehicle}
                  onChange={e => setDispatchModal({ ...dispatchModal, vehicle: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--success-text)' }}>Driver Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Rajesh Kumar"
                  value={dispatchModal.driver}
                  onChange={e => setDispatchModal({ ...dispatchModal, driver: e.target.value })}
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-success">
                <IconTruck />
                <span>Confirm & Complete Dispatch</span>
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setDispatchModal({ orderId: null, vehicle: '', driver: '' })}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales Orders Table Card */}
      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Order No.</th>
                <th>Order Date</th>
                <th>Customer Name</th>
                <th>Products & Quantities</th>
                <th>Order Total</th>
                <th>Status</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Loading sales orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No sales orders found. Convert an <strong>ACCEPTED</strong> quotation to generate one.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-mono)' }}>
                        {order.order_number}
                      </span>
                    </td>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.customer?.company_name || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.city}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                        {order.items?.map((item: any) => `${item.product?.name} (Qty: ${item.quantity})`).join(', ') || 'None'}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                        ₹{Number(order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge badge-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {user?.role === 'ADMIN' && order.status === 'PENDING' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConfirm(order.id)}
                            title="Check available stock and reserve atomically"
                          >
                            <IconCheck />
                            <span>Confirm & Reserve</span>
                          </button>
                        )}

                        {user?.role === 'ADMIN' && order.status === 'CONFIRMED' && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => setDispatchModal({ orderId: order.id, vehicle: '', driver: '' })}
                          >
                            <IconTruck />
                            <span>Dispatch Order</span>
                          </button>
                        )}

                        {order.status === 'DISPATCHED' && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--success-text)', fontWeight: 600 }}>
                            ✓ Fulfilled & Dispatched
                          </span>
                        )}

                        {user?.role === 'SALES' && order.status === 'PENDING' && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Awaiting Admin Approval
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesOrders;
