import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Plus, User, FileText, X, Eye, Printer, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Selected Data
  const [selectedCust, setSelectedCust] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = `/customers/?skip=0&limit=100`;
      if (search) url += `&search=${search}`;
      
      const res = await api.get(url);
      setCustomers(res.data);
    } catch (err) {
      setError("Failed to load customer profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !phone) {
      setError("Name and Phone number are required.");
      return;
    }

    try {
      await api.post('/customers/', { name, phone, email: email || null, address: address || null });
      setSuccess("Customer profile established successfully!");
      setShowAddModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create customer profile");
    }
  };

  const handleOpenHistory = async (cust) => {
    setSelectedCust(cust);
    setLoading(true);
    try {
      // Get detailed customer profile with invoices
      const res = await api.get(`/customers/${cust.id}`);
      setPurchaseHistory(res.data.invoices || []);
      setShowHistoryModal(true);
    } catch (err) {
      setError("Failed to load customer purchase logs");
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const res = await api.get(`/billing/${invoiceId}`);
      setSelectedInvoice(res.data);
      setShowPrintModal(true);
    } catch (err) {
      setError("Failed to fetch tax invoice details");
    }
  };

  return (
    <div className="max-w-7xl mx-auto relative">
      <div className="space-y-8 no-print">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wider text-white uppercase">
            Customer <span className="text-gold-gradient">CRM Registry</span>
          </h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">
            Maintain guest directories, phone indexes and purchase histories
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gold-gradient text-black rounded-lg text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:shadow-goldGlowStrong transition-all duration-300"
        >
          <Plus className="w-4 h-4" /> Add Customer Card
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs uppercase tracking-wider rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-zinc-400 hover:text-emerald-300"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/40 border border-gold/15 rounded-lg pl-12 pr-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-gold/50 focus:shadow-goldGlow"
          placeholder="Filter registry by buyer's name or active mobile number..."
        />
      </div>

      {/* Customer table */}
      <div className="p-6 rounded-xl border border-gold/10 bg-zinc-900/30 backdrop-blur-md">
        {loading && customers.length === 0 ? (
          <div className="py-20 flex justify-center">
            <Loader className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-zinc-600 uppercase tracking-widest">
            No customers found in showrooms databases
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-gold/10 text-zinc-500 uppercase tracking-widest pb-3">
                  <th className="py-3 font-semibold">Customer ID</th>
                  <th className="py-3 font-semibold">Name</th>
                  <th className="py-3 font-semibold">Phone / Mobile</th>
                  <th className="py-3 font-semibold">Email</th>
                  <th className="py-3 font-semibold">Location / Address</th>
                  <th className="py-3 font-semibold">Date Registered</th>
                  <th className="py-3 font-semibold text-center">Invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-zinc-950/20 transition-colors duration-200">
                    <td className="py-4 font-mono font-bold text-zinc-500">CUST-{String(cust.id).padStart(4, '0')}</td>
                    <td className="py-4 font-semibold text-zinc-200">{cust.name}</td>
                    <td className="py-4 font-mono text-zinc-300">{cust.phone}</td>
                    <td className="py-4 text-zinc-400">{cust.email || '-'}</td>
                    <td className="py-4 text-zinc-400 max-w-[200px] overflow-hidden text-ellipsis">{cust.address || '-'}</td>
                    <td className="py-4 text-zinc-500">{new Date(cust.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => handleOpenHistory(cust)}
                        className="px-3 py-1.5 bg-gold/5 hover:bg-gold/15 border border-gold/20 hover:border-gold/40 rounded text-[10px] uppercase font-bold tracking-widest text-gold flex items-center gap-1 mx-auto transition-colors duration-200"
                      >
                        <Eye className="w-3 h-3" /> View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD CUSTOMER */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-gold/25 rounded-xl p-6 shadow-goldGlowStrong"
            >
              <div className="flex justify-between items-center border-b border-gold/10 pb-3 mb-4">
                <h3 className="font-serif text-base font-bold uppercase tracking-widest text-gold flex items-center gap-2">
                  <User className="w-4 h-4" /> Register Customer Profile
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-gold">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && <p className="p-3 mb-4 bg-luxuryRed/15 text-gold-light text-xs rounded border border-luxuryRed/35">{error}</p>}

              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                    placeholder="e.g. Ramesh Kumar"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                    placeholder="e.g. ramesh.kumar@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                    placeholder="e.g. Mumbai, India"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-gradient text-black rounded-lg py-3 text-xs uppercase tracking-widest font-bold hover:shadow-goldGlowStrong transition-all duration-300"
                >
                  Create Registry Card
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CUSTOMER HISTORY */}
      <AnimatePresence>
        {showHistoryModal && selectedCust && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-zinc-950 border border-gold/25 rounded-2xl p-6 shadow-goldGlowStrong"
            >
              <div className="flex justify-between items-center border-b border-gold/10 pb-4 mb-4">
                <div>
                  <h3 className="font-serif text-base font-bold uppercase tracking-widest text-gold flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Purchase History Ledger
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                    History ledger of: {selectedCust.name} ({selectedCust.phone})
                  </p>
                </div>
                <button onClick={() => { setShowHistoryModal(false); setSelectedCust(null); }} className="text-zinc-500 hover:text-gold">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[400px]">
                {purchaseHistory.length === 0 ? (
                  <div className="py-16 text-center text-zinc-600 uppercase tracking-widest text-xs">
                    No transactions recorded for this buyer
                  </div>
                ) : (
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-gold/10 text-zinc-500 uppercase tracking-widest pb-3">
                        <th className="py-2.5 font-semibold">Invoice No</th>
                        <th className="py-2.5 font-semibold">Date</th>
                        <th className="py-2.5 font-semibold">Subtotal</th>
                        <th className="py-2.5 font-semibold text-gold">Net Total</th>
                        <th className="py-2.5 font-semibold">Status</th>
                        <th className="py-2.5 font-semibold text-center font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {purchaseHistory.map((inv) => (
                        <tr key={inv.id} className="hover:bg-zinc-900/30 transition-colors">
                          <td className="py-3 font-semibold text-zinc-200">{inv.invoice_number}</td>
                          <td className="py-3 text-zinc-400">{new Date(inv.invoice_date).toLocaleDateString('en-IN', { dateStyle: 'short' })}</td>
                          <td className="py-3 font-mono text-zinc-400">₹{parseFloat(inv.subtotal).toLocaleString('en-IN')}</td>
                          <td className="py-3 font-mono font-semibold text-gold">₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${inv.payment_status === 'Paid' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : 'bg-luxuryRed/20 text-gold-light border border-luxuryRed/35'}`}>
                              {inv.payment_status}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleViewInvoice(inv.id)}
                              className="px-2.5 py-1 bg-gold-gradient text-black rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 mx-auto"
                            >
                              <Printer className="w-2.5 h-2.5" /> View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div> {/* End of no-print dashboard wrapper */}

      {/* Print Viewer Modal */}
      {showPrintModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl bg-zinc-950 border border-gold/30 rounded-2xl p-6 shadow-goldGlowStrong flex flex-col my-8"
          >
            {/* Modal Actions */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gold/15">
              <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-gold">
                Invoice Ledger Details
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gold-gradient text-black rounded text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded text-[10px] uppercase tracking-widest font-bold"
                >
                  Close Receipt
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="bg-white text-black p-8 rounded-lg overflow-y-auto max-h-[500px] print-container">
              <div className="flex justify-between items-start border-b pb-6 mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold tracking-widest uppercase">KAIYA JEWELS</h2>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Timeless Showroom Elegance</p>
                  <p className="text-[10px] text-zinc-400 mt-2">
                    Plot 48, Zaveri Bazaar, Mumbai, MH - 400002<br/>
                    Phone: +91 22 28493010 | Email: billing@kaiyajewels.com
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="font-serif text-base font-bold text-zinc-700 uppercase tracking-widest">TAX INVOICE</h3>
                  <p className="text-[10px] font-semibold text-zinc-500 mt-1">Invoice No: {selectedInvoice.invoice_number}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Date: {new Date(selectedInvoice.invoice_date).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-zinc-400">Branch: {selectedInvoice.branch}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 border-b pb-6 mb-6 text-xs">
                <div>
                  <h4 className="font-bold uppercase text-zinc-500 mb-1 text-[10px]">Billed To:</h4>
                  <p className="font-bold text-zinc-800">{selectedInvoice.customer?.name}</p>
                  <p className="text-zinc-600 mt-0.5">Phone: {selectedInvoice.customer?.phone}</p>
                  {selectedInvoice.customer?.email && <p className="text-zinc-600">Email: {selectedInvoice.customer?.email}</p>}
                  {selectedInvoice.customer?.address && <p className="text-zinc-500 mt-1">Address: {selectedInvoice.customer?.address}</p>}
                </div>
                <div className="text-right text-[10px]">
                  <h4 className="font-bold uppercase text-zinc-500 mb-1">Payment Details:</h4>
                  <p className="text-zinc-700 font-semibold">Payment Status: <span className="uppercase font-bold text-zinc-900">{selectedInvoice.payment_status}</span></p>
                  <p className="text-zinc-600 mt-0.5">Mode: {selectedInvoice.payment_mode}</p>
                  {selectedInvoice.payments?.[0]?.reference_number && (
                    <p className="text-zinc-500">Txn Ref: {selectedInvoice.payments[0].reference_number}</p>
                  )}
                  <p className="text-zinc-500 mt-2">Billed By: {selectedInvoice.user?.username}</p>
                </div>
              </div>

              {/* Items List */}
              <table className="w-full text-left text-xs mb-6">
                <thead>
                  <tr className="border-b-2 border-zinc-300 text-zinc-600 font-bold uppercase text-[9px] tracking-wider bg-zinc-50">
                    <th className="py-2.5 px-2">Description</th>
                    <th className="py-2.5 px-2 text-center">Purity</th>
                    <th className="py-2.5 px-2 text-right">Weight (g)</th>
                    <th className="py-2.5 px-2 text-right">Metal Rate (₹/g)</th>
                    <th className="py-2.5 px-2 text-right">Wastage %</th>
                    <th className="py-2.5 px-2 text-right">Making Charges</th>
                    <th className="py-2.5 px-2 text-right">Taxable (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {selectedInvoice.items?.map((item, idx) => {
                    const base = item.weight * item.metal_rate;
                    const wastage = item.weight * (item.wastage_percent / 100) * item.metal_rate;
                    const making = item.weight * item.making_charge;
                    return (
                      <tr key={idx} className="text-zinc-800">
                        <td className="py-3 px-2 font-semibold">{item.item_name}</td>
                        <td className="py-3 px-2 text-center uppercase">{item.purity}</td>
                        <td className="py-3 px-2 text-right font-mono">{parseFloat(item.weight).toFixed(3)}g</td>
                        <td className="py-3 px-2 text-right font-mono">₹{parseFloat(item.metal_rate).toLocaleString()}</td>
                        <td className="py-3 px-2 text-right font-mono">{item.wastage_percent}%</td>
                        <td className="py-3 px-2 text-right font-mono">₹{making.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-2 text-right font-semibold font-mono">₹{parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals Table */}
              <div className="flex justify-end text-xs">
                <div className="w-72 space-y-2.5 text-zinc-600 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono text-zinc-800">₹{(parseFloat(selectedInvoice.subtotal) + parseFloat(selectedInvoice.making_charges_total)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST (1.5%):</span>
                    <span className="font-mono text-zinc-800">₹{(parseFloat(selectedInvoice.gst_amount) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (1.5%):</span>
                    <span className="font-mono text-zinc-800">₹{(parseFloat(selectedInvoice.gst_amount) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {parseFloat(selectedInvoice.discount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount Offered:</span>
                      <span className="font-mono">- ₹{parseFloat(selectedInvoice.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-zinc-900 border-t pt-2.5">
                    <span>Net Invoice Value:</span>
                    <span className="font-mono">₹{parseFloat(selectedInvoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Declarations */}
              <div className="border-t pt-8 mt-12 grid grid-cols-2 gap-8 text-[9px] text-zinc-400 uppercase tracking-wider">
                <div>
                  <h5 className="font-bold text-zinc-600 mb-1">Terms & Conditions:</h5>
                  <p className="leading-relaxed">
                    1. Goods once sold cannot be returned or exchanged without valid original invoice.<br/>
                    2. Purity of gold/silver items is certified according to standard hallmark benchmarks.<br/>
                    3. Disputes, if any, shall be subject to Mumbai jurisdiction only.
                  </p>
                </div>
                <div className="flex flex-col justify-end items-end text-center">
                  <div className="w-40 border-b border-zinc-300 h-10"></div>
                  <p className="font-bold text-zinc-500 mt-2">AUTHORIZED SIGNATORY</p>
                  <p className="text-[8px] mt-0.5">KAIYA SHOWROOMS</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
