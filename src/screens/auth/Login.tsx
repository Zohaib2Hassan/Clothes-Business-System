import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useState } from 'react';
import Logo from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, verify2FA, resend2FA } = useAuth();
  
  // Login credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2FA state
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [devCode, setDevCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendMessage('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else if (result.requires2FA) {
      setIs2FAStep(true);
      setTempToken(result.tempToken || '');
      setDevCode(result.devCode || '');
      setEmailSent(Boolean(result.emailSent));
      setError('');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendMessage('');

    if (!twoFactorCode.trim()) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    const result = await verify2FA(twoFactorCode.trim(), tempToken, email);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Verification failed. Please check the code.');
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setResendMessage('');

    const res = await resend2FA(tempToken, email);
    setIsResending(false);

    if (res.success) {
      if (res.devCode) setDevCode(res.devCode);
      setEmailSent(Boolean(res.emailSent));
      setResendMessage(res.message || 'Verification code resent successfully.');
    } else {
      setError(res.message || 'Failed to resend code');
    }
  };

  const handleBackToLogin = () => {
    setIs2FAStep(false);
    setTwoFactorCode('');
    setError('');
    setResendMessage('');
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-brand-100 blur-3xl opacity-50"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-brand-100 blur-3xl opacity-50"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          
          {/* STEP 1: REGULAR LOGIN FORM */}
          {!is2FAStep ? (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="bg-brand-50 p-4 rounded-2xl mb-4 text-brand-800">
                  <Logo className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
                <p className="text-gray-500 text-sm mt-1">Sign in to manage your business.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <Link to="/forgot-password" className="text-xs font-medium text-brand-800 hover:text-brand-900">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full py-3.5 text-base mt-6" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-8">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-brand-800 hover:text-brand-900 transition-colors">
                  Sign Up
                </Link>
              </p>
            </>
          ) : (
            /* STEP 2: TWO-FACTOR AUTHENTICATION FORM */
            <div>
              <div className="flex flex-col items-center mb-6">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl mb-4">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Two-Factor Authentication</h1>
                <p className="text-gray-500 text-sm mt-1 text-center">
                  {emailSent ? (
                    <>A verification code has been sent to <span className="font-semibold text-gray-800">{email}</span>.</>
                  ) : (
                    <>Enter the 6-digit verification code for <span className="font-semibold text-gray-800">{email}</span>.</>
                  )}
                </p>
              </div>

              {/* Development / Demo Mode Code Card */}
              {devCode && (
                <div className="mb-5 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                      <KeyRound className="w-4 h-4 text-emerald-700" />
                      Verification Code:
                    </span>
                    <button
                      type="button"
                      onClick={() => setTwoFactorCode(devCode)}
                      title="Click to fill code into input"
                      className="font-mono text-base font-extrabold tracking-widest bg-white hover:bg-emerald-100 text-emerald-900 px-3 py-1 rounded-lg border border-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      {devCode}
                      <span className="text-[10px] uppercase font-sans font-semibold text-emerald-700 bg-emerald-100/80 px-1 py-0.5 rounded">
                        Auto-Fill
                      </span>
                    </button>
                  </div>
                  {!emailSent && (
                    <p className="text-[11px] text-emerald-800/90 leading-tight">
                      💡 <strong>Notice:</strong> Email SMTP is in local mode. Your security code is displayed above—click <strong>Auto-Fill</strong> or type it below.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              {resendMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                  {resendMessage}
                </div>
              )}

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      6-Digit Security Code
                    </label>
                    {devCode && (
                      <button
                        type="button"
                        onClick={() => setTwoFactorCode(devCode)}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        Insert {devCode}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="block w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono text-2xl tracking-[0.5em] text-gray-900 placeholder-gray-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold"
                  />
                  <p className="mt-1.5 text-[11px] text-gray-500">Enter the current code for this sign-in session.</p>
                </div>

                <Button type="submit" variant="primary" className="w-full py-3.5 text-base mt-2" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify & Continue'}
                </Button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-xs text-brand-800 hover:text-brand-900 flex items-center gap-1 font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    Resend Code
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
