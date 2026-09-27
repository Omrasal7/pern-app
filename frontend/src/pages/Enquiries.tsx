// Enquiries.tsx - Shows all enquiries and lets SALES users create new ones.
// An enquiry is when a customer asks about products they need.

import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [form, setForm] = useState({
    enquiry_number: `ENQ-${Date.now()}`,
    customer_id: '',
    required_date: '',
    notes: '',
    // New customer fields (if creating inline)
    newCustomer: false,
    company_name: '',
    contact_person: '',
    mobile: '',
    email: '',
    city: '',
  });

  // Items in the enquiry (which products the customer wants)
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [enqRes, custRes, prodRes] = await Promise.all([
        api.get('/enquiries'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setEnquiries(enqRes.data);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
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
      let customer_id = form.customer_id;

      // If user chose to create a new customer first
      if (form.newCustomer) {
        const custRes = await api.post('/customers', {
          company_name: form.company_name,
          contact_person: form.contact_person,
          mobile: form.mobile,
          email: form.email,
          city: form.city,
        });
        customer_id = custRes.data.id;
      }

      await api.post('/enquiries', {
        enquiry_number: form.enquiry_number,
        customer_id: Number(customer_id),
        required_date: form.required_date,
        notes: form.notes,
        items: items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })),
      });

      setShowForm(false);
      setForm({ ...form, enquiry_number: `ENQ-${Date.now()}`, customer_id: '', required_date: '', notes: '' });
      setItems([{ product_id: '', quantity: 1 }]);
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create enquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Enquiries</h2>
        {user?.role === 'SALES' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Enquiry'}
          </button>
        )}
      </div>

      {/* ── New Enquiry Form ── */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>New Enquiry</h3>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Enquiry Number</label>
                <input className="form-control" value={form.enquiry_number}
                  onChange={e => setForm({ ...form, enquiry_number: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Required By Date</label>
                <input type="date" className="form-control" value={form.required_date}
                  onChange={e => setForm({ ...form, required_date: e.target.value })} required />
              </div>
            </div>

            {/* Customer Selection */}
            <div className="form-group">
              <label className="form-label">Customer</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                  <input type="checkbox" checked={form.newCustomer}
                    onChange={e => setForm({ ...form, newCustomer: e.target.checked })} />
                  Create New Customer
                </label>
              </div>
              {!form.newCustomer ? (
                <select className="form-control" value={form.customer_id}
                  onChange={e => setForm({ ...form, customer_id: e.target.value })} required>
                  <option value="">-- Select Customer --</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.city})</option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input className="form-control" placeholder="Company Name" value={form.company_name}
                    onChange={e => setForm({ ...form, company_name: e.target.value })} required={form.newCustomer} />
                  <input className="form-control" placeholder="Contact Person" value={form.contact_person}
                    onChange={e => setForm({ ...form, contact_person: e.target.value })} required={form.newCustomer} />
                  <input className="form-control" placeholder="Mobile" value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value })} required={form.newCustomer} />
                  <input className="form-control" type="email" placeholder="Email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} required={form.newCustomer} />
                  <input className="form-control" placeholder="City" value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })} required={form.newCustomer} />
                </div>
              )}
            </div>

            {/* Products */}
            <div className="form-group">
              <label className="form-label">Products Required</label>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                  <select className="form-control" value={item.product_id}
                    onChange={e => updateItem(i, 'product_id', e.target.value)} required>
                    <option value="">-- Select Product --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                    ))}
                  </select>
                  <input type="number" className="form-control" placeholder="Qty" min="1" value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)}
                    style={{ maxWidth: '100px' }} required />
                  {items.length > 1 && (
                    <button type="button" className="btn btn-danger"
                      style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}
                      onClick={() => removeItem(i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn" style={{ background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}
                onClick={addItem}>+ Add Product</button>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-control" rows={2} value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Enquiry'}
            </button>
          </form>
        </div>
      )}

      {/* ── Enquiries Table ── */}
      <div className="card table-container fade-in">
        <table>
          <thead>
            <tr>
              <th>Enquiry No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Required By</th>
              <th>Products</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((enq: any) => (
              <tr key={enq.id}>
                <td><strong>{enq.enquiry_number}</strong></td>
                <td>{new Date(enq.enquiry_date).toLocaleDateString()}</td>
                <td>{enq.customer.company_name}</td>
                <td>{new Date(enq.required_date).toLocaleDateString()}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {enq.items.map((item: any) => `${item.product.name} ×${item.quantity}`).join(', ')}
                </td>
                <td>
                  <span className={`badge badge-${enq.status.toLowerCase()}`}>{enq.status}</span>
                </td>
              </tr>
            ))}
            {enquiries.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No enquiries yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Enquiries;
