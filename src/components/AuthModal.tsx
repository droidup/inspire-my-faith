import React, { useState } from 'react';
import { X, LogIn, Mail, Key, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail, sendMagicLink } = useAuth();
  const [view, setView] = useState<'main' | 'email'>('main');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        onClose(); // We could show a verification screen here
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (e: any) {
      // Firebase throws errors like "auth/wrong-password"
      setError(e.message.replace('Firebase:', '').trim() || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendMagicLink(email);
      setMagicLinkSent(true);
    } catch (e: any) {
      setError(e.message.replace('Firebase:', '').trim() || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setView('main');
    setIsSignUp(false);
    setEmail('');
    setPassword('');
    setError('');
    setMagicLinkSent(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-3">
            {view === 'email' ? (
              <button 
                onClick={() => setView('main')}
                className="w-10 h-10 rounded-full bg-white hover:bg-stone-100 text-stone-500 flex items-center justify-center transition-colors border border-stone-200"
              >
                <ArrowLeft size={20} strokeWidth={2} />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#c2094c]/10 text-[#c2094c] flex items-center justify-center">
                <LogIn size={20} strokeWidth={2} />
              </div>
            )}
            <div>
              <h3 className="font-serif font-bold text-xl text-slate-800">
                {view === 'main' ? 'Welcome Back' : isSignUp ? 'Create Account' : 'Sign In'}
              </h3>
              <p className="text-xs font-bold tracking-wider uppercase text-stone-400 mt-1">
                {view === 'main' ? 'Sign in to continue' : 'Secure Email Login'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-stone-400 hover:text-slate-800 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {view === 'main' ? (
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 p-4 bg-white border border-stone-200 hover:border-[#c2094c]/30 hover:shadow-md hover:shadow-[#c2094c]/5 rounded-xl text-slate-700 font-bold transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink-0 mx-4 text-stone-400 text-xs font-bold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              <button
                onClick={() => setView('email')}
                className="w-full flex items-center justify-center gap-3 p-4 bg-stone-50 border border-stone-200 hover:bg-stone-100 hover:border-stone-300 rounded-xl text-slate-700 font-bold transition-all"
              >
                <Mail size={20} className="text-stone-500" />
                Continue with Email
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {magicLinkSent ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={32} />
                  </div>
                  <h4 className="font-serif text-2xl text-slate-800">Check your email</h4>
                  <p className="text-stone-500">We sent a secure sign-in link to <strong>{email}</strong>.</p>
                  <p className="text-sm text-stone-400 mt-4">You can close this window.</p>
                </div>
              ) : (
                <>
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c2094c]/20 focus:border-[#c2094c] transition-all"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 ml-1">Password</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c2094c]/20 focus:border-[#c2094c] transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-[#c2094c] text-white rounded-xl font-bold uppercase tracking-wider text-sm shadow-md hover:bg-[#a0073e] hover:shadow-lg hover:shadow-[#c2094c]/20 transition-all disabled:opacity-50 mt-2"
                    >
                      {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                      {!loading && <ArrowRight size={18} />}
                    </button>
                  </form>

                  <div className="flex flex-col items-center gap-4 mt-6 pt-6 border-t border-stone-100">
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm font-bold text-slate-600 hover:text-[#c2094c] transition-colors"
                    >
                      {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={handleMagicLink}
                      disabled={loading}
                      className="text-xs font-medium text-stone-400 hover:text-slate-600 underline transition-colors"
                    >
                      Send me a passwordless Magic Link instead
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
