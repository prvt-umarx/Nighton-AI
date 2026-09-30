import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, User, KeyRound, Baby } from 'lucide-react';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = ['🦊', '🦄', '🐼', '🦁', '🦉', '🚀', '🐬', '🐯', '🌟', '🎨'];

export const AddChildModal: React.FC<AddChildModalProps> = ({ isOpen, onClose }) => {
  const { addChild } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState(8);
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!username) {
      setUsername(`${val.toLowerCase().replace(/[^a-z0-9]/g, '')}_star`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your child’s name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await addChild({
        name: name.trim(),
        age: Number(age),
        avatar: selectedAvatar,
        username: username.trim() || `${name.toLowerCase()}_user`,
        pin: pin.trim() || '1234',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add child.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center mx-auto mb-2 text-2xl shadow-inner">
            {selectedAvatar}
          </div>
          <h3 className="font-child text-2xl font-bold">Add Child Account</h3>
          <p className="text-xs text-amber-100 mt-0.5">
            Link a child profile for safe mentoring and personalized insights
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Choose Avatar
            </label>
            <div className="flex flex-wrap gap-2 justify-center py-1">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    selectedAvatar === av
                      ? 'bg-amber-100 border-2 border-amber-500 scale-110 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Child's Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Leo"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-hidden font-child text-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age
              </label>
              <select
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-hidden bg-white"
              >
                {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((a) => (
                  <option key={a} value={a}>
                    {a} years
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Child Username (for child sign in)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="leo_star"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-hidden font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Your child can use this username to log in without needing an email.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Child PIN Code (4 digits)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                maxLength={4}
                required
                placeholder="1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm tracking-widest focus:border-indigo-500 outline-hidden font-bold"
              />
            </div>
          </div>

          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              {loading ? 'Creating...' : 'Create Child Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
