import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LogIn, ShieldAlert, Wifi, WifiOff, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const { login, addUser, state, toggleSystemMode } = useAppContext();
  const [isSignup, setIsSignup] = useState(false);
  const [signupStep, setSignupStep] = useState<'base' | 'verify' | 'profile'>('base');
  
  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Signup State
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Profile State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [idNumber, setIdNumber] = useState('');
  const [departmentOrCourse, setDepartmentOrCourse] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const isOnline = state.isOnline;

  const handleBaseSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (data.exists) {
        // Step: Verification
        setSignupStep('verify');
        // In a real app we'd trigger an email here
        toast.info('Email exists. Verification link sent.');
      } else {
        // Step: Profile Creation
        setSignupStep('profile');
      }
    } catch (err) {
      setError('Failed to check email. Please try again.');
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.users.some(u => u.username === username || u.idNumber === idNumber)) {
      setError('Username or ID Number already exists.');
      return;
    }

    try {
      addUser({
        qrCode: `QR-${Date.now()}`,
        name,
        username,
        email,
        password: signupPassword,
        role,
        idNumber,
        departmentOrCourse,
        contactInfo
      });
      toast.success('Account created successfully. Please log in.');
      resetSignup();
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    }
  };

  const resetSignup = () => {
    setIsSignup(false);
    setSignupStep('base');
    setError('');
    setEmail('');
    setSignupPassword('');
    setConfirmPassword('');
    setName('');
    setUsername('');
    setIdNumber('');
    setDepartmentOrCourse('');
    setContactInfo('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(identifier, password);
    
    if (!success) {
      setError('Invalid username/email or password. Please check your credentials.');
    }
  };


  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
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
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-xl bg-white overflow-hidden p-1 shadow-sm border border-slate-100 mb-2">
            <img 
              src={state.settings?.logoUrl || '/logo-placeholder.svg'} 
              alt="Lab Logo" 
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {isSignup ? 'Create an Account' : `${state.settings.labName} Management and Monitoring`}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isSignup ? 'Sign up to request and borrow equipment' : 'Sign in to manage equipment and monitoring'}
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 leading-tight">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isSignup ? (
          <form className="mt-8 space-y-4" onSubmit={handleLoginSubmit}>
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

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all active:scale-95"
              >
                Sign In
              </button>
            </div>
            
            <p className="mt-4 text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => { setIsSignup(true); setSignupStep('base'); setError(''); }} 
                className="font-semibold text-brand hover:underline"
              >
                Sign up
              </button>
            </p>
          </form>
        ) : signupStep === 'base' ? (
          <form className="mt-8 space-y-4" onSubmit={handleBaseSignupSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="signupEmail" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  id="signupEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="signupPassword" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  id="signupPassword"
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all active:scale-95"
              >
                Continue
              </button>
              <button 
                type="button" 
                onClick={resetSignup} 
                className="w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : signupStep === 'verify' ? (
          <div className="mt-8 space-y-6 text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <Wifi className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Verify Your Identity</h3>
              <p className="text-sm text-slate-600 leading-relaxed px-4">
                We found an existing account for <strong>{email}</strong>. 
                A verification link has been sent to your inbox. Please check your email and click the link to confirm your identity.
              </p>
            </div>
            <div className="pt-4">
              <button 
                onClick={resetSignup}
                className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleProfileSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="username" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                    placeholder="johndoe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="idNumber" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    ID Number
                  </label>
                  <input
                    id="idNumber"
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                    placeholder="2024-0001"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="departmentOrCourse" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Department / Course
                </label>
                <input
                  id="departmentOrCourse"
                  type="text"
                  required
                  value={departmentOrCourse}
                  onChange={(e) => setDepartmentOrCourse(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  placeholder="BSCS / IT Dept"
                />
              </div>

              <div>
                <label htmlFor="contactInfo" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Contact Number
                </label>
                <input
                  id="contactInfo"
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  placeholder="09123456789"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all active:scale-95"
              >
                Complete Profile
              </button>
              <button 
                type="button" 
                onClick={() => setSignupStep('base')} 
                className="w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Go Back
              </button>
            </div>
          </form>
        )}

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


