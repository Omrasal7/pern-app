// Quotations.tsx - Commercial quotation generation and approval workflow
import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Quotations = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [form, setForm] = useState({
    quotation_number: `QT-${Date.now().toString().slice(-5)}`,
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
      console.error('Failed to load quotations', err);
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

      setSuccessMsg('Quotation successfully generated and verified by backend.');
      setShowForm(false);
      setForm({
        quotation_number: `QT-${Date.now().toString().slice(-5)}`,
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
      setSuccessMsg(`Quotation status updated to ${status}`);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleConvert = async (id: number) => {
    setError('');
    setSuccessMsg('');
    const order_number = `SO-${Date.now().toString().slice(-5)}`;
    try {
      await api.post(`/quotations/${id}/convert`, { order_number });
      setSuccessMsg(`Quotation converted to Sales Order: ${order_number}`);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to convert quotation');
    }
  };

  // Live calculation breakdown
  const computeBreakdown = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    items.forEach(item => {
      const prod = products.find((p: any) => p.id === Number(item.product_id));
      if (!prod) return;
      const base = prod.base_price * item.quantity;
      const discount = base * (Number(item.discount_percent || 0) / 100);
      const afterDiscount = base - discount;
      const gst = afterDiscount * (Number(item.gst_percent || 0) / 100);

      subtotal += base;
      totalDiscount += discount;
      totalGst += gst;
    });

    const grandTotal = subtotal - totalDiscount + totalGst;
    return { subtotal, totalDiscount, totalGst, grandTotal };
  };

  const breakdown = computeBreakdown();

  // Filtered List
  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.enquiry?.enquiry_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.enquiry?.customer?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-description">Generate commercial quotations, apply tax rates, and process customer approvals</p>
        </div>
        {user?.role === 'SALES' && (
          <button 
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => { setShowForm(!showForm); setError(''); }}
          >
            {showForm ? 'Close Form' : '+ New Quotation'}
          </button>
        )}
      </div>

      {successMsg && <div className="app-alert app-alert-success">{successMsg}</div>}
      {error && !showForm && <div className="app-alert app-alert-danger">{error}</div>}

      {/* Commercial Quotation Creation Form */}
      {showForm && (
        <div className="section-panel">
          <div className="section-header">
            <span className="section-heading">Create Commercial Quotation</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-Validated Backend Calculations</span>
          </div>

          {error && <div className="app-alert app-alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Quotation Number *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={form.quotation_number}
                  onChange={e => setForm({ ...form, quotation_number: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Enquiry Reference *</label>
                <select 
                  className="form-control" 
                  value={form.enquiry_id}
                  onChange={e => handleEnquiryChange(e.target.value)} 
                  required
                >
                  <option value="">-- Choose Enquiry --</option>
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
                <label className="form-label">Valid Until Date *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={form.valid_until}
                  onChange={e => setForm({ ...form, valid_until: e.target.value })} 
                  required 
                />
              </div>
            </div>

            {/* Line Items Pricing Table */}
            <div className="section-subheading">
              Line Items & Commercial Pricing
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <span>Product</span>
                <span>Qty</span>
                <span>Unit Price</span>
                <span>Disc %</span>
                <span>GST %</span>
                <span>Action</span>
              </div>

              {items.map((item, i) => {
                const prod = products.find((p: any) => p.id === Number(item.product_id));
                const unitPrice = prod ? prod.base_price : 0;
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.45rem', alignItems: 'center' }}>
                    <select 
                      className="form-control" 
                      value={item.product_id}
                      onChange={e => updateItem(i, 'product_id', e.target.value)} 
                      required
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.product_code} — {p.name}
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
                      type="text" 
                      className="form-control" 
                      value={`₹${unitPrice}`}
                      disabled
                      style={{ background: '#e2e8f0' }}
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
                );
              })}

              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                style={{ marginTop: '0.35rem' }}
                onClick={addItem}
              >
                + Add Item Line
              </button>
            </div>

            {/* Financial Summary */}
            <div className="quotation-totals-grid">
              <table className="totals-table">
                <tbody>
                  <tr>
                    <td>Base Subtotal:</td>
                    <td className="text-right">₹{breakdown.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Total Discount Applied:</td>
                    <td className="text-right" style={{ color: 'var(--status-danger-text)' }}>
                      - ₹{breakdown.totalDiscount.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td>GST Tax Amount:</td>
                    <td className="text-right">+ ₹{breakdown.totalGst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Grand Total (INR):</td>
                    <td className="text-right">₹{breakdown.grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-divider)' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Save & Issue Quotation'}
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

      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="search-input-group">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by Quote No, Enquiry, Customer..."
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
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">SENT</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <span className="records-count">
            Showing {filteredQuotations.length} of {quotations.length} quotations
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper attached-to-toolbar">
        <table>
          <thead>
            <tr>
              <th>Quote No.</th>
              <th>Enquiry Ref</th>
              <th>Customer</th>
              <th>Valid Until</th>
              <th className="text-right">Total Amount (₹)</th>
              <th>Status</th>
              <th>Workflow Action</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr>
                <td colSpan={7} className="text-center" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>
                  Loading quotations...
                </td>
              </tr>
            ) : filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                  No quotations match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredQuotations.map((q: any) => {
                const total = q.items?.reduce((sum: number, item: any) => sum + Number(item.line_amount || 0), 0) || 0;
                return (
                  <tr key={q.id}>
                    <td className="code-cell">{q.quotation_number}</td>
                    <td>{q.enquiry?.enquiry_number || '-'}</td>
                    <td><strong>{q.enquiry?.customer?.company_name || 'N/A'}</strong></td>
                    <td>{new Date(q.valid_until).toLocaleDateString()}</td>
                    <td className="text-right code-cell">
                      ₹{total.toFixed(2)}
                    </td>
                    <td>
                      <span className={`status-tag status-${q.status.toLowerCase()}`}>
                        {q.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {user?.role === 'SALES' && q.status === 'DRAFT' && (
                          <button 
                            className="btn btn-secondary btn-sm"
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
                              Accept
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleStatusChange(q.id, 'REJECTED')}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {user?.role === 'SALES' && q.status === 'ACCEPTED' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConvert(q.id)}
                          >
                            Convert to Sales Order →
                          </button>
                        )}

                        {q.status === 'WON' && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--status-success-text)', fontWeight: 600 }}>
                            Converted to Order
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
  );
};

export default Quotations;
