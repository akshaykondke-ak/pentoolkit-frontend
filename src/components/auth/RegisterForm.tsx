'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, extractErrorMessage } from '@/lib/api/auth';

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ff4444', '#ffaa00', '#88cc00', '#00ff88'][strength];

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.full_name || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
      });
      // Redirect to verify email — pass email via query param
      router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-8" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-md relative">
        <div className="h-px bg-gradient-to-r from-transparent via-[#00ff88] to-transparent mb-8" />

        {/* Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded border border-[#00ff88]/40 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4l6-2 6 2v6l-6 2-6-2V4z" stroke="#00ff88" strokeWidth="1.2" fill="none"/>
                <path d="M8 2v12M2 4l6 4 6-4" stroke="#00ff88" strokeWidth="1.2" opacity="0.5"/>
              </svg>
            </div>
            <span className="text-[#00ff88] text-lg font-bold tracking-widest uppercase">Pentoolkit</span>
          </div>
          <p className="text-[#4a4a4a] text-xs tracking-wider">SECURITY SCANNING PLATFORM v3.0</p>
        </div>

        <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm p-8" style={{ boxShadow: '0 0 40px rgba(0,255,136,0.04), inset 0 0 40px rgba(0,0,0,0.4)' }}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#00ff88] text-xs">$</span>
              <span className="text-[#666] text-xs tracking-wider">auth --register</span>
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">Create account</h1>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 border border-red-900/50 bg-red-950/30 rounded-sm px-4 py-3 flex items-start gap-3">
              <span className="text-red-400 text-xs mt-0.5">✗</span>
              <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-[#666] text-xs tracking-wider mb-2 uppercase">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333] text-xs select-none">▸</span>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={handleChange('full_name')}
                  className="w-full bg-[#111] border border-[#1f1f1f] rounded-sm pl-8 pr-4 py-2.5 text-[#e0e0e0] text-sm placeholder-[#2a2a2a] focus:outline-none focus:border-[#00ff88]/40 focus:bg-[#0f0f0f] transition-colors"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#666] text-xs tracking-wider mb-2 uppercase">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333] text-xs select-none">▸</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className="w-full bg-[#111] border border-[#1f1f1f] rounded-sm pl-8 pr-4 py-2.5 text-[#e0e0e0] text-sm placeholder-[#2a2a2a] focus:outline-none focus:border-[#00ff88]/40 focus:bg-[#0f0f0f] transition-colors"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#666] text-xs tracking-wider mb-2 uppercase">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333] text-xs select-none">▸</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  className="w-full bg-[#111] border border-[#1f1f1f] rounded-sm pl-8 pr-10 py-2.5 text-[#e0e0e0] text-sm placeholder-[#2a2a2a] focus:outline-none focus:border-[#00ff88]/40 focus:bg-[#0f0f0f] transition-colors"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#666] text-xs transition-colors"
                >
                  {showPassword ? '●' : '○'}
                </button>
              </div>
              {/* Password strength */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-0.5 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= strength ? strengthColor : '#1f1f1f' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[#666] text-xs tracking-wider mb-2 uppercase">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333] text-xs select-none">▸</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={handleChange('confirm')}
                  className={`w-full bg-[#111] border rounded-sm pl-8 pr-4 py-2.5 text-[#e0e0e0] text-sm placeholder-[#2a2a2a] focus:outline-none focus:bg-[#0f0f0f] transition-colors ${
                    form.confirm && form.confirm !== form.password
                      ? 'border-red-900/60 focus:border-red-700/60'
                      : form.confirm && form.confirm === form.password
                      ? 'border-[#00ff88]/30 focus:border-[#00ff88]/50'
                      : 'border-[#1f1f1f] focus:border-[#00ff88]/40'
                  }`}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
                {form.confirm && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${form.confirm === form.password ? 'text-[#00ff88]' : 'text-red-400'}`}>
                    {form.confirm === form.password ? '✓' : '✗'}
                  </span>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00ff88]/10 border border-[#00ff88]/30 hover:bg-[#00ff88]/15 hover:border-[#00ff88]/60 text-[#00ff88] text-sm font-bold py-2.5 rounded-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed tracking-widest uppercase mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border border-[#00ff88]/40 border-t-[#00ff88] rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                '→ Create Account'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            <span className="text-[#333] text-xs">or</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>

          <p className="text-center text-[#444] text-xs">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#00ff88]/70 hover:text-[#00ff88] transition-colors">
              Sign in →
            </Link>
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#00ff88]/20 to-transparent mt-8" />
        <p className="text-center text-[#2a2a2a] text-xs mt-3 tracking-widest">AUTHORIZED ACCESS ONLY</p>
      </div>
    </div>
  );
}