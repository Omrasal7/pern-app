// SalesOrders.tsx - Manage sales orders, stock reservation, and dispatch
import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

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
      setSuccessMsg('Sales Order confirmed! Inventory reserved.');
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

      setSuccessMsg('Sales Order dispatched! Stock deducted from inventory.');
      setDispatchModal({ orderId: null, vehicle: '', driver: '' });
      fetchOrders();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to dispatch order');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-description">Confirm orders to reserve inventory, and dispatch products</p>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Dispatch Box */}
      {dispatchModal.orderId && (
        <div className="content-box" style={{ borderColor: '#86efac', background: '#f0fdf4' }}>
          <h2 className="box-title" style={{ color: '#166534' }}>
            Dispatch Order #{orders.find(o => o.id === dispatchModal.orderId)?.order_number}
          </h2>

          <form onSubmit={handleDispatch}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Vehicle Number</label>
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
                <label className="form-label">Driver Name</label>
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

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-success">
                Confirm Dispatch
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

      {/* Sales Orders Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Ordered Products</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  Loading sales orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  No sales orders found.
                </td>
              </tr>
            ) : (
              orders.map((order: any) => (
                <tr key={order.id}>
                  <td><strong>{order.order_number}</strong></td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>{order.customer?.company_name || 'N/A'}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {order.items?.map((item: any) => `${item.product?.name} (Qty: ${item.quantity})`).join(', ') || '-'}
                  </td>
                  <td><strong>₹{Number(order.total_amount || 0).toFixed(2)}</strong></td>
                  <td>
                    <span className={`badge badge-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {user?.role === 'ADMIN' && order.status === 'PENDING' && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleConfirm(order.id)}
                        >
                          Confirm & Reserve
                        </button>
                      )}

                      {user?.role === 'ADMIN' && order.status === 'CONFIRMED' && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => setDispatchModal({ orderId: order.id, vehicle: '', driver: '' })}
                        >
                          Dispatch
                        </button>
                      )}

                      {order.status === 'DISPATCHED' && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--success-text)', fontWeight: 600 }}>
                          Dispatched
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
  );
};

export default SalesOrders;
