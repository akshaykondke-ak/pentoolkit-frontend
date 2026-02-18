'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI, extractErrorMessage } from '@/lib/api/auth';

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    // Allow only single digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === 5 && next.every((d) => d)) {
      handleVerify(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setOtp(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) {
      setError('Enter all 6 digits');
      return;
    }
    if (!email) {
      setError('Email not found. Please register again.');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      await authAPI.verifyEmail(email, otpCode);
      setSuccess('Email verified! Redirecting to login...');
      setTimeout(() => router.push('/auth/login'), 1500);
    } catch (err: any) {
      setError(extractErrorMessage(err));
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setIsResending(true);
    setError('');
    try {
      await authAPI.resendOTP(email);
      setSuccess('New code sent! Check your inbox.');
      setResendCooldown(60);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
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
              <span className="text-[#666] text-xs tracking-wider">auth --verify-email</span>
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">Verify your email</h1>
            <p className="text-[#444] text-xs mt-2 leading-relaxed">
              A 6-digit code was sent to{' '}
              <span className="text-[#888]">{email || 'your email'}</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 border border-red-900/50 bg-red-950/30 rounded-sm px-4 py-3 flex items-start gap-3">
              <span className="text-red-400 text-xs mt-0.5">✗</span>
              <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 border border-[#00ff88]/30 bg-[#00ff88]/5 rounded-sm px-4 py-3 flex items-start gap-3">
              <span className="text-[#00ff88] text-xs mt-0.5">✓</span>
              <p className="text-[#00ff88] text-xs leading-relaxed">{success}</p>
            </div>
          )}

          {/* OTP Inputs */}
          <div className="mb-6">
            <label className="block text-[#666] text-xs tracking-wider mb-4 uppercase">Enter Code</label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={isVerifying}
                  className={`w-11 h-13 text-center text-xl font-bold bg-[#111] border rounded-sm py-3 text-[#e0e0e0] focus:outline-none transition-all duration-200 disabled:opacity-40 ${
                    digit
                      ? 'border-[#00ff88]/40 text-[#00ff88]'
                      : 'border-[#1f1f1f] focus:border-[#00ff88]/30'
                  }`}
                  style={{ width: '44px', height: '52px' }}
                />
              ))}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1 mt-3">
              {otp.map((d, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full transition-all duration-200"
                  style={{ backgroundColor: d ? '#00ff88' : '#1f1f1f' }}
                />
              ))}
            </div>
          </div>

          {/* Verify button */}
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={isVerifying || otp.some((d) => !d)}
            className="w-full bg-[#00ff88]/10 border border-[#00ff88]/30 hover:bg-[#00ff88]/15 hover:border-[#00ff88]/60 text-[#00ff88] text-sm font-bold py-2.5 rounded-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed tracking-widest uppercase"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border border-[#00ff88]/40 border-t-[#00ff88] rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              '→ Verify Email'
            )}
          </button>

          {/* Resend */}
          <div className="mt-5 text-center">
            <p className="text-[#444] text-xs mb-2">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="text-xs text-[#00ff88]/60 hover:text-[#00ff88] disabled:text-[#333] disabled:cursor-not-allowed transition-colors"
            >
              {isResending
                ? 'Sending...'
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend code →'}
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>

          <p className="text-center text-[#444] text-xs">
            Wrong account?{' '}
            <Link href="/auth/register" className="text-[#00ff88]/70 hover:text-[#00ff88] transition-colors">
              Register again →
            </Link>
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#00ff88]/20 to-transparent mt-8" />
        <p className="text-center text-[#2a2a2a] text-xs mt-3 tracking-widest">AUTHORIZED ACCESS ONLY</p>
      </div>
    </div>
  );
}