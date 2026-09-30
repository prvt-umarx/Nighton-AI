import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Sparkles,
  User,
  LogOut,
  ChevronDown,
  Lock,
  Baby,
  Smile,
  Plus
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenAddChild: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenAddChild }) => {
  const {
    user,
    userProfile,
    activeRole,
    setActiveRole,
    childrenList,
    activeChild,
    selectChild,
    logout,
    loginAsDemoParent,
    loginAsDemoChild
  } = useAuth();

  const [showChildMenu, setShowChildMenu] = useState(false);
  const [showParentPinModal, setShowParentPinModal] = useState(false);
  const [parentPinInput, setParentPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleSwitchToParent = () => {
    // If switching from child to parent, require parent PIN check (default '1234' or direct)
    setShowParentPinModal(true);
  };

  const handleVerifyParentPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (parentPinInput === '1234' || parentPinInput.length >= 4 || !user) {
      setActiveRole('parent');
      setShowParentPinModal(false);
      setParentPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 transform transition-transform hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-child text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 via-purple-700 to-amber-600 bg-clip-text text-transparent">
                  Nighton
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  AI Mentor
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Gentle mentor for kids • Peace of mind for parents
              </p>
            </div>
          </div>

          {/* Mode Switcher & Current Profile */}
          <div className="flex items-center space-x-3">
            {/* Role Indicator Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  if (activeRole === 'child') {
                    handleSwitchToParent();
                  } else {
                    setActiveRole('parent');
                  }
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === 'parent'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Parent View</span>
              </button>

              <button
                onClick={() => setActiveRole('child')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === 'child'
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Baby className="w-3.5 h-3.5 text-amber-800" />
                <span>Child View</span>
              </button>
            </div>

            {/* Child Selector Dropdown */}
            {activeChild && (
              <div className="relative">
                <button
                  onClick={() => setShowChildMenu(!showChildMenu)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 transition-colors"
                >
                  <span className="text-base">{activeChild.avatar || '🦊'}</span>
                  <span className="text-xs font-bold font-child text-slate-800">
                    {activeChild.name} ({activeChild.age}y)
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showChildMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Child Profile
                    </div>
                    {childrenList.map((kid) => (
                      <button
                        key={kid.id}
                        onClick={() => {
                          selectChild(kid.id);
                          setShowChildMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                          activeChild.id === kid.id ? 'bg-indigo-50/70 text-indigo-700 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{kid.avatar}</span>
                          <div>
                            <p className="font-child text-sm font-semibold">{kid.name}</p>
                            <p className="text-[11px] text-slate-500">Age {kid.age} • @{kid.username}</p>
                          </div>
                        </div>
                        {activeChild.id === kid.id && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        )}
                      </button>
                    ))}

                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        setShowChildMenu(false);
                        onOpenAddChild();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Child</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Demo Switchers & Auth */}
            <div className="flex items-center space-x-2">
              {!user && (
                <div className="hidden md:flex items-center space-x-1.5 text-xs">
                  <button
                    onClick={() => loginAsDemoParent()}
                    className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    title="Load Demo Parent account"
                  >
                    Parent Demo
                  </button>
                  <button
                    onClick={() => loginAsDemoChild('Leo')}
                    className="px-2.5 py-1 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    title="Load Demo Child (Leo)"
                  >
                    Leo Demo
                  </button>
                </div>
              )}

              {user ? (
                <button
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Parent PIN Lock Modal for Child -> Parent Switch */}
      {showParentPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-center font-bold text-slate-900 text-lg">
              Parent Gate
            </h3>
            <p className="text-center text-xs text-slate-500 mt-1 mb-5">
              Enter the 4-digit Parent PIN to open the dashboard (Default PIN is <strong className="text-indigo-600">1234</strong>).
            </p>

            <form onSubmit={handleVerifyParentPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="PIN code (1234)"
                  value={parentPinInput}
                  onChange={(e) => {
                    setParentPinInput(e.target.value);
                    setPinError(false);
                  }}
                  className={`w-full text-center tracking-widest text-2xl font-bold py-3 rounded-2xl border ${
                    pinError ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-indigo-500'
                  } outline-hidden`}
                />
                {pinError && (
                  <p className="text-rose-600 text-xs text-center mt-1 font-medium">
                    Incorrect PIN. Try 1234.
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowParentPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
