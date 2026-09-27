// Quotations.tsx - Create quotations from enquiries, update status, convert to Sales Order.
// A quotation is a formal price offer to the customer.

import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Quotations = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    quotation_number: `Q-${Date.now()}`,
    enquiry_id: '',
    valid_until: '',
  });

  // Each item: product, qty, discount%, gst%
  const [items, setItems] = useState([
    { product_id: '', quantity: 1, discount_percent: 0, gst_percent: 18 }
  ]);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [qRes, eRes, pRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/enquiries'),
        api.get('/products'),
      ]);
      setQuotations(qRes.data);
      setEnquiries(eRes.data);
      setProducts(pRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, discount_percent: 0, gst_percent: 18 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/quotations', {
        quotation_number: form.quotation_number,
        enquiry_id: Number(form.enquiry_id),
        valid_until: form.valid_until,
        items: items.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          discount_percent: Number(i.discount_percent),
          gst_percent: Number(i.gst_percent),
        })),
      });
      setShowForm(false);
      setMsg('Quotation created successfully!');
      setForm({ quotation_number: `Q-${Date.now()}`, enquiry_id: '', valid_until: '' });
      setItems([{ product_id: '', quantity: 1, discount_percent: 0, gst_percent: 18 }]);
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.patch(`/quotations/${id}/status`, { status });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleConvert = async (id: number) => {
    const order_number = `SO-${Date.now()}`;
    try {
      await api.post(`/quotations/${id}/convert`, { order_number });
      setMsg('Sales Order created successfully!');
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to convert quotation');
    }
  };

  // Calculate a preview total for display
  const calcTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find((p: any) => p.id === Number(item.product_id));
      if (!prod) return sum;
      const base = prod.base_price * item.quantity;
      const afterDiscount = base - base * (item.discount_percent / 100);
      const withGst = afterDiscount + afterDiscount * (item.gst_percent / 100);
      return sum + withGst;
    }, 0);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Quotations</h2>
        {user?.role === 'SALES' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Quotation'}
          </button>
        )}
      </div>

      {msg && <div style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{msg}</div>}

      {/* ── New Quotation Form ── */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>New Quotation</h3>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Quotation Number</label>
                <input className="form-control" value={form.quotation_number}
                  onChange={e => setForm({ ...form, quotation_number: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Against Enquiry</label>
                <select className="form-control" value={form.enquiry_id}
                  onChange={e => setForm({ ...form, enquiry_id: e.target.value })} required>
                  <option value="">-- Select Enquiry --</option>
                  {enquiries.filter((e: any) => e.status === 'NEW' || e.status === 'QUOTED').map((e: any) => (
                    <option key={e.id} value={e.id}>{e.enquiry_number} — {e.customer.company_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Valid Until</label>
                <input type="date" className="form-control" value={form.valid_until}
                  onChange={e => setForm({ ...form, valid_until: e.target.value })} required />
              </div>
            </div>

            {/* Line items */}
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Products & Pricing</label>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Product</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Qty</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discount %</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GST %</span>
                <span></span>
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select className="form-control" value={item.product_id}
                    onChange={e => updateItem(i, 'product_id', e.target.value)} required>
                    <option value="">-- Select Product --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} (Base: ₹{p.base_price})</option>
                    ))}
                  </select>
                  <input type="number" min="1" className="form-control" value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                  <input type="number" min="0" max="100" className="form-control" value={item.discount_percent}
                    onChange={e => updateItem(i, 'discount_percent', e.target.value)} />
                  <input type="number" min="0" max="100" className="form-control" value={item.gst_percent}
                    onChange={e => updateItem(i, 'gst_percent', e.target.value)} />
                  {items.length > 1 && (
                    <button type="button" className="btn btn-danger" style={{ padding: '0.5rem 0.75rem' }}
                      onClick={() => removeItem(i)}>✕</button>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <button type="button" className="btn" style={{ background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}
                  onClick={addItem}>+ Add Line</button>
                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                  Estimated Total: <span style={{ color: 'var(--success)' }}>₹{calcTotal().toFixed(2)}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>(final calculated by server)</span>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Quotation'}
            </button>
          </form>
        </div>
      )}

      {/* ── Quotations Table ── */}
      <div className="card table-container fade-in">
        <table>
          <thead>
            <tr>
              <th>Quote No.</th>
              <th>Enquiry</th>
              <th>Customer</th>
              <th>Total Amount</th>
              <th>Valid Until</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((q: any) => {
              const total = q.items.reduce((s: number, i: any) => s + i.line_amount, 0);
              return (
                <tr key={q.id}>
                  <td><strong>{q.quotation_number}</strong></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{q.enquiry?.enquiry_number}</td>
                  <td>{q.enquiry?.customer?.company_name}</td>
                  <td style={{ color: 'var(--success)' }}>₹{total.toFixed(2)}</td>
                  <td>{new Date(q.valid_until).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${q.status.toLowerCase()}`}>{q.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* SALES can change DRAFT → SENT → ACCEPTED/REJECTED */}
                      {user?.role === 'SALES' && q.status === 'DRAFT' && (
                        <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', background: 'var(--warning)', color: '#000' }}
                          onClick={() => handleStatusChange(q.id, 'SENT')}>Mark Sent</button>
                      )}
                      {user?.role === 'SALES' && q.status === 'SENT' && (
                        <>
                          <button className="btn btn-success" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => handleStatusChange(q.id, 'ACCEPTED')}>Accept</button>
                          <button className="btn btn-danger" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => handleStatusChange(q.id, 'REJECTED')}>Reject</button>
                        </>
                      )}
                      {/* Convert to Sales Order (only when ACCEPTED) */}
                      {user?.role === 'SALES' && q.status === 'ACCEPTED' && (
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => handleConvert(q.id)}>→ Sales Order</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {quotations.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No quotations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Quotations;
