import React, { useState } from 'react';
import { Lock, Phone, Loader2, ShieldCheck } from 'lucide-react';
import { login } from '../utils/auth';
import { motion } from 'framer-motion';

interface LoginFormProps {
  onSuccess: (token: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [mobile, setMobile] = useState('1234557890');
  const [password, setPassword] = useState('1234557890');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await login(mobile, password);
      onSuccess(token);
    } catch (err: any) {
      setError(err || 'Security check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-black/5 rounded-[2.5rem] p-12 w-full max-w-sm shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]"
    >
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/20">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-zinc-900">Auth</h2>
        <p className="text-zinc-500 text-sm font-medium mt-1">Personnel Authorization</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Personnel ID</label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              className="w-full bg-zinc-50 border border-black/5 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-300"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Access Token</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="password" 
              className="w-full bg-zinc-50 border border-black/5 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold animate-in fade-in">
             {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-200 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            'Authorize'
          )}
        </button>
      </form>
    </motion.div>
  );
};
