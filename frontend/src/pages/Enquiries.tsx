// Enquiries.tsx - Manage customer enquiries and product requirements
import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [form, setForm] = useState({
    enquiry_number: `ENQ-${Date.now().toString().slice(-6)}`,
    customer_id: '',
    required_date: '',
    notes: '',
    newCustomer: false,
    company_name: '',
    contact_person: '',
    mobile: '',
    email: '',
    city: '',
  });

  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setTableLoading(true);
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
      console.error('Failed to fetch enquiries data', err);
    } finally {
      setTableLoading(false);
    }
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeItem = (index: number) => setItems(items.filter((_, idx) => idx !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      let customer_id = form.customer_id;

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
        items: items.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
        })),
      });

      setSuccessMsg('Customer enquiry created successfully');
      setShowForm(false);
      setForm({
        enquiry_number: `ENQ-${Date.now().toString().slice(-6)}`,
        customer_id: '',
        required_date: '',
        notes: '',
        newCustomer: false,
        company_name: '',
        contact_person: '',
        mobile: '',
        email: '',
        city: '',
      });
      setItems([{ product_id: '', quantity: 1 }]);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create enquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Enquiries</h1>
          <p className="page-subtitle">Manage customer requirements and initial enquiry records</p>
        </div>
        {user?.role === 'SALES' && (
          <button 
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => { setShowForm(!showForm); setError(''); }}
          >
            {showForm ? 'Close Form' : '+ Create Enquiry'}
          </button>
        )}
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && !showForm && <div className="alert alert-danger">{error}</div>}

      {/* Form Container */}
      {showForm && (
        <div className="card">
          <h2 className="card-title">Create New Customer Enquiry</h2>
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Enquiry Number</label>
                <input 
                  type="text"
                  className="form-control" 
                  value={form.enquiry_number}
                  onChange={e => setForm({ ...form, enquiry_number: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Required Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={form.required_date}
                  onChange={e => setForm({ ...form, required_date: e.target.value })} 
                  required 
                />
              </div>
            </div>

            {/* Customer Section */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Customer</label>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={form.newCustomer}
                    onChange={e => setForm({ ...form, newCustomer: e.target.checked })} 
                    style={{ marginRight: '0.35rem' }}
                  />
                  Add New Customer
                </label>
              </div>

              {!form.newCustomer ? (
                <select 
                  className="form-control" 
                  value={form.customer_id}
                  onChange={e => setForm({ ...form, customer_id: e.target.value })} 
                  required
                >
                  <option value="">-- Select Existing Customer --</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.contact_person} - {c.city})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <input 
                    className="form-control" 
                    placeholder="Company Name" 
                    value={form.company_name}
                    onChange={e => setForm({ ...form, company_name: e.target.value })} 
                    required={form.newCustomer} 
                  />
                  <input 
                    className="form-control" 
                    placeholder="Contact Person" 
                    value={form.contact_person}
                    onChange={e => setForm({ ...form, contact_person: e.target.value })} 
                    required={form.newCustomer} 
                  />
                  <input 
                    className="form-control" 
                    placeholder="Mobile" 
                    value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value })} 
                    required={form.newCustomer} 
                  />
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="Email" 
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    required={form.newCustomer} 
                  />
                  <input 
                    className="form-control" 
                    placeholder="City" 
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })} 
                    required={form.newCustomer} 
                  />
                </div>
              )}
            </div>

            {/* Products List */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Required Products</label>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <select 
                    className="form-control" 
                    value={item.product_id}
                    onChange={e => updateItem(i, 'product_id', e.target.value)} 
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.product_code} - {p.name} ({p.unit})
                      </option>
                    ))}
                  </select>

                  <input 
                    type="number" 
                    min="1" 
                    className="form-control" 
                    placeholder="Qty" 
                    value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)}
                    style={{ width: '100px' }} 
                    required 
                  />

                  {items.length > 1 && (
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => removeItem(i)}
                      title="Remove product"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                style={{ marginTop: '0.25rem' }}
                onClick={addItem}
              >
                + Add Another Product
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea 
                className="form-control" 
                rows={2} 
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} 
                placeholder="Any specific delivery or technical requirements..."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving Enquiry...' : 'Save Enquiry'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enquiries Table */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Enquiry No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Required By</th>
              <th>Requested Products</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  Loading enquiries...
                </td>
              </tr>
            ) : enquiries.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  No customer enquiries found. Click "+ Create Enquiry" to add one.
                </td>
              </tr>
            ) : (
              enquiries.map((enq: any) => (
                <tr key={enq.id}>
                  <td><strong>{enq.enquiry_number}</strong></td>
                  <td>{new Date(enq.enquiry_date).toLocaleDateString()}</td>
                  <td>{enq.customer?.company_name || 'N/A'}</td>
                  <td>{new Date(enq.required_date).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {enq.items?.map((item: any) => `${item.product?.name} (${item.quantity} ${item.product?.unit || ''})`).join(', ') || '-'}
                  </td>
                  <td>
                    <span className={`badge badge-${enq.status.toLowerCase()}`}>
                      {enq.status}
                    </span>
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

export default Enquiries;
