import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Search, Plus, Trash2, Printer, X, Barcode, CheckCircle, Sparkles, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const BillingPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // Customer states
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerList, setCustomerList] = useState([]);
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  
  // New customer inline form
  const [showNewCustForm, setShowNewCustForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Product/Barcode search states
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productList, setProductList] = useState([]);
  const [showProdDropdown, setShowProdDropdown] = useState(false);
  
  // Billing items list
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash'); // Cash, Card, UPI, Bank Transfer
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid'); // Paid, Partial, Unpaid
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInvoice, setSuccessInvoice] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const barcodeInputRef = useRef(null);

  // Focus barcode input on mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Fetch customers on search input
  useEffect(() => {
    const fetchCustomers = async () => {
      if (customerSearch.trim().length >= 2) {
        try {
          const res = await api.get(`/customers/?search=${customerSearch}`);
          setCustomerList(res.data);
          setShowCustDropdown(true);
        } catch (err) {
          console.error(err);
        }
      } else {
        setCustomerList([]);
        setShowCustDropdown(false);
      }
    };

    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Fetch products on search input
  useEffect(() => {
    const fetchProducts = async () => {
      if (productSearch.trim().length >= 2) {
        try {
          const res = await api.get(`/products/?search=${productSearch}`);
          setProductList(res.data);
          setShowProdDropdown(true);
        } catch (err) {
          console.error(err);
        }
      } else {
        setProductList([]);
        setShowProdDropdown(false);
      }
    };

    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Barcode quick scanner simulation (Triggered on Enter key)
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    setError('');
    try {
      const res = await api.get(`/products/code/${barcodeInput.trim()}`);
      addProductToInvoice(res.data);
      setBarcodeInput('');
    } catch (err) {
      setError(`Barcode SKU code '${barcodeInput}' not found in showroom inventory.`);
    }
  };

  // Append product item to billing list
  const addProductToInvoice = (product) => {
    // Prevent adding if stock is 0 (warn but allow staff choice)
    if (product.count <= 0) {
      setError(`Warning: '${product.name}' is out of stock in database inventory!`);
    }

    // Check if item already added
    const existingIdx = items.findIndex(item => item.product_id === product.id);
    if (existingIdx > -1) {
      setError(`Item '${product.name}' is already added. Adjust quantity/weight directly.`);
      return;
    }

    const price = parseFloat(product.price_per_gram);
    const weight = parseFloat(product.weight);
    const wastage = parseFloat(product.wastage_percentage);
    const making = parseFloat(product.making_charge_per_gram);

    // Initial calculations
    const baseValue = weight * price;
    const wastageValue = weight * (wastage / 100) * price;
    const makingChargeValue = weight * making;
    const taxableAmount = baseValue + wastageValue + makingChargeValue;

    const newItem = {
      product_id: product.id,
      item_name: product.name,
      category: product.category,
      purity: product.purity,
      weight: weight,
      metal_rate: price,
      making_charge: making,
      wastage_percent: wastage,
      gst_rate: 3.0,
      amount: taxableAmount
    };

    setItems([...items, newItem]);
    setProductSearch('');
    setShowProdDropdown(false);
  };

  // Remove line item
  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  // Recalculate specific line item values on user edits
  const handleItemEdit = (idx, field, value) => {
    const updated = [...items];
    const val = parseFloat(value) || 0;
    updated[idx][field] = val;

    // Recalculate item amount
    const weight = updated[idx].weight;
    const rate = updated[idx].metal_rate;
    const making = updated[idx].making_charge;
    const wastage = updated[idx].wastage_percent;

    const baseValue = weight * rate;
    const wastageValue = weight * (wastage / 100) * rate;
    const makingValue = weight * making;
    
    updated[idx].amount = baseValue + wastageValue + makingValue;
    setItems(updated);
  };

  // Calculate invoice final aggregates
  const calculateTotals = () => {
    let subtotal = 0;
    let makingChargesTotal = 0;

    items.forEach(item => {
      const base = item.weight * item.metal_rate;
      const wastageVal = item.weight * (item.wastage_percent / 100) * item.metal_rate;
      const makingVal = item.weight * item.making_charge;
      
      subtotal += base + wastageVal;
      makingChargesTotal += makingVal;
    });

    const taxableAmount = subtotal + makingChargesTotal;
    const gst_amount = taxableAmount * 0.03; // 3% standard GST
    const cgst = gst_amount / 2;
    const sgst = gst_amount / 2;
    const total_amount = Math.max(0, taxableAmount + gst_amount - discount);

    return {
      subtotal,
      makingChargesTotal,
      taxableAmount,
      gst_amount,
      cgst,
      sgst,
      total_amount
    };
  };

  const totals = calculateTotals();

  // Create inline customer handle
  const handleCreateCustomer = () => {
    if (!newCustName || !newCustPhone) {
      setError('Please provide at least customer name and phone.');
      return;
    }
    const tempCust = {
      id: null, // Indicates inline creation to database
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail || null,
      address: newCustAddress || null
    };
    setSelectedCustomer(tempCust);
    setShowNewCustForm(false);
    // Clear forms
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustAddress('');
  };

  // Submit Invoice to FastAPI
  const handleGenerateInvoice = async () => {
    if (items.length === 0) {
      setError("Please add at least one jewelry item to the bill.");
      return;
    }

    if (!selectedCustomer) {
      setError("Please select or register a customer first.");
      return;
    }

    setLoading(true);
    setError('');

    // Admin Override Logic: 5% Discount Cap for Staff
    if (!isAdmin) {
      const maxDiscount = totals.taxableAmount * 0.05;
      if (discount > maxDiscount) {
        setError(`Admin Override Required: Staff discount is capped at 5% (Max allowed: ₹${Math.floor(maxDiscount).toLocaleString('en-IN')}).`);
        setLoading(false);
        return;
      }
    }

    const invoiceData = {
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.id ? null : selectedCustomer.name,
      customer_phone: selectedCustomer.id ? null : selectedCustomer.phone,
      customer_email: selectedCustomer.id ? null : selectedCustomer.email,
      customer_address: selectedCustomer.id ? null : selectedCustomer.address,
      
      subtotal: totals.subtotal,
      making_charges_total: totals.makingChargesTotal,
      gst_amount: totals.gst_amount,
      discount: discount,
      total_amount: totals.total_amount,
      payment_status: paymentStatus,
      payment_mode: paymentMode,
      payment_reference: paymentRef || null,
      branch: "Main Branch",
      items: items
    };

    try {
      const res = await api.post('/billing/', invoiceData);
      setSuccessInvoice(res.data);
      // Clear current bill state
      setItems([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setPaymentRef('');
      // Open print overlay
      setShowPrintModal(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create invoice transaction");
    } finally {
      setLoading(false);
    }
  };

  // Trigger browser print dialog
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto relative">
      <div className="space-y-8 no-print">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wider text-white uppercase">
            Luxury <span className="text-gold-gradient">Billing Desk</span>
          </h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">
            Generate compliant GST invoices and compute weight/wastage values
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-luxuryRed/15 border border-luxuryRed/35 text-gold-light text-xs uppercase tracking-wider rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-zinc-400 hover:text-gold"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Grid: Left Input Area, Right Summary Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Items & Customer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection Card */}
          <div className="p-6 rounded-xl border border-gold/10 bg-zinc-900/30 backdrop-blur-md space-y-4">
            <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-zinc-300">
              Customer Identification
            </h3>
            
            {!selectedCustomer ? (
              <div className="flex flex-col sm:flex-row gap-4 relative">
                {/* Live Search bar */}
                <div className="relative flex-grow">
                  <Search className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-gold/15 rounded-lg pl-12 pr-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-gold/50 focus:shadow-goldGlow transition-all duration-300"
                    placeholder="Search customer by name or phone (type 2+ chars)..."
                  />
                  
                  {/* Dropdown Results */}
                  {showCustDropdown && customerList.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-zinc-950 border border-gold/20 rounded-lg shadow-goldGlowStrong z-40 max-h-48 overflow-y-auto divide-y divide-zinc-900">
                      {customerList.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setCustomerSearch('');
                            setShowCustDropdown(false);
                          }}
                          className="px-4 py-3 text-xs cursor-pointer hover:bg-gold/5 hover:text-gold flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold text-zinc-300">{cust.name}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Phone: {cust.phone}</p>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-gold bg-gold/5 px-2 py-0.5 rounded border border-gold/10">Select</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <span className="text-xs text-zinc-600 uppercase tracking-widest font-mono">OR</span>
                </div>

                {/* Add inline customer button */}
                <button
                  onClick={() => setShowNewCustForm(!showNewCustForm)}
                  className="px-6 py-3 border border-gold/20 hover:border-gold/50 bg-zinc-950/40 text-gold text-xs uppercase tracking-widest font-bold rounded-lg flex items-center justify-center gap-2 hover:shadow-goldGlow transition-all duration-300"
                >
                  <Plus className="w-4 h-4" /> New Customer
                </button>
              </div>
            ) : (
              <div className="p-4 border border-gold/20 bg-gold/5 rounded-lg flex justify-between items-center">
                <div>
                  <h4 className="font-serif text-sm font-semibold text-gold">{selectedCustomer.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">Phone: {selectedCustomer.phone} {selectedCustomer.email && `| Email: ${selectedCustomer.email}`}</p>
                  {selectedCustomer.address && <p className="text-[10px] text-zinc-500 mt-1">Address: {selectedCustomer.address}</p>}
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-3 py-1 bg-luxuryRed/20 hover:bg-luxuryRed/40 border border-luxuryRed/50 rounded text-[10px] uppercase font-bold tracking-widest transition-colors duration-300"
                >
                  Change
                </button>
              </div>
            )}

            {/* New Customer Form Drawer */}
            <AnimatePresence>
              {showNewCustForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-5 border border-gold/10 bg-zinc-950/60 rounded-lg space-y-4 overflow-hidden"
                >
                  <h4 className="text-xs uppercase tracking-widest font-bold text-gold border-b border-gold/10 pb-2">Register Customer Inline</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                        placeholder="e.g. Ramesh Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                        placeholder="e.g. 9876543210"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                        placeholder="e.g. ramesh@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Residential Address</label>
                      <input
                        type="text"
                        value={newCustAddress}
                        onChange={(e) => setNewCustAddress(e.target.value)}
                        className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                        placeholder="e.g. Mumbai, India"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowNewCustForm(false)}
                      className="px-4 py-1.5 border border-zinc-800 text-zinc-400 text-[10px] uppercase font-bold rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCustomer}
                      className="px-4 py-1.5 bg-gold-gradient text-black text-[10px] uppercase font-bold rounded"
                    >
                      Attach Customer
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Product Scanner / Selection Panel */}
          <div className="p-6 rounded-xl border border-gold/10 bg-zinc-900/30 backdrop-blur-md space-y-4">
            <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-zinc-300">
              Showroom Catalog Selector
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scanner Simulation */}
              <form onSubmit={handleBarcodeSubmit} className="relative">
                <Barcode className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  ref={barcodeInputRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-gold/15 rounded-lg pl-12 pr-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-gold/50 focus:shadow-goldGlow transition-all duration-300"
                  placeholder="Scan product barcode (e.g. PRD-G001) + [Enter]..."
                />
              </form>

              {/* Name Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-gold/15 rounded-lg pl-12 pr-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-gold/50 focus:shadow-goldGlow transition-all duration-300"
                  placeholder="Or search items by name..."
                />
                
                {/* Dropdown Results */}
                {showProdDropdown && productList.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-zinc-950 border border-gold/20 rounded-lg shadow-goldGlowStrong z-40 max-h-48 overflow-y-auto divide-y divide-zinc-900">
                    {productList.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => addProductToInvoice(prod)}
                        className="px-4 py-3 text-xs cursor-pointer hover:bg-gold/5 hover:text-gold flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-zinc-300">{prod.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Code: {prod.code} | {prod.category} ({prod.purity})</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gold font-bold">₹{parseFloat(prod.price_per_gram).toLocaleString()}/g</p>
                          <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{prod.weight}g | Stock: {prod.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="p-6 rounded-xl border border-gold/10 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-zinc-300 mb-6">
              Checkout Invoice Items
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gold/10 text-zinc-500 uppercase tracking-widest pb-3">
                    <th className="py-3 font-semibold">Jewel Description</th>
                    <th className="py-3 font-semibold">Weight (g)</th>
                    <th className="py-3 font-semibold">Metal Rate (₹/g)</th>
                    <th className="py-3 font-semibold">Wastage %</th>
                    <th className="py-3 font-semibold">Making (₹/g)</th>
                    <th className="py-3 font-semibold text-right">Taxable (₹)</th>
                    <th className="py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-zinc-600 uppercase tracking-widest">
                        Scan barcodes or select catalog products to begin billing
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-950/20 transition-colors duration-200">
                        {/* Name/Code */}
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-zinc-200 max-w-[180px] overflow-hidden text-ellipsis">{item.item_name}</p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">{item.category} ({item.purity})</p>
                        </td>

                        {/* Weight */}
                        <td className="py-3 pr-4 w-20">
                          <input
                            type="number"
                            step="0.001"
                            value={item.weight}
                            onChange={(e) => handleItemEdit(idx, 'weight', e.target.value)}
                            className="w-16 bg-zinc-950 border border-gold/10 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-gold/30 text-center font-mono"
                          />
                        </td>

                        {/* Metal Rate */}
                        <td className="py-3 pr-4 w-24">
                          <input
                            type="number"
                            step="0.01"
                            value={item.metal_rate}
                            onChange={(e) => handleItemEdit(idx, 'metal_rate', e.target.value)}
                            className="w-20 bg-zinc-950 border border-gold/10 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-gold/30 text-center font-mono"
                          />
                        </td>

                        {/* Wastage */}
                        <td className="py-3 pr-4 w-16">
                          <input
                            type="number"
                            step="0.1"
                            value={item.wastage_percent}
                            onChange={(e) => handleItemEdit(idx, 'wastage_percent', e.target.value)}
                            className="w-12 bg-zinc-950 border border-gold/10 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-gold/30 text-center font-mono"
                          />
                        </td>

                        {/* Making Charges */}
                        <td className="py-3 pr-4 w-24">
                          <input
                            type="number"
                            step="1.0"
                            value={item.making_charge}
                            onChange={(e) => handleItemEdit(idx, 'making_charge', e.target.value)}
                            className="w-20 bg-zinc-950 border border-gold/10 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-gold/30 text-center font-mono"
                          />
                        </td>

                        {/* Taxable Amount */}
                        <td className="py-3 text-right font-semibold text-zinc-300 font-mono">
                          ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Action */}
                        <td className="py-3 text-center">
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-zinc-600 hover:text-luxuryRed-light transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Billing Summary Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-gold/15 bg-zinc-900/35 backdrop-blur-md shadow-goldGlow space-y-6 sticky top-28">
            <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-gold border-b border-gold/10 pb-3">
              Bill Summarization
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-3.5 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Total Weight</span>
                <span className="text-zinc-200 font-mono">{items.reduce((acc, it) => acc + parseFloat(it.weight || 0), 0).toFixed(3)}g</span>
              </div>
              <div className="flex justify-between">
                <span>Taxable Subtotal</span>
                <span className="text-zinc-200 font-mono">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-3">
                <span>GST (3% - SGST 1.5% + CGST 1.5%)</span>
                <span className="text-zinc-200 font-mono">₹{totals.gst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Discount Input */}
              <div className="pt-2">
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Apply Discount (₹)</label>
                  {!isAdmin && <span className="text-[8px] text-zinc-600 font-mono">Max: 5% (₹{Math.floor(totals.taxableAmount * 0.05).toLocaleString()})</span>}
                </div>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-gold/10 rounded px-3 py-2 text-zinc-200 text-xs font-mono focus:outline-none focus:border-gold/30"
                  placeholder="0.00"
                />
              </div>

              {/* Final Amount */}
              <div className="flex justify-between items-baseline pt-4 border-t border-gold/10">
                <span className="text-zinc-300 font-serif font-bold uppercase tracking-wider">Net Payable</span>
                <span className="text-xl font-serif font-bold text-gold font-mono">
                  ₹{totals.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment Fields */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5">Payment Mode</label>
                <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold tracking-wider">
                  {['Cash', 'Card', 'UPI', 'Bank'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode === 'Bank' ? 'Bank Transfer' : mode)}
                      className={`py-2 px-3 rounded border text-center transition-all duration-300 ${paymentMode.includes(mode) ? 'bg-gold/10 border-gold text-gold' : 'bg-zinc-950 border-gold/5 text-zinc-500'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5">Payment Status</label>
                <div className="grid grid-cols-3 gap-2 text-[9px] uppercase font-bold tracking-wider">
                  {['Paid', 'Partial', 'Unpaid'].map(status => (
                    <button
                      key={status}
                      onClick={() => setPaymentStatus(status)}
                      className={`py-2 px-1 rounded border text-center transition-all duration-300 ${paymentStatus === status ? 'bg-gold/10 border-gold text-gold' : 'bg-zinc-950 border-gold/5 text-zinc-500'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5">Ref No. / Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-zinc-950 border border-gold/10 rounded px-3 py-2 text-zinc-300 text-xs focus:outline-none focus:border-gold/30"
                  placeholder="e.g. UPI txn ref number"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateInvoice}
              disabled={loading}
              className="w-full bg-gold-gradient text-black rounded-lg py-4 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:shadow-goldGlowStrong transition-all duration-300 disabled:opacity-50 mt-4"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Generate & Print Invoice'}
            </button>
          </div>
        </div>
      </div>
      </div> {/* End of no-print dashboard wrapper */}

      {/* Invoice Printable Print Overlay Modal */}
      {showPrintModal && successInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl bg-zinc-950 border border-gold/30 rounded-2xl p-6 shadow-goldGlowStrong flex flex-col my-8"
          >
            {/* Modal Actions */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gold/15">
              <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-gold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Invoice Created Successfully
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={triggerPrint}
                  className="px-4 py-2 bg-gold-gradient text-black rounded text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 hover:shadow-goldGlow transition-all duration-300"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setSuccessInvoice(null);
                  }}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded text-[10px] uppercase tracking-widest font-bold"
                >
                  Close Desk
                </button>
              </div>
            </div>

            {/* Printable Frame wrapper */}
            <div className="bg-white text-black p-8 rounded-lg overflow-y-auto max-h-[500px] border border-zinc-200 print-container" id="printable-area">
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
                  <p className="text-[10px] font-semibold text-zinc-500 mt-1">Invoice No: {successInvoice.invoice_number}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Date: {new Date(successInvoice.invoice_date).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-zinc-400">Branch: {successInvoice.branch}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 border-b pb-6 mb-6 text-xs">
                <div>
                  <h4 className="font-bold uppercase text-zinc-500 mb-1 text-[10px]">Billed To:</h4>
                  <p className="font-bold text-zinc-800">{successInvoice.customer?.name}</p>
                  <p className="text-zinc-600 mt-0.5">Phone: {successInvoice.customer?.phone}</p>
                  {successInvoice.customer?.email && <p className="text-zinc-600">Email: {successInvoice.customer?.email}</p>}
                  {successInvoice.customer?.address && <p className="text-zinc-500 mt-1">Address: {successInvoice.customer?.address}</p>}
                </div>
                <div className="text-right text-[10px]">
                  <h4 className="font-bold uppercase text-zinc-500 mb-1">Payment Details:</h4>
                  <p className="text-zinc-700 font-semibold">Payment Status: <span className="uppercase font-bold text-zinc-900">{successInvoice.payment_status}</span></p>
                  <p className="text-zinc-600 mt-0.5">Mode: {successInvoice.payment_mode}</p>
                  {successInvoice.payments?.[0]?.reference_number && (
                    <p className="text-zinc-500">Txn Ref: {successInvoice.payments[0].reference_number}</p>
                  )}
                  <p className="text-zinc-500 mt-2">Billed By: {successInvoice.user?.username}</p>
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
                  {successInvoice.items?.map((item, idx) => {
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
                    <span className="font-mono text-zinc-800">₹{(parseFloat(successInvoice.subtotal) + parseFloat(successInvoice.making_charges_total)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST (1.5%):</span>
                    <span className="font-mono text-zinc-800">₹{(parseFloat(successInvoice.gst_amount) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (1.5%):</span>
                    <span className="font-mono text-zinc-800">₹{(parseFloat(successInvoice.gst_amount) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {parseFloat(successInvoice.discount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount Offered:</span>
                      <span className="font-mono">- ₹{parseFloat(successInvoice.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-zinc-900 border-t pt-2.5">
                    <span>Net Invoice Value:</span>
                    <span className="font-mono">₹{parseFloat(successInvoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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

export default BillingPage;
