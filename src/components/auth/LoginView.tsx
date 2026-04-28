import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LogIn, ShieldAlert, Wifi, WifiOff, X, Camera } from 'lucide-react';
import { toast } from 'sonner';

export const LoginView: React.FC = () => {
  const { login, state, toggleSystemMode } = useAppContext();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isOnline = state.isOnline;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(identifier, password);
    
    if (!success) {
      setError('Invalid username/email or password. Please check your credentials.');
    }
  };


  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-slate-100 relative overflow-hidden">
        {/* Connectivity Status Manual Toggle */}
        <div className="flex items-center justify-between mb-8 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-none mb-1">
                {isOnline ? 'Online Mode' : 'Offline Mode'}
              </p>
              <p className="text-[10px] text-slate-500">
                {isOnline ? 'Live cloud sync active' : 'Local caching enabled'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSystemMode}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 border ${
              isOnline 
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' 
                : 'bg-brand text-white border-brand hover:brightness-110'
            }`}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>

        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
            CCIS Lab Monitor
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to your account to manage equipment and bookings
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 leading-tight">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Username or Email
              </label>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                placeholder="Username or email@university.edu"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              className="flex w-full justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all active:scale-95"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-6">
          {!isOnline && (
            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start space-x-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                <strong>Offline Mode Active:</strong> Transactions will be stored locally and synced when connection is restored.
              </p>
            </div>
          )}
          <p className="text-center text-[10px] text-slate-400 font-medium font-mono uppercase tracking-tighter">
            System V2.4.0 • Academic Term 2023-2024
          </p>
        </div>
      </div>
    </div>
  );
};

