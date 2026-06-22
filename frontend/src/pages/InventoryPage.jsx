import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, Filter, Sparkles, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InventoryPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Gold');
  const [purity, setPurity] = useState('22K');
  const [weight, setWeight] = useState(0);
  const [count, setCount] = useState(0);
  const [pricePerGram, setPricePerGram] = useState(0);
  const [makingCharge, setMakingCharge] = useState(0);
  const [wastagePercentage, setWastagePercentage] = useState(0);

  const isAdmin = user?.role === 'Admin';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/products/?skip=0&limit=100`;
      if (search) url += `&search=${search}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      
      const res = await api.get(url);
      setProducts(res.data);
    } catch (err) {
      setError("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  const resetForm = () => {
    setCode('');
    setName('');
    setCategory('Gold');
    setPurity('22K');
    setWeight(0);
    setCount(0);
    setPricePerGram(0);
    setMakingCharge(0);
    setWastagePercentage(0);
    setError('');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!code || !name || weight <= 0 || count < 0) {
      setError("Please fill in all required fields with valid quantities.");
      return;
    }

    const payload = {
      code,
      name,
      category,
      purity,
      weight: parseFloat(weight),
      count: parseInt(count),
      price_per_gram: parseFloat(pricePerGram),
      making_charge_per_gram: parseFloat(makingCharge),
      wastage_percentage: parseFloat(wastagePercentage)
    };

    try {
      await api.post('/products/', payload);
      setSuccess("Product added successfully to catalog!");
      setShowAddModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create catalog product");
    }
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setCode(product.code);
    setName(product.name);
    setCategory(product.category);
    setPurity(product.purity);
    setWeight(product.weight);
    setCount(product.count);
    setPricePerGram(product.price_per_gram);
    setMakingCharge(product.making_charge_per_gram);
    setWastagePercentage(product.wastage_percentage);
    setShowEditModal(true);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      code,
      name,
      category,
      purity,
      weight: parseFloat(weight),
      count: parseInt(count),
      price_per_gram: parseFloat(pricePerGram),
      making_charge_per_gram: parseFloat(makingCharge),
      wastage_percentage: parseFloat(wastagePercentage)
    };

    try {
      await api.put(`/products/${selectedProduct.id}`, payload);
      setSuccess("Product updated successfully!");
      setShowEditModal(false);
      resetForm();
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update product details");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you absolutely sure you want to retire this product from inventory? This action is irreversible.")) {
      return;
    }
    setError('');
    try {
      await api.delete(`/products/${productId}`);
      setSuccess("Product deleted successfully from catalog.");
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Only showroom administrators can delete inventory entries.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wider text-white uppercase">
            Inventory <span className="text-gold-gradient">Showcase</span>
          </h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">
            Manage jewelry items, catalog SKUs, and metal weights
          </p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-6 py-3 bg-gold-gradient text-black rounded-lg text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:shadow-goldGlowStrong transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Add Catalog Piece
          </button>
        )}
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs uppercase tracking-wider rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-zinc-400 hover:text-emerald-300"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/40 border border-gold/15 rounded-lg pl-12 pr-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-gold/50 focus:shadow-goldGlow"
            placeholder="Search catalog by name, model details or SKU..."
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-zinc-900/40 border border-gold/15 rounded-lg pl-12 pr-4 py-3 text-xs text-zinc-400 focus:outline-none focus:border-gold/50 focus:shadow-goldGlow appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Gold">Gold Jewelry</option>
            <option value="Silver">Silver Jewelry</option>
            <option value="Diamond">Diamond Jewelry</option>
            <option value="Other">Other Accessories</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="p-6 rounded-xl border border-gold/10 bg-zinc-900/30 backdrop-blur-md">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-zinc-600 uppercase tracking-widest">
            No products found matching criteria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-gold/10 text-zinc-500 uppercase tracking-widest pb-3">
                  <th className="py-3 font-semibold">SKU Code</th>
                  <th className="py-3 font-semibold">Jewel Name</th>
                  <th className="py-3 font-semibold">Purity</th>
                  <th className="py-3 font-semibold">Weight (g)</th>
                  <th className="py-3 font-semibold">Base Rate (₹/g)</th>
                  <th className="py-3 font-semibold">Making (₹/g)</th>
                  <th className="py-3 font-semibold">Stock Qty</th>
                  <th className="py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-zinc-950/20 transition-colors duration-200">
                    <td className="py-4 font-mono font-bold text-gold">{prod.code}</td>
                    <td className="py-4">
                      <p className="font-semibold text-zinc-200">{prod.name}</p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">{prod.category}</p>
                    </td>
                    <td className="py-4 uppercase text-zinc-400">{prod.purity}</td>
                    <td className="py-4 font-mono text-zinc-300">{parseFloat(prod.weight).toFixed(3)}g</td>
                    <td className="py-4 font-mono text-zinc-300">₹{parseFloat(prod.price_per_gram).toLocaleString()}</td>
                    <td className="py-4 font-mono text-zinc-300">₹{parseFloat(prod.making_charge_per_gram).toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prod.count < 5 ? 'bg-luxuryRed/25 text-gold-light border border-luxuryRed/50' : 'bg-zinc-950 border border-zinc-800 text-zinc-400'}`}>
                        {prod.count} pcs
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          disabled={!isAdmin}
                          className={`p-1 transition-colors duration-200 ${isAdmin ? 'text-zinc-500 hover:text-gold' : 'text-zinc-700 opacity-40 cursor-not-allowed'}`}
                          title={isAdmin ? "Edit item" : "Editing restricted to Admin"}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          disabled={!isAdmin}
                          className={`p-1 transition-colors duration-200 ${isAdmin ? 'text-zinc-500 hover:text-luxuryRed-light' : 'text-zinc-700 opacity-40 cursor-not-allowed'}`}
                          title={isAdmin ? "Delete item" : "Deletion restricted to Admin"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD PRODUCT */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-950 border border-gold/25 rounded-xl p-6 shadow-goldGlowStrong overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-gold/10 pb-3 mb-4">
                <h3 className="font-serif text-base font-bold uppercase tracking-widest text-gold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Add Catalog Piece
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-gold">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && <p className="p-3 mb-4 bg-luxuryRed/15 text-gold-light text-xs rounded border border-luxuryRed/35">{error}</p>}

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">SKU / Code *</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                      placeholder="e.g. PRD-G105"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Jewel Item Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                      placeholder="e.g. Diamond Pearl Earring"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                    >
                      <option value="Gold">Gold</option>
                      <option value="Silver">Silver</option>
                      <option value="Diamond">Diamond</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Purity / Hallmark</label>
                    <input
                      type="text"
                      value={purity}
                      onChange={(e) => setPurity(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                      placeholder="e.g. 22K, 925"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Weight (g) *</label>
                    <input
                      type="number"
                      step="0.001"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Base Rate (₹/g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricePerGram}
                      onChange={(e) => setPricePerGram(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Stock Qty *</label>
                    <input
                      type="number"
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Making Charge (₹/g)</label>
                    <input
                      type="number"
                      step="1"
                      value={makingCharge}
                      onChange={(e) => setMakingCharge(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Wastage Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={wastagePercentage}
                      onChange={(e) => setWastagePercentage(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-gradient text-black rounded-lg py-3 text-xs uppercase tracking-widest font-bold hover:shadow-goldGlowStrong transition-all duration-300"
                >
                  Save to Showroom Catalog
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT PRODUCT */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-950 border border-gold/25 rounded-xl p-6 shadow-goldGlowStrong overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-gold/10 pb-3 mb-4">
                <h3 className="font-serif text-base font-bold uppercase tracking-widest text-gold flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Catalog Piece
                </h3>
                <button onClick={() => { setShowEditModal(false); setSelectedProduct(null); }} className="text-zinc-500 hover:text-gold">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && <p className="p-3 mb-4 bg-luxuryRed/15 text-gold-light text-xs rounded border border-luxuryRed/35">{error}</p>}

              <form onSubmit={handleEditProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">SKU / Code *</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Jewel Item Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                    >
                      <option value="Gold">Gold</option>
                      <option value="Silver">Silver</option>
                      <option value="Diamond">Diamond</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Purity / Hallmark</label>
                    <input
                      type="text"
                      value={purity}
                      onChange={(e) => setPurity(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Weight (g) *</label>
                    <input
                      type="number"
                      step="0.001"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Base Rate (₹/g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricePerGram}
                      onChange={(e) => setPricePerGram(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Stock Qty *</label>
                    <input
                      type="number"
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Making Charge (₹/g)</label>
                    <input
                      type="number"
                      step="1"
                      value={makingCharge}
                      onChange={(e) => setMakingCharge(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Wastage Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={wastagePercentage}
                      onChange={(e) => setWastagePercentage(e.target.value)}
                      className="w-full bg-zinc-900 border border-gold/10 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-gold/50 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-gradient text-black rounded-lg py-3 text-xs uppercase tracking-widest font-bold hover:shadow-goldGlowStrong transition-all duration-300"
                >
                  Save Modifications
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPage;
