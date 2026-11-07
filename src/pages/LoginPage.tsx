import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  
  // Check for saved Remember Me credentials
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('renewly_remember_email') || '';
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem('renewly_remember_pass') || '';
  });
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('renewly_remember_me') === 'true';
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (!success) {
      setError('Invalid email or password. Access is restricted to authorized personnel.');
    } else {
      setError(null);
      if (rememberMe) {
        localStorage.setItem('renewly_remember_me', 'true');
        localStorage.setItem('renewly_remember_email', email);
        localStorage.setItem('renewly_remember_pass', password);
      } else {
        localStorage.removeItem('renewly_remember_me');
        localStorage.removeItem('renewly_remember_email');
        localStorage.removeItem('renewly_remember_pass');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
      {/* LEFT SIDE: Clean White / Off-White Panel with Big Logo, Tagline, & Version */}
      <div className="lg:w-1/2 bg-[#f8fafc] dark:bg-slate-900/40 p-8 sm:p-14 lg:p-20 flex flex-col justify-between items-center text-center relative border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
        <div className="w-full flex justify-end">
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700">
            v1.0.1
          </span>
        </div>

        {/* Center: Big Logo only */}
        <div className="my-auto py-12 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Renewly Logo"
            className="h-36 sm:h-44 md:h-52 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Bottom clean version */}
        <div className="w-full text-center text-xs text-slate-400">
          <span>Renewly Infrastructure Suite &bull; v1.0.1</span>
        </div>
      </div>

      {/* RIGHT SIDE: Sharp (no rounded corners), Clean Edge-to-Edge Form Container */}
      <div className="lg:w-1/2 bg-slate-950 p-6 sm:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Flat, Sharp Bordered Form Container without roundings */}
          <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 shadow-2xl rounded-none">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Sign In</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                Authenticate your administrative credentials to manage renewals.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300 flex items-center gap-2 rounded-none">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email address"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 rounded-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 rounded-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Working Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-none border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <span>Remember my credentials</span>
                </label>
                <span className="text-[11px] text-slate-500">Root Access</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-none shadow-lg shadow-indigo-600/25 transition duration-150 flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Authorize &amp; Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
