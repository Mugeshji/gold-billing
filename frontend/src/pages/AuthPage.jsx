import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Diamond, Eye, EyeOff, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthPage = ({ onNavigate }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff'); // Staff, Admin
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await login(username, password);
        onNavigate('dashboard');
      } else {
        await register(username, password, role);
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setError('Registration successful! Please login with your credentials.');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-transparent">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-luxuryRed/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-goldGlow border border-gold/15"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 border border-gold/50 rounded-full flex items-center justify-center shadow-goldGlow mb-3">
            <Diamond className="w-6 h-6 text-gold" />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-widest text-gold-gradient uppercase">
            KAIYA PORTAL
          </h2>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">
            {isLogin ? 'Enter Credentials to Access' : 'Create Showroom Operator Account'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`p-4 mb-6 rounded-lg text-xs uppercase tracking-wider ${error.includes('successful') ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400' : 'bg-luxuryRed/10 border border-luxuryRed/30 text-gold-light'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1.5">
              Operator Username
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950/80 border border-gold/15 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-gold/50 focus:shadow-goldGlow transition-all duration-300"
              placeholder="e.g. aditya_manager"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1.5">
              Secure PIN / Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/80 border border-gold/15 rounded-lg pl-4 pr-12 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-gold/50 focus:shadow-goldGlow transition-all duration-300"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-gold transition-colors duration-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role selection - Registration Only */}
          {!isLogin && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1.5">
                Assign System Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('Staff')}
                  className={`py-2 px-4 rounded-lg text-xs uppercase tracking-widest border font-semibold transition-all duration-300 ${role === 'Staff' ? 'bg-gold/10 border-gold text-gold' : 'bg-zinc-950/60 border-gold/10 text-zinc-500'}`}
                >
                  Staff Operator
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Admin')}
                  className={`py-2 px-4 rounded-lg text-xs uppercase tracking-widest border font-semibold transition-all duration-300 ${role === 'Admin' ? 'bg-gold/10 border-gold text-gold' : 'bg-zinc-950/60 border-gold/10 text-zinc-500'}`}
                >
                  Administrator
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-gradient text-black rounded-lg py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:shadow-goldGlowStrong transition-all duration-300 disabled:opacity-50 mt-6"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              isLogin ? 'Verify Access' : 'Establish Operator'
            )}
          </button>
        </form>

        {/* Toggle Form Type */}
        <div className="mt-8 pt-6 border-t border-gold/10 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setUsername('');
              setPassword('');
            }}
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-gold transition-colors duration-300"
          >
            {isLogin ? "Need a showroom operator account? Register" : "Already established? Sign in to portal"}
          </button>
        </div>

        {/* Guest Credentials for Fast Sandbox testing */}
        {isLogin && (
          <div className="mt-6 p-4 rounded-lg border border-gold/5 bg-zinc-950/50 text-center text-[10px] text-zinc-500 tracking-wider">
            <span className="text-gold font-semibold uppercase">Sandbox Credentials:</span><br/>
            Admin: <span className="text-zinc-300">admin</span> / <span className="text-zinc-300">admin123</span><br/>
            Staff: <span className="text-zinc-300">staff</span> / <span className="text-zinc-300">staff123</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthPage;
