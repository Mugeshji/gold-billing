import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import BillingPage from './pages/BillingPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';

import IntroSplash from './components/IntroSplash';
import { 
  Diamond, LayoutDashboard, FileText, Package, Users, 
  BarChart3, LogOut, User as UserIcon, Menu, X, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const { user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  // Auto-route logged in users to dashboard if they are on landing or login pages
  useEffect(() => {
    if (user && (currentPage === 'landing' || currentPage === 'login')) {
      setCurrentPage('dashboard');
    } else if (!user && currentPage !== 'landing') {
      setCurrentPage('landing');
    }
  }, [user]);

  // Show intro splash on first load before anything else
  if (!introComplete) {
    return <IntroSplash onComplete={() => setIntroComplete(true)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Diamond className="w-8 h-8 text-gold animate-pulse" />
      </div>
    );
  }

  // Guest view routing (Landing, Login, Register)
  if (!user) {
    if (currentPage === 'landing') {
      return <LandingPage onNavigate={setCurrentPage} />;
    }
    return <AuthPage onNavigate={setCurrentPage} />;
  }

  // Dashboard sidebar links
  const isAdmin = user?.role === 'Admin';
  
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', name: 'Billing Desk', icon: FileText },
    { id: 'inventory', name: 'Inventory SKU', icon: Package },
    { id: 'customers', name: 'Customer CRM', icon: Users },
    ...(isAdmin ? [{ id: 'reports', name: 'Sales Reports', icon: BarChart3 }] : [])
  ];

  const handleLogout = () => {
    logout();
    setCurrentPage('landing');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'billing':
        return <BillingPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'customers':
        return <CustomersPage />;
      case 'reports':
        return isAdmin ? <ReportsPage /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  const activePageName = menuItems.find(item => item.id === currentPage)?.name || 'Showroom Portal';

  return (
    <div className="min-h-screen flex text-zinc-100 relative">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-luxuryRed/5 rounded-full filter blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/3 rounded-full filter blur-[120px] pointer-events-none z-0"></div>

      {/* MOBILE HEADER (no-print hides it during printing) */}
      <header className="lg:hidden w-full h-16 border-b border-gold/10 glass-panel fixed top-0 left-0 right-0 z-40 px-6 flex justify-between items-center no-print">
        <div className="flex items-center gap-2">
          <Diamond className="w-5 h-5 text-gold" />
          <span className="font-serif text-lg font-bold tracking-widest text-gold-gradient">KAIYA</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{activePageName}</span>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 border border-gold/20 rounded hover:border-gold/50 text-gold"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION PANEL (no-print hides it during printing) */}
      <nav className={`
        fixed lg:sticky top-0 bottom-0 left-0 z-50
        w-64 h-screen border-r border-gold/10 glass-panel no-print
        flex flex-col justify-between py-6 px-4
        transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand/Logo */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 border border-gold/50 rounded-full flex items-center justify-center shadow-goldGlow">
              <Diamond className="w-4.5 h-4.5 text-gold" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-widest text-gold-gradient block">KAIYA</span>
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono block mt-0.5">Showroom Systems</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1.5 pt-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full py-3 px-4 rounded-lg text-xs uppercase tracking-widest font-semibold
                    flex items-center gap-3.5 transition-all duration-300 border
                    ${isActive 
                      ? 'bg-gold/10 border-gold/40 text-gold shadow-goldGlow' 
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'}
                  `}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-gold' : 'text-zinc-500'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="space-y-4 pt-6 border-t border-gold/10">
          <div className="flex items-center gap-3 px-2 py-1 bg-zinc-950/40 border border-gold/5 rounded-lg">
            <div className="p-2 bg-luxuryRed/25 border border-luxuryRed/40 rounded-full">
              <UserIcon className="w-4.5 h-4.5 text-gold" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">{user.username}</p>
              <span className="text-[9px] text-gold uppercase tracking-widest font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 border border-luxuryRed/30 hover:border-luxuryRed/60 bg-luxuryRed/5 hover:bg-luxuryRed/15 text-gold-light rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all duration-300"
          >
            <LogOut className="w-4 h-4" /> End Session
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow min-h-screen flex flex-col p-6 md:p-10 lg:p-12 pt-24 lg:pt-12 z-10 w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex-grow w-full"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
