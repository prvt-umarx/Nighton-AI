import React, { useState } from 'react';
import { X, Sparkles, Heart } from 'lucide-react';

interface MoodCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  onSelectMood: (mood: 'positive' | 'neutral' | 'needs_attention', emoji: string, reason: string) => void;
}

const MOODS = [
  {
    type: 'positive' as const,
    label: 'Super Happy!',
    emoji: '🤩',
    bg: 'bg-amber-50 hover:bg-amber-100 border-amber-300',
    words: ['Excited', 'Proud', 'Curious', 'Energetic'],
  },
  {
    type: 'positive' as const,
    label: 'Feeling Good',
    emoji: '😊',
    bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300',
    words: ['Calm', 'Happy', 'Peaceful', 'Content'],
  },
  {
    type: 'neutral' as const,
    label: 'Just Okay',
    emoji: '😐',
    bg: 'bg-slate-50 hover:bg-slate-100 border-slate-300',
    words: ['Normal', 'A bit bored', 'Sleepy', 'Quiet'],
  },
  {
    type: 'needs_attention' as const,
    label: 'A Little Sad',
    emoji: '🥺',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-300',
    words: ['Lonely', 'Miss someone', 'Disappointed', 'Worried'],
  },
  {
    type: 'needs_attention' as const,
    label: 'Frustrated',
    emoji: '😤',
    bg: 'bg-rose-50 hover:bg-rose-100 border-rose-300',
    words: ['Stuck', 'Annoyed', 'Angry', 'Unfair'],
  },
];

export const MoodCheckinModal: React.FC<MoodCheckinModalProps> = ({
  isOpen,
  onClose,
  childName,
  onSelectMood,
}) => {
  const [selectedMoodIndex, setSelectedMoodIndex] = useState<number | null>(null);
  const [chosenWord, setChosenWord] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');

  if (!isOpen) return null;

  const currentMoodObj = selectedMoodIndex !== null ? MOODS[selectedMoodIndex] : null;

  const handleSubmit = () => {
    if (selectedMoodIndex === null) return;
    const item = MOODS[selectedMoodIndex];
    const details = [chosenWord, customNote].filter(Boolean).join(' - ');
    onSelectMood(item.type, item.emoji, details || item.label);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center mx-auto mb-2 text-2xl shadow-inner">
            <Heart className="w-6 h-6 text-rose-200 fill-rose-200" />
          </div>
          <h3 className="font-child text-2xl font-bold">
            Hi {childName}, how are you feeling?
          </h3>
          <p className="text-xs text-amber-100 mt-1">
            Nighton is always here to listen and cheer you on!
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Mood Emojis Grid */}
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map((item, idx) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setSelectedMoodIndex(idx);
                  setChosenWord(item.words[0] || '');
                }}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                  selectedMoodIndex === idx
                    ? `${item.bg} scale-105 shadow-md font-bold`
                    : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-3xl filter drop-shadow-xs">{item.emoji}</span>
                <span className="text-[11px] font-child text-slate-700 mt-1 text-center leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Feeling word pills */}
          {currentMoodObj && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 animate-in fade-in">
              <p className="text-xs font-semibold text-slate-600">
                Can you pick a word that fits best?
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentMoodObj.words.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setChosenWord(w)}
                    className={`px-3 py-1 rounded-full text-xs font-child font-medium transition-all ${
                      chosenWord === w
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Want to tell Nighton why? (Optional)"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:border-indigo-500 outline-hidden font-child"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Skip
            </button>
            <button
              type="button"
              disabled={selectedMoodIndex === null}
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-amber-950 font-bold text-xs shadow-md shadow-amber-400/20"
            >
              Share with Nighton 🌟
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
