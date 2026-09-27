// Inventory.tsx - Warehouse inventory management and stock level tracking
import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Inventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [newQty, setNewQty] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [invRes, prodRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/products'),
      ]);
      setInventory(invRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load inventory', err);
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
      setMsg('Stock level updated successfully in database.');
      setEditId(null);
      fetchInventory();
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update stock');
    }
  };

  // Combine product metadata (category, unit, price) with inventory
  const combinedInventory = inventory.map(inv => {
    const prod = products.find(p => p.product_code === inv.product_code);
    return {
      ...inv,
      category: prod?.category || 'General',
      unit: prod?.unit || 'Pieces',
      base_price: prod?.base_price || 0,
    };
  });

  const filteredInventory = combinedInventory.filter(item => 
    item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock & Availability</h1>
          <p className="page-description">
            Live Warehouse Inventory: Available Stock = Physical Warehouse Quantity - Reserved for Confirmed Orders
          </p>
        </div>
      </div>

      {msg && <div className="app-alert app-alert-success">{msg}</div>}
      {error && <div className="app-alert app-alert-danger">{error}</div>}

      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="search-input-group">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by Product Code, Name, Category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="records-count">
          Showing {filteredInventory.length} of {inventory.length} products
        </div>
      </div>

      {/* Inventory Table */}
      <div className="table-wrapper attached-to-toolbar">
        <table>
          <thead>
            <tr>
              <th>SKU Code</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th className="text-right">Base Price (₹)</th>
              <th className="text-right">Physical Stock</th>
              <th className="text-right">Reserved Stock</th>
              <th className="text-right">Available Stock</th>
              {user?.role === 'ADMIN' && <th>Warehouse Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>
                  Loading warehouse stock data...
                </td>
              </tr>
            ) : filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                  No inventory records match the search filter.
                </td>
              </tr>
            ) : (
              filteredInventory.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="code-cell">{inv.product_code}</td>
                  <td><strong>{inv.product_name}</strong></td>
                  <td>{inv.category}</td>
                  <td>{inv.unit}</td>
                  <td className="text-right code-cell">₹{Number(inv.base_price).toFixed(2)}</td>
                  <td className="text-right">
                    {editId === inv.id ? (
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        style={{ width: '80px', display: 'inline-block', padding: '0.2rem 0.35rem', textAlign: 'right' }}
                        value={newQty}
                        onChange={e => setNewQty(Number(e.target.value))}
                      />
                    ) : (
                      <strong>{inv.physical_quantity}</strong>
                    )}
                  </td>
                  <td className="text-right" style={{ color: inv.reserved_quantity > 0 ? 'var(--status-pending-text)' : 'inherit', fontWeight: inv.reserved_quantity > 0 ? 700 : 400 }}>
                    {inv.reserved_quantity}
                  </td>
                  <td className="text-right">
                    <span 
                      className={`status-tag ${inv.available_quantity > 0 ? 'status-accepted' : 'status-rejected'}`}
                      style={{ minWidth: '40px', textAlign: 'center' }}
                    >
                      {inv.available_quantity} {inv.unit}
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
                          Adjust
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
