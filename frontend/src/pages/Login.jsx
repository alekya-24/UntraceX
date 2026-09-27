import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@untracex.local');
    setPassword('demo1234');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 text-white font-bold text-lg mb-3">
            UX
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">UNTRACEX</h1>
          <p className="text-xs text-slate-500 mt-1">Digital document metadata inspection & cleaning</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-500">Access your private document workspace</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide uppercase rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'LOGIN'}
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Testing?</span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[11px] text-slate-600 hover:text-slate-900 underline"
            >
              Fill demo credentials
            </button>
          </div>
        </div>

        {/* Link to Register */}
        <div className="text-center mt-5 text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-slate-900 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
