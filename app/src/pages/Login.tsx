import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CoinLogo } from '../components/CoinLogo';

export function Login() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
            /* Success state */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-on-tertiary-container/10 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined filled text-on-tertiary-container text-3xl">mail</span>
              </div>
              <h2 className="font-headline font-bold text-xl text-on-primary-fixed mb-2">
                Check your email
              </h2>
              <p className="text-on-surface-variant text-sm mb-8">
                We sent a magic link to <span className="font-semibold text-on-primary-fixed">{email}</span>. Click the link to sign in.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="font-headline font-semibold text-on-surface-variant hover:text-on-primary-fixed transition-colors"
              >
                Use a different email
              </button>
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
                    Send magic link
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="text-center text-outline text-xs pb-8 px-6">
        No password needed. We'll email you a sign-in link.
      </p>
    </div>
  );
}
