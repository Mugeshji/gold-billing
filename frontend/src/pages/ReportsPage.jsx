import React, { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, TrendingUp, DollarSign, Download, PieChart as PieIcon, Sparkles, Printer, Loader } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

const ReportsPage = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // default to 30 days ago
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Invoice Receipt viewer modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      // API expects ISO-formatted datetimes
      const startIso = `${startDate}T00:00:00`;
      const endIso = `${endDate}T23:59:59`;
      const res = await api.get(`/reports/sales?start_date=${startIso}&end_date=${endIso}`);
      setReportData(res.data);
    } catch (err) {
      setError("Failed to fetch reports. Verify date formats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleViewInvoice = async (invoiceId) => {
    try {
      const res = await api.get(`/billing/${invoiceId}`);
      setSelectedInvoice(res.data);
      setShowPrintModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Export reports to Excel (.xlsx)
  const handleExportExcel = () => {
    if (!reportData || !reportData.invoices || reportData.invoices.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ['Invoice Number', 'Date', 'Customer Phone', 'Subtotal (₹)', 'Making Charges (₹)', 'GST (₹)', 'Discount (₹)', 'Total Amount (₹)', 'Status', 'Mode'];
    
    // Format numbers correctly as floats for native Excel calculations
    const rows = reportData.invoices.map(inv => [
      inv.invoice_number,
      new Date(inv.invoice_date).toLocaleDateString('en-IN'),
      inv.customer?.phone || 'N/A',
      parseFloat(inv.subtotal),
      parseFloat(inv.making_charges_total),
      parseFloat(inv.gst_amount),
      parseFloat(inv.discount),
      parseFloat(inv.total_amount),
      inv.payment_status,
      inv.payment_mode
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Set column widths for a clean presentation
    ws['!cols'] = [
      { wch: 22 }, // Invoice Number
      { wch: 12 }, // Date
      { wch: 15 }, // Phone
      { wch: 14 }, // Subtotal
      { wch: 18 }, // Making Charges
      { wch: 12 }, // GST
      { wch: 12 }, // Discount
      { wch: 18 }, // Total Amount
      { wch: 10 }, // Status
      { wch: 12 }  // Mode
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Ledger");
    
    // Generate Base64 to strictly bypass IDM/Download Manager interference
    const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    
    // Create direct data URI link
    const link = document.createElement("a");
    link.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + b64;
    link.download = "Kaiya_Sales_Report.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#D4AF37', '#7A0C0C', '#AA7C11', '#540505', '#F3E5AB'];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="space-y-8 no-print">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wider text-white uppercase">
            Sales & <span className="text-gold-gradient">Taxation Ledgers</span>
          </h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">
            Perform detailed billing audits, calculate tax distributions and export CSV metrics
          </p>
        </div>
        
        <button
          onClick={handleExportExcel}
          className="px-6 py-3 border border-gold/20 hover:border-gold/50 bg-zinc-950/40 text-gold text-xs uppercase tracking-widest font-bold rounded-lg flex items-center justify-center gap-2 hover:shadow-goldGlow transition-all duration-300"
        >
          <Download className="w-4 h-4" /> Export Report (Excel)
        </button>
      </div>

      {/* Date Pickers */}
      <div className="p-6 rounded-xl border border-gold/10 bg-zinc-900/30 backdrop-blur-md flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar className="w-4 h-4 text-gold" />
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Filter Interval:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="w-full sm:w-auto">
            <label className="block text-[8px] uppercase tracking-widest text-zinc-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-950 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/30 w-full"
            />
          </div>
          <span className="text-zinc-600 hidden sm:inline">—</span>
          <div className="w-full sm:w-auto">
            <label className="block text-[8px] uppercase tracking-widest text-zinc-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-950 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/30 w-full"
            />
          </div>
        </div>
      </div>

      {/* Reports Summary */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : error ? (
        <p className="p-4 bg-luxuryRed/15 text-gold-light border border-luxuryRed/35 text-xs rounded">{error}</p>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg border border-gold/10 bg-zinc-950/40 text-center">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">Gross Sales</p>
              <h4 className="font-serif text-lg font-bold text-white mt-1">₹{reportData.summary.total_sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
            </div>
            <div className="p-4 rounded-lg border border-gold/10 bg-zinc-950/40 text-center">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">CGST + SGST (3%)</p>
              <h4 className="font-serif text-lg font-bold text-gold mt-1">₹{reportData.summary.total_gst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
            </div>
            <div className="p-4 rounded-lg border border-gold/10 bg-zinc-950/40 text-center">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">Making Charges</p>
              <h4 className="font-serif text-lg font-bold text-white mt-1">₹{reportData.summary.total_making_charges.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
            </div>
            <div className="p-4 rounded-lg border border-gold/10 bg-zinc-950/40 text-center">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">Discounts Allowed</p>
              <h4 className="font-serif text-lg font-bold text-luxuryRed-light mt-1">₹{reportData.summary.total_discount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
            </div>
            <div className="p-4 rounded-lg border border-gold/10 bg-zinc-950/40 text-center col-span-2 md:col-span-1">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">Invoices Generated</p>
              <h4 className="font-serif text-lg font-bold text-white mt-1">{reportData.summary.invoice_count}</h4>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sales Area Chart */}
            <div className="lg:col-span-2 p-6 rounded-xl border border-gold/10 bg-zinc-900/30 backdrop-blur-md flex flex-col h-[320px]">
              <h3 className="font-serif text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gold" /> Daily Performance Ledger
              </h3>
              <div className="flex-grow min-h-0 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.sales_by_date} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', borderColor: 'rgba(212, 175, 55, 0.3)', color: '#fff', borderRadius: '8px' }}
                      formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#D4AF37" fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Pie Chart */}
            <div className="p-6 rounded-xl border border-gold/10 bg-zinc-900/30 backdrop-blur-md flex flex-col h-[320px]">
              <h3 className="font-serif text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2 mb-4">
                <PieIcon className="w-4 h-4 text-gold" /> Commodity Distribution
              </h3>
              
              {reportData.sales_by_category && reportData.sales_by_category.some(c => c.value > 0) ? (
                <div className="flex-grow min-h-0 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.sales_by_category.filter(c => c.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="category"
                      >
                        {reportData.sales_by_category.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', borderColor: 'rgba(212, 175, 55, 0.3)', color: '#fff', borderRadius: '8px' }}
                        formatter={(val) => [`₹${val.toLocaleString()}`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Chart legend */}
                  <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-3 text-[10px]">
                    {reportData.sales_by_category.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-zinc-400">{item.category} (₹{Math.round(item.value/1000)}K)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 uppercase tracking-widest text-[10px]">
                  No sales category details
                </div>
              )}
            </div>
          </div>

          {/* Audit Transactions list */}
          <div className="p-6 rounded-xl border border-gold/10 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-zinc-300 mb-6">
              Period Audit Transaction Log
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gold/10 text-zinc-500 uppercase tracking-widest pb-3">
                    <th className="py-2.5 font-semibold">Invoice No</th>
                    <th className="py-2.5 font-semibold">Date</th>
                    <th className="py-2.5 font-semibold">Customer Mobile</th>
                    <th className="py-2.5 font-semibold">Making Total</th>
                    <th className="py-2.5 font-semibold">GST (3%)</th>
                    <th className="py-2.5 font-semibold">Net Total</th>
                    <th className="py-2.5 font-semibold">Mode</th>
                    <th className="py-2.5 font-semibold text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {reportData.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-950/20 transition-colors">
                      <td className="py-3 font-semibold text-zinc-200">{inv.invoice_number}</td>
                      <td className="py-3 text-zinc-400">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 font-mono text-zinc-400">{inv.customer?.phone || 'Inline Customer'}</td>
                      <td className="py-3 font-mono text-zinc-400">₹{parseFloat(inv.making_charges_total).toLocaleString('en-IN')}</td>
                      <td className="py-3 font-mono text-zinc-400">₹{parseFloat(inv.gst_amount).toLocaleString('en-IN')}</td>
                      <td className="py-3 font-mono font-semibold text-gold">₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-zinc-400">{inv.payment_mode}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleViewInvoice(inv.id)}
                          className="px-2.5 py-1 bg-gold/5 hover:bg-gold/15 border border-gold/20 hover:border-gold/40 text-gold rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mx-auto transition-colors"
                        >
                          <Printer className="w-2.5 h-2.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      </div> {/* End of no-print dashboard wrapper */}

      {/* REUSED INVOICE PRINT VIEWER OVERLAY */}
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
                Audit Receipt Viewer
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
                  Close Viewer
                </button>
              </div>
            </div>

            {/* Receipt print area */}
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

export default ReportsPage;
