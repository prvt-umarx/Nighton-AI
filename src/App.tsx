import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ChildChat } from './components/ChildChat';
import { ParentDashboard } from './components/ParentDashboard';
import { AuthModal } from './components/AuthModal';
import { AddChildModal } from './components/AddChildModal';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeRole, user, userProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAddChildModal, setShowAddChildModal] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans-clean selection:bg-amber-200 selection:text-amber-900">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAddChild={() => setShowAddChildModal(true)}
      />

      {/* Main View Area based on Active Role */}
      <main className="flex-1 flex flex-col">
        {activeRole === 'child' ? (
          <ChildChat />
        ) : (
          <ParentDashboard onOpenAddChild={() => setShowAddChildModal(true)} />
        )}
      </main>

      {/* Reassuring Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-3 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-child text-sm font-bold text-indigo-700">Nighton</span>
            <span>• AI Mentor with Parent Safety Guardrails</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center space-x-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Tracking Raw Chats</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-slate-500">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Age-Appropriate AI Mentorship</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <AddChildModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
