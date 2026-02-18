'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { extractErrorMessage } from '@/lib/api/auth';

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('All fields are required');
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      setError(extractErrorMessage(err));
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
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#00ff88] to-transparent mb-8" />

        {/* Logo / Brand */}
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

        {/* Card */}
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm p-8" style={{ boxShadow: '0 0 40px rgba(0,255,136,0.04), inset 0 0 40px rgba(0,0,0,0.4)' }}>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#00ff88] text-xs">$</span>
              <span className="text-[#666] text-xs tracking-wider">auth --login</span>
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">Sign in</h1>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 border border-red-900/50 bg-red-950/30 rounded-sm px-4 py-3 flex items-start gap-3">
              <span className="text-red-400 text-xs mt-0.5">✗</span>
              <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[#666] text-xs tracking-wider mb-2 uppercase">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333] text-xs select-none">▸</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111] border border-[#1f1f1f] rounded-sm pl-8 pr-10 py-2.5 text-[#e0e0e0] text-sm placeholder-[#2a2a2a] focus:outline-none focus:border-[#00ff88]/40 focus:bg-[#0f0f0f] transition-colors"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#666] text-xs transition-colors"
                >
                  {showPassword ? '●' : '○'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative bg-[#00ff88]/10 border border-[#00ff88]/30 hover:bg-[#00ff88]/15 hover:border-[#00ff88]/60 text-[#00ff88] text-sm font-bold py-2.5 rounded-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed tracking-widest uppercase mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border border-[#00ff88]/40 border-t-[#00ff88] rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                '→ Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            <span className="text-[#333] text-xs">or</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>

          {/* Register link */}
          <p className="text-center text-[#444] text-xs">
            No account?{' '}
            <Link href="/auth/register" className="text-[#00ff88]/70 hover:text-[#00ff88] transition-colors">
              Create one →
            </Link>
          </p>
        </div>

        {/* Bottom accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#00ff88]/20 to-transparent mt-8" />
        <p className="text-center text-[#2a2a2a] text-xs mt-3 tracking-widest">AUTHORIZED ACCESS ONLY</p>
      </div>
    </div>
  );
}


// 'use client';

// import { useState } from 'react';
// import { useAuth } from '@/lib/hooks/useAuth';

// export default function LoginForm() {
//   const { login, isLoading, error } = useAuth();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [localError, setLocalError] = useState('');

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLocalError('');

//     if (!email || !password) {
//       setLocalError('Please fill in all fields');
//       return;
//     }

//     try {
//       await login(email, password);
//     } catch (err: any) {
//       setLocalError(err.response?.data?.detail || 'Login failed');
//     }
//   };

//   const displayError = localError || error;

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="w-full max-w-md space-y-8">
//         {/* Header */}
//         <div className="text-center">
//           <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
//             Sign in to Pentoolkit
//           </h2>
//           <p className="mt-2 text-sm text-gray-600">
//             Security scanning platform
//           </p>
//         </div>

//         {/* Form */}
//         <form className="space-y-6" onSubmit={handleSubmit}>
//           {/* Error Message */}
//           {displayError && (
//             <div className="rounded-md bg-red-50 p-4">
//               <p className="text-sm font-medium text-red-800">{displayError}</p>
//             </div>
//           )}

//           {/* Email */}
//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//               Email address
//             </label>
//             <input
//               id="email"
//               name="email"
//               type="email"
//               autoComplete="email"
//               required
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="mt-1 block w-full rounded-md border text-black border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
//               placeholder="you@example.com"
//             />
//           </div>

//           {/* Password */}
//           <div>
//             <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//               Password
//             </label>
//             <input
//               id="password"
//               name="password"
//               type="password"
//               autoComplete="current-password"
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="mt-1 block w-full rounded-md border text-black border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
//               placeholder="••••••••"
//             />
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full rounded-md bg-blue-600 py-2 px-4 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isLoading ? 'Signing in...' : 'Sign in'}
//           </button>
//         </form>

//         {/* Footer */}
//         <p className="text-center text-sm text-gray-600">
//           Don't have an account?{' '}
//           <a href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
//             Sign up
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// }