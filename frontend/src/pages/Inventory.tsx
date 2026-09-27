// Inventory.tsx - Live inventory stock overview and management
import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { IconCheck } from '../components/Icons';

const Inventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [newQty, setNewQty] = useState<number>(0);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      setInventory(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId: number) => {
    setError('');
    setMsg('');
    try {
      await api.patch(`/inventory/${productId}`, { physical_quantity: Number(newQty) });
      setMsg('Stock updated successfully in PostgreSQL');
      setEditId(null);
      fetchInventory();
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update stock');
    }
  };

  // Metrics
  const totalSku = inventory.length;
  const totalPhysical = inventory.reduce((sum, inv) => sum + Number(inv.physical_quantity || 0), 0);
  const totalReserved = inventory.reduce((sum, inv) => sum + Number(inv.reserved_quantity || 0), 0);
  const totalAvailable = inventory.reduce((sum, inv) => sum + Number(inv.available_quantity || 0), 0);

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Inventory & Stock Levels</h1>
          <p>
            Real-time stock computation: <strong>Available Quantity = Physical Quantity - Reserved Quantity</strong>
          </p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">🏷️</div>
          <div className="stat-info">
            <span className="stat-label">Total SKUs</span>
            <span className="stat-value">{totalSku}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">🏬</div>
          <div className="stat-info">
            <span className="stat-label">Physical Warehouse</span>
            <span className="stat-value">{totalPhysical} units</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">🔒</div>
          <div className="stat-info">
            <span className="stat-label">Reserved for Orders</span>
            <span className="stat-value">{totalReserved} units</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✨</div>
          <div className="stat-info">
            <span className="stat-label">Available for Sale</span>
            <span className="stat-value">{totalAvailable} units</span>
          </div>
        </div>
      </div>

      {msg && <div className="alert alert-success">✓ {msg}</div>}
      {error && <div className="alert alert-danger">⚠ {error}</div>}

      {/* Inventory Table Card */}
      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Product Name</th>
                <th>Physical Stock</th>
                <th>Reserved Stock</th>
                <th>Available Stock</th>
                {user?.role === 'ADMIN' && <th>Warehouse Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Loading live inventory from database...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                inventory.map((inv: any) => (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-mono)' }}>
                        {inv.product_code}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{inv.product_name}</strong>
                    </td>
                    <td>
                      {editId === inv.id ? (
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          style={{ width: '100px', padding: '0.35rem 0.5rem' }}
                          value={newQty}
                          onChange={e => setNewQty(Number(e.target.value))}
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          {inv.physical_quantity}
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: 600, 
                        color: inv.reserved_quantity > 0 ? 'var(--warning-text)' : '#64748b' 
                      }}>
                        {inv.reserved_quantity > 0 ? `🔒 ${inv.reserved_quantity}` : '0'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${inv.available_quantity > 0 ? 'badge-confirmed' : 'badge-rejected'}`}>
                        {inv.available_quantity} Available
                      </span>
                    </td>
                    {user?.role === 'ADMIN' && (
                      <td>
                        {editId === inv.id ? (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateStock(inv.id)}
                            >
                              <IconCheck />
                              <span>Save</span>
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setEditId(inv.id);
                              setNewQty(inv.physical_quantity);
                            }}
                          >
                            Adjust Stock
                          </button>
                        )}
                      </td>
                    )}
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

export default Inventory;
