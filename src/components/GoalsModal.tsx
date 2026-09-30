import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Target, CheckCircle2, Circle, Plus, Sparkles, Trophy } from 'lucide-react';
import { ChildGoal } from '../types';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  goals: ChildGoal[];
  onToggleGoal: (goalId: string, currentStatus: boolean) => void;
  onAddGoal: (title: string, category: ChildGoal['category']) => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({
  isOpen,
  onClose,
  childName,
  goals,
  onToggleGoal,
  onAddGoal,
}) => {
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<ChildGoal['category']>('learning');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (goal: ChildGoal) => {
    if (!goal.completed) {
      // Trigger festive celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#6366F1', '#10B981', '#EC4899'],
      });
    }
    onToggleGoal(goal.id, goal.completed);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    onAddGoal(newGoalTitle.trim(), newGoalCategory);
    setNewGoalTitle('');
    setShowAddForm(false);
  };

  const completedCount = goals.filter((g) => g.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 p-6 text-white text-center relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center mx-auto mb-2 text-2xl shadow-inner">
            <Trophy className="w-6 h-6 text-amber-300" />
          </div>
          <h3 className="font-child text-2xl font-bold">
            {childName}'s Star Goals
          </h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            {completedCount} of {goals.length} goals completed!
          </p>

          {/* Progress bar */}
          <div className="w-full bg-black/20 h-2.5 rounded-full mt-3 overflow-hidden p-0.5 border border-white/20">
            <div
              className="bg-amber-300 h-full rounded-full transition-all duration-500"
              style={{
                width: goals.length > 0 ? `${(completedCount / goals.length) * 100}%` : '0%',
              }}
            ></div>
          </div>
        </div>

        {/* Goals List Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {goals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Target className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-child text-base text-slate-600">No active goals yet!</p>
              <p className="text-xs">Add a fun daily goal to start earning stars.</p>
            </div>
          ) : (
            goals.map((g) => (
              <div
                key={g.id}
                onClick={() => handleToggle(g)}
                className={`flex items-start space-x-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  g.completed
                    ? 'bg-emerald-50/70 border-emerald-300 text-slate-500'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs text-slate-800'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {g.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-child text-sm font-medium ${
                      g.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {g.title}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {g.category}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Add Goal Form */}
          {showAddForm ? (
            <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3 mt-4">
              <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Create New Goal
              </p>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Read 15 mins about dinosaurs"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-hidden font-child"
              />
              <div className="flex items-center space-x-2">
                <select
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value as ChildGoal['category'])}
                  className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 outline-hidden"
                >
                  <option value="learning">📚 Learning</option>
                  <option value="kindness">💖 Kindness</option>
                  <option value="creativity">🎨 Creativity</option>
                  <option value="routine">⏰ Daily Routine</option>
                  <option value="health">🏃 Health</option>
                </select>
                <div className="flex-1 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-white rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Add Goal
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add a Star Goal</span>
            </button>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
