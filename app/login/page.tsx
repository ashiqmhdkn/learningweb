'use client';

import { useState } from 'react';
import { NextResponse } from 'next/server';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/api/auth-context';
import { loginApi, profileApi } from '@/api/api';
import { Eye, EyeOff, Moon, Star } from 'lucide-react';

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
      const { token} = await loginApi(identifier, password);
      

      // pre-fetch and cache profile data
      try {
        const data = await profileApi(token);
        setAuth(token,data.user);
        localStorage.setItem('cl_data', JSON.stringify(data));
      } catch (_) {
        // non-fatal
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-radial-gold" />
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* Floating orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full opacity-8"
        style={{
          background: 'radial-gradient(circle, #4A6B8A 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Decorative stars */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute opacity-20"
          style={{
            top: `${15 + i * 13}%`,
            left: `${8 + i * 15}%`,
            animation: `fadeIn ${1 + i * 0.3}s ease forwards`,
          }}
        >
          <Star size={i % 2 === 0 ? 8 : 5} color="#C9A84C" fill="#C9A84C" />
        </div>
      ))}

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 fade-up"
        style={{
          background: 'linear-gradient(145deg, rgba(26,29,35,0.95) 0%, rgba(19,22,32,0.98) 100%)',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: '20px',
          padding: '48px 40px',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-5 crescent-ring" style={{ background: 'rgba(201,168,76,0.08)' }}>
            <Moon size={26} color="#C9A84C" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-1 tracking-tight">
            Crescent Learning
          </h1>
          <p className="text-slate-soft text-sm">Sign in to continue your journey</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-soft mb-2 uppercase tracking-wider">
              Email or Username
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
    </div>
  );
}
