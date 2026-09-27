// Enquiries.tsx - Customer requirements and enquiry management
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

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form state
  const [form, setForm] = useState({
    enquiry_number: `ENQ-${Date.now().toString().slice(-5)}`,
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
      console.error('Failed to load enquiries', err);
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

      setSuccessMsg('Enquiry record successfully created.');
      setShowForm(false);
      setForm({
        enquiry_number: `ENQ-${Date.now().toString().slice(-5)}`,
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

  // Filtered List
  const filteredEnquiries = enquiries.filter(enq => {
    const matchesSearch = 
      enq.enquiry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enq.customer?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enq.customer?.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || enq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Enquiries</h1>
          <p className="page-description">Manage customer procurement requests and required product quantities</p>
        </div>
        {user?.role === 'SALES' && (
          <button 
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => { setShowForm(!showForm); setError(''); }}
          >
            {showForm ? 'Close Form' : '+ New Enquiry'}
          </button>
        )}
      </div>

      {successMsg && <div className="app-alert app-alert-success">{successMsg}</div>}
      {error && !showForm && <div className="app-alert app-alert-danger">{error}</div>}

      {/* Real-world Business Form */}
      {showForm && (
        <div className="section-panel">
          <div className="section-header">
            <span className="section-heading">New Enquiry Registration</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>* Required Fields</span>
          </div>

          {error && <div className="app-alert app-alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* 1. Customer Information Section */}
            <div className="section-subheading" style={{ marginTop: '0.25rem' }}>
              1. Customer Information
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-body)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <input 
                  type="checkbox" 
                  checked={form.newCustomer}
                  onChange={e => setForm({ ...form, newCustomer: e.target.checked })} 
                />
                Register New Customer Company
              </label>
            </div>

            {!form.newCustomer ? (
              <div className="form-group" style={{ maxWidth: '420px' }}>
                <label className="form-label">Select Customer *</label>
                <select 
                  className="form-control" 
                  value={form.customer_id}
                  onChange={e => setForm({ ...form, customer_id: e.target.value })} 
                  required
                >
                  <option value="">-- Select Existing Customer --</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.contact_person}, {c.city})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-grid-3" style={{ background: '#f8fafc', padding: '0.75rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input 
                    className="form-control" 
                    placeholder="e.g. Metro Industrial Solutions" 
                    value={form.company_name}
                    onChange={e => setForm({ ...form, company_name: e.target.value })} 
                    required={form.newCustomer} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person *</label>
                  <input 
                    className="form-control" 
                    placeholder="e.g. Suresh Patel" 
                    value={form.contact_person}
                    onChange={e => setForm({ ...form, contact_person: e.target.value })} 
                    required={form.newCustomer} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input 
                    className="form-control" 
                    placeholder="e.g. 9876543210" 
                    value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value })} 
                    required={form.newCustomer} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="suresh@metroind.com" 
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    required={form.newCustomer} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City / Location *</label>
                  <input 
                    className="form-control" 
                    placeholder="e.g. Pune" 
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })} 
                    required={form.newCustomer} 
                  />
                </div>
              </div>
            )}

            {/* 2. Enquiry Details Section */}
            <div className="section-subheading">
              2. Enquiry Schedule
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Enquiry Reference No. *</label>
                <input 
                  type="text"
                  className="form-control" 
                  value={form.enquiry_number}
                  onChange={e => setForm({ ...form, enquiry_number: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Required Delivery By Date *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={form.required_date}
                  onChange={e => setForm({ ...form, required_date: e.target.value })} 
                  required 
                />
              </div>
            </div>

            {/* 3. Requested Products Section */}
            <div className="section-subheading">
              3. Products & Required Quantities
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr auto', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <span>Product</span>
                <span>Quantity</span>
                <span>Action</span>
              </div>

              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr auto', gap: '0.5rem', marginBottom: '0.45rem', alignItems: 'center' }}>
                  <select 
                    className="form-control" 
                    value={item.product_id}
                    onChange={e => updateItem(i, 'product_id', e.target.value)} 
                    required
                  >
                    <option value="">-- Choose Product SKU --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.product_code} — {p.name} ({p.unit})
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
                    required 
                  />

                  {items.length > 1 ? (
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => removeItem(i)}
                      style={{ color: 'var(--status-danger-text)' }}
                    >
                      Remove
                    </button>
                  ) : <div style={{ width: '56px' }}></div>}
                </div>
              ))}

              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                style={{ marginTop: '0.35rem' }}
                onClick={addItem}
              >
                + Add Product Line
              </button>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notes & Specifications (Optional)</label>
              <textarea 
                className="form-control" 
                rows={2} 
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} 
                placeholder="Technical specifications, special packaging instructions, etc."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-divider)' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Create Enquiry'}
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

      {/* Toolbar / Search Filter */}
      <div className="toolbar-bar">
        <div className="search-input-group">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by Enquiry No, Customer, City..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select 
            className="form-control" 
            style={{ width: '140px', padding: '0.35rem 0.5rem' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="QUOTED">QUOTED</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
          </select>

          <span className="records-count">
            Showing {filteredEnquiries.length} of {enquiries.length} enquiries
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper attached-to-toolbar">
        <table>
          <thead>
            <tr>
              <th>Enquiry No.</th>
              <th>Customer</th>
              <th>Enquiry Date</th>
              <th>Required By</th>
              <th>Requested Products</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr>
                <td colSpan={6} className="text-center" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>
                  Loading enquiries...
                </td>
              </tr>
            ) : filteredEnquiries.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                  No customer enquiries match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredEnquiries.map((enq: any) => (
                <tr key={enq.id}>
                  <td className="code-cell">{enq.enquiry_number}</td>
                  <td>
                    <strong>{enq.customer?.company_name || 'N/A'}</strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {enq.customer?.contact_person} • {enq.customer?.city}
                    </div>
                  </td>
                  <td>{new Date(enq.enquiry_date).toLocaleDateString()}</td>
                  <td>{new Date(enq.required_date).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      {enq.items?.map((item: any) => `${item.product?.name} (${item.quantity} ${item.product?.unit || ''})`).join(', ') || '-'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-tag status-${enq.status.toLowerCase()}`}>
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
