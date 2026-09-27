// Inventory.tsx - Live inventory stock overview and management
import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

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
      setMsg('Stock updated successfully');
      setEditId(null);
      fetchInventory();
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update stock');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Stock</h1>
          <p className="page-subtitle">
            Available Quantity = Physical Quantity - Reserved Quantity
          </p>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Physical Qty</th>
              <th>Reserved Qty</th>
              <th>Available Qty</th>
              {user?.role === 'ADMIN' && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  Loading inventory data...
                </td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  No inventory records found.
                </td>
              </tr>
            ) : (
              inventory.map((inv: any) => (
                <tr key={inv.id}>
                  <td><strong>{inv.product_code}</strong></td>
                  <td>{inv.product_name}</td>
                  <td>
                    {editId === inv.id ? (
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        style={{ width: '90px', padding: '0.2rem 0.4rem' }}
                        value={newQty}
                        onChange={e => setNewQty(Number(e.target.value))}
                      />
                    ) : (
                      inv.physical_quantity
                    )}
                  </td>
                  <td style={{ color: inv.reserved_quantity > 0 ? 'var(--warning-text)' : 'inherit' }}>
                    {inv.reserved_quantity}
                  </td>
                  <td>
                    <strong style={{ color: inv.available_quantity > 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                      {inv.available_quantity}
                    </strong>
                  </td>
                  {user?.role === 'ADMIN' && (
                    <td>
                      {editId === inv.id ? (
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleUpdateStock(inv.id)}
                          >
                            Save
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
                          Update Stock
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
  );
};

export default Inventory;
