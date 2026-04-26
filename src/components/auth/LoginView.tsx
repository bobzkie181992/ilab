import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LogIn, ShieldAlert } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, state } = useAppContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email);
    if (!success) {
      setError('Invalid email address. Please use a registered institutional email.');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <ShieldAlert className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Institutional Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="email@university.edu"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <p className="text-center text-xs text-slate-400">
            Available Mock Accounts:
            <br />
            admin@university.edu (Admin)
            <br />
            alice.s@university.edu (Student)
            <br />
            echen@university.edu (Faculty)
          </p>
        </div>
      </div>
    </div>
  );
};
