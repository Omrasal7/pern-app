// SalesOrders.tsx - Sales order processing, inventory reservation, and dispatch
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

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
      console.error('Failed to load sales orders', err);
    } finally {
      setTableLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    setError('');
    setSuccessMsg('');
    try {
      await api.post(`/sales-orders/${id}/confirm`);
      setSuccessMsg('Sales order confirmed! Stock reserved in database.');
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
        dispatch_number: `DSP-${Date.now().toString().slice(-5)}`,
        vehicle_number: dispatchModal.vehicle,
        driver_name: dispatchModal.driver,
      });

      setSuccessMsg('Sales order dispatched! Inventory updated in transaction.');
      setDispatchModal({ orderId: null, vehicle: '', driver: '' });
      fetchOrders();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to dispatch order');
    }
  };

  // Filtered List
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-description">Manage confirmed customer orders, perform inventory reservations, and dispatch shipments</p>
        </div>
      </div>

      {successMsg && <div className="app-alert app-alert-success">{successMsg}</div>}
      {error && <div className="app-alert app-alert-danger">{error}</div>}

      {/* Dispatch Details Panel */}
      {dispatchModal.orderId && (
        <div className="section-panel" style={{ borderLeft: '4px solid #15803d', background: '#f0fdf4' }}>
          <div className="section-header">
            <span className="section-heading" style={{ color: '#15803d' }}>
              Dispatch Processing — Order #{orders.find(o => o.id === dispatchModal.orderId)?.order_number}
            </span>
          </div>

          <form onSubmit={handleDispatch}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Vehicle Registration Number *</label>
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
                <label className="form-label">Driver Full Name *</label>
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
                Complete & Record Dispatch
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

      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="search-input-group">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by Order No, Customer, Location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select 
            className="form-control" 
            style={{ width: '150px', padding: '0.35rem 0.5rem' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="DISPATCHED">DISPATCHED</option>
          </select>

          <span className="records-count">
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper attached-to-toolbar">
        <table>
          <thead>
            <tr>
              <th>Order No.</th>
              <th>Order Date</th>
              <th>Customer</th>
              <th>Ordered Products</th>
              <th className="text-right">Total Amount (₹)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr>
                <td colSpan={7} className="text-center" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>
                  Loading sales orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                  No sales orders found. Convert an <strong>ACCEPTED</strong> quotation to generate a new order.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order: any) => (
                <tr key={order.id}>
                  <td className="code-cell">{order.order_number}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>
                    <strong>{order.customer?.company_name || 'N/A'}</strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {order.customer?.city}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      {order.items?.map((item: any) => `${item.product?.name} (Qty: ${item.quantity})`).join(', ') || '-'}
                    </div>
                  </td>
                  <td className="text-right code-cell">
                    ₹{Number(order.total_amount || 0).toFixed(2)}
                  </td>
                  <td>
                    <span className={`status-tag status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {user?.role === 'ADMIN' && order.status === 'PENDING' && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleConfirm(order.id)}
                          title="Verify stock and reserve required quantity"
                        >
                          Confirm & Reserve
                        </button>
                      )}

                      {user?.role === 'ADMIN' && order.status === 'CONFIRMED' && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => setDispatchModal({ orderId: order.id, vehicle: '', driver: '' })}
                        >
                          Dispatch Order
                        </button>
                      )}

                      {order.status === 'DISPATCHED' && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--status-success-text)', fontWeight: 600 }}>
                          ✓ Dispatched
                        </span>
                      )}

                      {user?.role === 'SALES' && order.status === 'PENDING' && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Pending Admin
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
