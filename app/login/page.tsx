'use client';

import { useState } from 'react';
import { NextResponse } from 'next/server';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/api/auth-context';
import { loginApi, profileApi } from '@/api/api';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token } = await loginApi(identifier, password);
      console.log('Login successful with token:', token);
      // pre-fetch and cache profile data
      try {
        const data = await profileApi(token);
        console.log('Profile data fetched on login:', data);
        setAuth(token, data.user);
        localStorage.setItem('cl_data', JSON.stringify(data));
      } catch (_) {
        // non-fatal
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#f7f8ab' }}>
      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 fade-up"
        style={{
          background: 'linear-gradient(145deg, rgba(20, 62, 154, 0.95) 90%, rgba(239, 240, 245, 0.98) 100%)',
          border: '1px solid rgb(254, 254, 254)',
          borderRadius: '30px',
          padding: '48px 40px',

        }}
      >
        {/* Logo area */}
        <div className="text-center space-y-5">
          <div className="flex justify-center ">
            <Image
              src="/logo.png"
              alt="Crescent Learning Logo"
              width={64}
              height={64}
              className="rounded-lg"
            />
          </div>

          <h1 className="font-display text-3xl font-bold text-white tracking-tight " style={{ marginBottom: '16px' }}>
            Crescent Learning
          </h1>

        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-soft mb-2 uppercase tracking-wider">
              Email
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="you@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-soft mb-2 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-soft hover:text-gold transition-colors"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="text-sm px-4 py-3 rounded-lg"
              style={{ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: '#FC8181' }}
            >
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="btn-gold w-full flex items-center justify-center gap-2 h-12"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-ink/50 border-t-ink rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-dim mt-8">
          © 2025 Crescent Learning. All rights reserved.
        </p>
      </div>
    </div >
  );
}
