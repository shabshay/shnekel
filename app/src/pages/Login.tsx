import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CoinLogo } from '../components/CoinLogo';

export function Login() {
  const { signInWithEmail, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    const result = await signInWithEmail(email.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const code = newOtp.join('');
      if (code.length === 6) {
        submitOtp(code);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    // Focus last filled input or submit
    if (pasted.length === 6) {
      submitOtp(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const submitOtp = async (code: string) => {
    setLoading(true);
    setError('');
    const result = await verifyOtp(email.trim(), code);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    // If successful, useAuth will update the session automatically
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    const result = await signInWithEmail(email.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <div className="flex-grow flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="flex flex-col items-center mb-12">
            <CoinLogo size="xl" className="mb-4" />
            <h1 className="font-headline font-black text-primary-container text-4xl tracking-tight mb-2">
              Shnekel
            </h1>
            <p className="text-on-surface-variant text-base">
              Spend like it's cash.
            </p>
          </div>

          {sent ? (
            /* OTP verification state */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-on-tertiary-container/10 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined filled text-on-tertiary-container text-3xl">mail</span>
              </div>
              <h2 className="font-headline font-bold text-xl text-on-primary-fixed mb-2">
                Enter the code
              </h2>
              <p className="text-on-surface-variant text-sm mb-8">
                We sent a 6-digit code to <span className="font-semibold text-on-primary-fixed">{email}</span>
              </p>

              {/* OTP input */}
              <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                    className="w-12 h-14 bg-surface-container-lowest rounded-xl text-center font-headline font-bold text-2xl text-on-primary-fixed border-2 border-transparent focus:border-primary-container outline-none transition-colors"
                  />
                ))}
              </div>

              {error && (
                <div className="bg-error-container/20 rounded-xl p-3 flex items-center gap-2 mb-4 justify-center">
                  <span className="material-symbols-outlined text-error text-lg">error</span>
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-2 mb-4 text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  <span className="text-sm">Verifying...</span>
                </div>
              )}

              <p className="text-on-surface-variant text-xs mb-4">
                You can also tap the magic link in the email.
              </p>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="font-headline font-semibold text-sm text-on-tertiary-container hover:opacity-80 transition-colors disabled:opacity-40"
                >
                  Resend code
                </button>
                <span className="text-outline">|</span>
                <button
                  onClick={() => { setSent(false); setEmail(''); setOtp(['', '', '', '', '', '']); setError(''); }}
                  className="font-headline font-semibold text-sm text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  Different email
                </button>
              </div>
            </div>
          ) : (
            /* Login form */
            <form onSubmit={handleSubmit}>
              <label className="text-xs font-semibold tracking-wide text-on-surface-variant block mb-3">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full bg-surface-container-lowest rounded-xl px-5 py-4 font-headline text-on-primary-fixed text-base border-none outline-none placeholder:text-outline-variant mb-4"
              />

              {error && (
                <div className="bg-error-container/20 rounded-xl p-3 flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-error text-lg">error</span>
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-4 bg-primary-container text-on-primary font-headline font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10 disabled:opacity-40 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">login</span>
                    Sign in
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="text-center text-outline text-xs pb-8 px-6">
        No password needed. We'll email you a code to sign in.
      </p>
    </div>
  );
}
