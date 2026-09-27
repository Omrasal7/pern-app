// Quotations.tsx - Prepare price quotations and convert to Sales Orders
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

  // If user selects an enquiry, pre-populate product lines if available
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

      setSuccessMsg('Quotation created successfully (amounts calculated by backend)');
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
    const order_number = `SO-${Date.now().toString().slice(-6)}`;
    try {
      await api.post(`/quotations/${id}/convert`, { order_number });
      setSuccessMsg(`Quotation converted to Sales Order (${order_number})`);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to convert quotation');
    }
  };

  // Live estimated total for student demo UI
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">Prepare quotations with discount and GST rates, and convert accepted quotes to Sales Orders</p>
        </div>
        {user?.role === 'SALES' && (
          <button 
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => { setShowForm(!showForm); setError(''); }}
          >
            {showForm ? 'Close Form' : '+ Create Quotation'}
          </button>
        )}
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && !showForm && <div className="alert alert-danger">{error}</div>}

      {/* Quotation Creation Form */}
      {showForm && (
        <div className="card">
          <h2 className="card-title">Create New Quotation</h2>
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
                  <option value="">-- Select Enquiry --</option>
                  {enquiries
                    .filter((e: any) => e.status === 'NEW' || e.status === 'QUOTED')
                    .map((e: any) => (
                      <option key={e.id} value={e.id}>
                        {e.enquiry_number} - {e.customer?.company_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Valid Until</label>
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
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label">Quotation Line Items</label>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>Product</span>
                <span>Quantity</span>
                <span>Discount %</span>
                <span>GST %</span>
                <span></span>
              </div>

              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <select 
                    className="form-control" 
                    value={item.product_id}
                    onChange={e => updateItem(i, 'product_id', e.target.value)} 
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.product_code} - {p.name} (₹{p.base_price})
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
                    placeholder="0" 
                    value={item.discount_percent}
                    onChange={e => updateItem(i, 'discount_percent', e.target.value)} 
                  />

                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="form-control" 
                    placeholder="18" 
                    value={item.gst_percent}
                    onChange={e => updateItem(i, 'gst_percent', e.target.value)} 
                  />

                  {items.length > 1 && (
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => removeItem(i)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={addItem}
                >
                  + Add Line Item
                </button>

                <div style={{ fontSize: '0.9rem' }}>
                  Estimated Total: <strong style={{ color: 'var(--primary)' }}>₹{calculateEstimatedTotal().toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating Quotation...' : 'Save Quotation'}
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

      {/* Quotations Table */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Quote No.</th>
              <th>Enquiry Ref</th>
              <th>Customer</th>
              <th>Valid Until</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  Loading quotations...
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  No quotations created yet.
                </td>
              </tr>
            ) : (
              quotations.map((q: any) => {
                const total = q.items?.reduce((sum: number, item: any) => sum + Number(item.line_amount || 0), 0) || 0;
                return (
                  <tr key={q.id}>
                    <td><strong>{q.quotation_number}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>{q.enquiry?.enquiry_number || '-'}</td>
                    <td>{q.enquiry?.customer?.company_name || 'N/A'}</td>
                    <td>{new Date(q.valid_until).toLocaleDateString()}</td>
                    <td><strong>₹{total.toFixed(2)}</strong></td>
                    <td>
                      <span className={`badge badge-${q.status.toLowerCase()}`}>
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
                            Convert to Order
                          </button>
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
