// Quotations.tsx - Prepare price quotations and convert to Sales Orders
import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { IconPlus, IconClose, IconCheck } from '../components/Icons';

const Quotations = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    quotation_number: `Q-${Date.now().toString().slice(-6)}`,
    enquiry_id: '',
    valid_until: '',
  });

  const [items, setItems] = useState([
    { product_id: '', quantity: 1, discount_percent: 0, gst_percent: 18 }
  ]);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setTableLoading(true);
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
      console.error('Failed to fetch quotations data', err);
    } finally {
      setTableLoading(false);
    }
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, discount_percent: 0, gst_percent: 18 }]);
  const removeItem = (index: number) => setItems(items.filter((_, idx) => idx !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleEnquiryChange = (enquiryId: string) => {
    setForm({ ...form, enquiry_id: enquiryId });
    const selectedEnq = enquiries.find((e: any) => e.id === Number(enquiryId));
    if (selectedEnq && selectedEnq.items && selectedEnq.items.length > 0) {
      setItems(selectedEnq.items.map((it: any) => ({
        product_id: it.product_id.toString(),
        quantity: it.quantity,
        discount_percent: 0,
        gst_percent: 18,
      })));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await api.post('/quotations', {
        quotation_number: form.quotation_number,
        enquiry_id: Number(form.enquiry_id),
        valid_until: form.valid_until,
        items: items.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          discount_percent: Number(i.discount_percent || 0),
          gst_percent: Number(i.gst_percent || 0),
        })),
      });

      setSuccessMsg('Quotation generated and line amounts validated on backend');
      setShowForm(false);
      setForm({
        quotation_number: `Q-${Date.now().toString().slice(-6)}`,
        enquiry_id: '',
        valid_until: '',
      });
      setItems([{ product_id: '', quantity: 1, discount_percent: 0, gst_percent: 18 }]);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    setError('');
    setSuccessMsg('');
    try {
      await api.patch(`/quotations/${id}/status`, { status });
      setSuccessMsg(`Quotation updated to ${status}`);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleConvert = async (id: number) => {
    setError('');
    setSuccessMsg('');
    const order_number = `SO-${Date.now().toString().slice(-6)}`;
    try {
      await api.post(`/quotations/${id}/convert`, { order_number });
      setSuccessMsg(`Quotation converted to Sales Order: ${order_number}`);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to convert quotation');
    }
  };

  const calculateEstimatedTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find((p: any) => p.id === Number(item.product_id));
      if (!prod) return sum;
      const base = prod.base_price * item.quantity;
      const discount = base * (Number(item.discount_percent || 0) / 100);
      const afterDiscount = base - discount;
      const gst = afterDiscount * (Number(item.gst_percent || 0) / 100);
      return sum + afterDiscount + gst;
    }, 0);
  };

  // Metrics
  const totalCount = quotations.length;
  const draftCount = quotations.filter(q => q.status === 'DRAFT').length;
  const acceptedCount = quotations.filter(q => q.status === 'ACCEPTED').length;
  const totalValue = quotations.reduce((sum, q) => {
    const qTotal = q.items?.reduce((s: number, i: any) => s + Number(i.line_amount || 0), 0) || 0;
    return sum + qTotal;
  }, 0);

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Quotations</h1>
          <p>Create competitive quotations with discount and GST calculations, then convert to Sales Orders</p>
        </div>
        {user?.role === 'SALES' && (
          <button 
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => { setShowForm(!showForm); setError(''); }}
          >
            {showForm ? <IconClose /> : <IconPlus />}
            <span>{showForm ? 'Close Form' : 'New Quotation'}</span>
          </button>
        )}
      </div>

      {/* KPI Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📑</div>
          <div className="stat-info">
            <span className="stat-label">Total Quotes</span>
            <span className="stat-value">{totalCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">📝</div>
          <div className="stat-info">
            <span className="stat-label">Drafts Pending</span>
            <span className="stat-value">{draftCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <span className="stat-label">Accepted Quotes</span>
            <span className="stat-value">{acceptedCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">💰</div>
          <div className="stat-info">
            <span className="stat-label">Quoted Pipeline</span>
            <span className="stat-value">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">✓ {successMsg}</div>}
      {error && !showForm && <div className="alert alert-danger">⚠ {error}</div>}

      {/* Quotation Creation Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Prepare New Price Quotation</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auto-Calculated Backend Validation</span>
          </div>

          {error && <div className="alert alert-danger">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Quotation Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={form.quotation_number}
                  onChange={e => setForm({ ...form, quotation_number: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select Customer Enquiry</label>
                <select 
                  className="form-control" 
                  value={form.enquiry_id}
                  onChange={e => handleEnquiryChange(e.target.value)} 
                  required
                >
                  <option value="">-- Choose Enquiry Reference --</option>
                  {enquiries
                    .filter((e: any) => e.status === 'NEW' || e.status === 'QUOTED')
                    .map((e: any) => (
                      <option key={e.id} value={e.id}>
                        {e.enquiry_number} — {e.customer?.company_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quotation Validity Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={form.valid_until}
                  onChange={e => setForm({ ...form, valid_until: e.target.value })} 
                  required 
                />
              </div>
            </div>

            {/* Line items pricing */}
            <div className="form-group" style={{ marginTop: '0.85rem' }}>
              <label className="form-label">Product Pricing Breakdown</label>

              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr auto', gap: '0.65rem', marginBottom: '0.4rem', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span>Product</span>
                <span>Quantity</span>
                <span>Discount %</span>
                <span>GST %</span>
                <span></span>
              </div>

              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr auto', gap: '0.65rem', marginBottom: '0.65rem', alignItems: 'center' }}>
                  <select 
                    className="form-control" 
                    value={item.product_id}
                    onChange={e => updateItem(i, 'product_id', e.target.value)} 
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.product_code} — {p.name} (Base: ₹{p.base_price})
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

                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="form-control" 
                    placeholder="0%" 
                    value={item.discount_percent}
                    onChange={e => updateItem(i, 'discount_percent', e.target.value)} 
                  />

                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="form-control" 
                    placeholder="18%" 
                    value={item.gst_percent}
                    onChange={e => updateItem(i, 'gst_percent', e.target.value)} 
                  />

                  {items.length > 1 && (
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm"
                      onClick={() => removeItem(i)}
                      title="Remove line"
                    >
                      <IconClose />
                    </button>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={addItem}
                >
                  <IconPlus />
                  <span>Add Line Item</span>
                </button>

                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  Estimated Total: <strong style={{ color: 'var(--primary-dark)', fontSize: '1.15rem' }}>₹{calculateEstimatedTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting Quotation...' : 'Create Quotation'}
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

      {/* Quotations Table Card */}
      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Quote No.</th>
                <th>Enquiry Reference</th>
                <th>Customer Name</th>
                <th>Valid Until</th>
                <th>Final Amount (Inc. GST)</th>
                <th>Status</th>
                <th>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No quotations generated yet. Click <strong>"New Quotation"</strong> above to start.
                  </td>
                </tr>
              ) : (
                quotations.map((q: any) => {
                  const total = q.items?.reduce((sum: number, item: any) => sum + Number(item.line_amount || 0), 0) || 0;
                  return (
                    <tr key={q.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-mono)' }}>
                          {q.quotation_number}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        {q.enquiry?.enquiry_number || '-'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{q.enquiry?.customer?.company_name || 'N/A'}</div>
                      </td>
                      <td>{new Date(q.valid_until).toLocaleDateString()}</td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge badge-${q.status.toLowerCase()}`}>
                          {q.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {user?.role === 'SALES' && q.status === 'DRAFT' && (
                            <button 
                              className="btn btn-warning btn-sm"
                              onClick={() => handleStatusChange(q.id, 'SENT')}
                            >
                              Mark Sent
                            </button>
                          )}

                          {user?.role === 'SALES' && q.status === 'SENT' && (
                            <>
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleStatusChange(q.id, 'ACCEPTED')}
                              >
                                <IconCheck />
                                <span>Accept</span>
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleStatusChange(q.id, 'REJECTED')}
                              >
                                <IconClose />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {user?.role === 'SALES' && q.status === 'ACCEPTED' && (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleConvert(q.id)}
                            >
                              <span>Convert to Sales Order →</span>
                            </button>
                          )}

                          {q.status === 'WON' && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--success-text)', fontWeight: 600 }}>
                              ✓ Order Generated
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Quotations;
