// SalesOrders.tsx - Admin confirms & dispatches sales orders.
// Also shows current inventory status.

import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const SalesOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [showInventory, setShowInventory] = useState(false);
  const [dispatchForm, setDispatchForm] = useState<{ orderId: number | null; vehicle: string; driver: string }>({
    orderId: null, vehicle: '', driver: ''
  });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchOrders();
    fetchInventory();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/sales-orders');
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setInventory(res.data);
    } catch (err) { console.error(err); }
  };

  const handleConfirm = async (id: number) => {
    setError('');
    try {
      await api.post(`/sales-orders/${id}/confirm`);
      setMsg('Order confirmed! Inventory reserved.');
      fetchOrders();
      fetchInventory();
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm order');
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/sales-orders/${dispatchForm.orderId}/dispatch`, {
        dispatch_number: `D-${Date.now()}`,
        vehicle_number: dispatchForm.vehicle,
        driver_name: dispatchForm.driver,
      });
      setMsg('Order dispatched! Inventory updated.');
      setDispatchForm({ orderId: null, vehicle: '', driver: '' });
      fetchOrders();
      fetchInventory();
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to dispatch order');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Sales Orders</h2>
        <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
          onClick={() => setShowInventory(!showInventory)}>
          {showInventory ? 'Hide' : 'Show'} Inventory
        </button>
      </div>

      {msg && <div style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{msg}</div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      {/* ── Dispatch Form (shows when admin clicks Dispatch) ── */}
      {dispatchForm.orderId && (
        <div className="card fade-in" style={{ marginBottom: '2rem', borderColor: 'var(--success)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Dispatch Details</h3>
          <form onSubmit={handleDispatch}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Vehicle Number</label>
                <input className="form-control" placeholder="e.g. MH-01-AB-1234" value={dispatchForm.vehicle}
                  onChange={e => setDispatchForm({ ...dispatchForm, vehicle: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Driver Name</label>
                <input className="form-control" placeholder="Driver's full name" value={dispatchForm.driver}
                  onChange={e => setDispatchForm({ ...dispatchForm, driver: e.target.value })} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-success">Confirm Dispatch</button>
              <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                onClick={() => setDispatchForm({ orderId: null, vehicle: '', driver: '' })}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Inventory Panel ── */}
      {showInventory && (
        <div className="card fade-in" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Inventory Availability</h3>
          <table>
            <thead>
              <tr>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Physical Qty</th>
                <th>Reserved Qty</th>
                <th>Available Qty</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((inv: any) => (
                <tr key={inv.id}>
                  <td>{inv.product_code}</td>
                  <td>{inv.product_name}</td>
                  <td>{inv.physical_quantity}</td>
                  <td style={{ color: inv.reserved_quantity > 0 ? 'var(--warning)' : 'inherit' }}>{inv.reserved_quantity}</td>
                  <td style={{ color: inv.available_quantity > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {inv.available_quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sales Orders Table ── */}
      <div className="card table-container fade-in">
        <table>
          <thead>
            <tr>
              <th>Order No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id}>
                <td><strong>{order.order_number}</strong></td>
                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                <td>{order.customer.company_name}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {order.items.map((i: any) => `${i.product.name} ×${i.quantity}`).join(', ')}
                </td>
                <td style={{ color: 'var(--success)' }}>₹{Number(order.total_amount).toFixed(2)}</td>
                <td><span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {user?.role === 'ADMIN' && order.status === 'PENDING' && (
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => handleConfirm(order.id)}>
                        ✓ Confirm & Reserve
                      </button>
                    )}
                    {user?.role === 'ADMIN' && order.status === 'CONFIRMED' && (
                      <button className="btn btn-success" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => setDispatchForm({ orderId: order.id, vehicle: '', driver: '' })}>
                        🚛 Dispatch
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No sales orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesOrders;
