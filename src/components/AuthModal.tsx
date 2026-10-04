import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  User,
  Baby,
  Shield,
  ArrowRight,
  KeyRound
} from 'lucide-react';
import { NightonLogo } from './NightonLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'parent' | 'child';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'parent',
}) => {
  const {
    signInParent,
    signUpParent,
    signInWithGoogle,
    signInChild,
    loginAsDemoParent,
    loginAsDemoChild,
    error: authError,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'parent' | 'child'>(initialTab);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Parent form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Child form fields
  const [childUsername, setChildUsername] = useState('');
  const [childPin, setChildPin] = useState('');

  if (!isOpen) return null;

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      if (isRegisterMode) {
        if (!displayName.trim()) {
          setFormError('Please enter your name.');
          setLoading(false);
          return;
        }
        await signUpParent(email, password, displayName);
      } else {
        await signInParent(email, password);
      }
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Google sign-in error.');
    } finally {
      setLoading(false);
    }
  };

  const handleChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      const success = await signInChild(childUsername, childPin);
      if (success) {
        onClose();
      } else {
        setFormError('Username or PIN is incorrect. Try username: leo_explorer, PIN: 1234');
      }
    } catch (err: any) {
      setFormError(err.message || 'Could not log in as child.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95">
        {/* Header with Close */}
        <div className="relative bg-gradient-to-r from-[#00205B] via-[#072B73] to-indigo-900 text-white p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex justify-center mb-2">
            <NightonLogo variant="full" color="#FFFFFF" className="h-10 w-auto" />
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Sign in to your parent dashboard or child mentor session
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-black/25 p-1 rounded-2xl mt-5 border border-white/15">
            <button
              onClick={() => {
                setActiveTab('parent');
                setFormError(null);
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'parent'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Parent Account</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('child');
                setFormError(null);
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'child'
                  ? 'bg-amber-400 text-amber-950 shadow-md'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              <span>Child Account</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {(formError || authError) && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {formError || authError}
            </div>
          )}

          {activeTab === 'parent' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isRegisterMode ? 'Create Parent Account' : 'Parent Login'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {isRegisterMode ? 'Already have an account? Log In' : 'New here? Sign Up'}
                </button>
              </div>

              <form onSubmit={handleParentSubmit} className="space-y-3.5">
                {isRegisterMode && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah Jenkins"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="parent@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Please wait...' : isRegisterMode ? 'Sign Up as Parent' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs text-slate-400">
                  <span className="bg-white px-2">or quick start with</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    loginAsDemoParent();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Explore Demo Parent Profile (Sarah Jenkins)</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 text-2xl">
                  🦊
                </div>
                <h3 className="font-child text-lg font-bold text-slate-800">
                  Child Sign In
                </h3>
                <p className="text-xs text-slate-500">
                  Enter the username and secret PIN your parent gave you.
                </p>
              </div>

              <form onSubmit={handleChildSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Child Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. leo_explorer"
                      value={childUsername}
                      onChange={(e) => setChildUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    4-Digit Child PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      maxLength={6}
                      placeholder="••••"
                      value={childPin}
                      onChange={(e) => setChildPin(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm tracking-widest focus:border-amber-500 outline-hidden font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-sm shadow-md shadow-amber-400/20 transition-all flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Opening Nighton Room...' : 'Start Chatting with Nighton'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs text-slate-400">
                  <span className="bg-white px-2">or quick demo kids</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemoChild('Leo');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/60 text-left transition-colors"
                >
                  <div className="text-xl">🦊</div>
                  <p className="font-child text-xs font-bold text-slate-800 mt-1">Leo (9 yrs)</p>
                  <p className="text-[10px] text-slate-500">Explorer • Math & Space</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    loginAsDemoChild('Maya');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200/60 text-left transition-colors"
                >
                  <div className="text-xl">🦄</div>
                  <p className="font-child text-xs font-bold text-slate-800 mt-1">Maya (6 yrs)</p>
                  <p className="text-[10px] text-slate-500">Creative • Animals & Art</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
