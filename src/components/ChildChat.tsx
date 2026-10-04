import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  db,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  updateDoc
} from '../lib/firebase';
import { ChatMessage, Conversation, ChildGoal } from '../types';
import {
  Send,
  Sparkles,
  Heart,
  Trophy,
  History,
  Volume2,
  VolumeX,
  Plus,
  Compass,
  ArrowRight,
  Smile,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { MoodCheckinModal } from './MoodCheckinModal';
import { GoalsModal } from './GoalsModal';
import { NightonLogo } from './NightonLogo';

const STARTER_PROMPTS = [
  { text: "Why is the sky blue during the day and red at sunset? 🌅", label: "Sky Colors" },
  { text: "Can you help me solve a tricky math word problem? 📐", label: "Math Help" },
  { text: "I felt a little left out at recess today with my friends 🥺", label: "Recess Feelings" },
  { text: "Tell me an unbelievable mystery about deep sea creatures! 🐙", label: "Sea Animals" },
  { text: "Can we write a silly adventure story together? 🚀", label: "Story Time" },
];

export const ChildChat: React.FC = () => {
  const { activeChild, user, updateChildStats } = useAuth();
  const child = activeChild || {
    id: 'demo-child',
    name: 'Leo',
    age: 9,
    avatar: '🦊',
    parentId: 'demo-parent',
    learningMinutesThisWeek: 95,
    currentMood: 'positive' as const,
    username: 'leo_explorer',
    createdAt: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('session-today');
  const [suggestedChips, setSuggestedChips] = useState<string[]>([
    "Tell me more! 🌟",
    "Why does that happen?",
    "Can you give me a fun challenge?",
  ]);

  // Modals state
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [goals, setGoals] = useState<ChildGoal[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load or listen to Goals for current child
  useEffect(() => {
    if (!child.id) return;
    if (user) {
      const q = query(collection(db, 'goals'), where('childId', '==', child.id));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: ChildGoal[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<ChildGoal, 'id'>) });
        });
        setGoals(list);
      });
      return () => unsub();
    } else {
      // Local default goals for demo
      setGoals([
        {
          id: 'goal-1',
          childId: child.id,
          parentId: child.parentId,
          title: 'Read 20 minutes of space adventures 🪐',
          category: 'learning',
          completed: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'goal-2',
          childId: child.id,
          parentId: child.parentId,
          title: 'Solve 5 math puzzle challenges ✖️',
          category: 'learning',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'goal-3',
          childId: child.id,
          parentId: child.parentId,
          title: 'Share a toy and say something kind 💖',
          category: 'kindness',
          completed: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [child.id, user]);

  // Initial welcome message if conversation is blank
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          conversationId: activeConversationId,
          childId: child.id,
          sender: 'nighton',
          text: `Hi ${child.name}! 🌟 I'm Nighton, your friendly AI mentor. Whether you want to explore the stars, figure out homework, share how your day went, or just chat—I'm always right here with you! What are you thinking about right now?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [child.id, child.name]);

  // Text-To-Speech helper
  const speakText = (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
      utterance.pitch = 1.1; // Friendly warm pitch for kids
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isTyping) return;

    setInputText('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversationId,
      childId: child.id,
      sender: 'child',
      text: content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Call server-side API with Gemini AI mentor
      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          childName: child.name,
          childAge: child.age,
          conversationHistory: messages.slice(-5).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          mentorTone: 'encouraging',
        }),
      });

      if (!response.ok) {
        throw new Error('Nighton is resting. Please try again.');
      }

      const data = await response.json();

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        conversationId: activeConversationId,
        childId: child.id,
        sender: 'nighton',
        text: data.reply,
        moodDetected: data.mood,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (data.suggestedFollowUps && data.suggestedFollowUps.length > 0) {
        setSuggestedChips(data.suggestedFollowUps);
      }

      // Voice read-aloud
      speakText(data.reply);

      // Increment child's learning minutes (3 minutes per engaging exchange)
      await updateChildStats(child.id, {
        learningMinutesThisWeek: (child.learningMinutesThisWeek || 0) + 3,
        currentMood: data.mood || child.currentMood,
      });

      // PARENT SAFETY LAYER: If safety alert flagged, persist into Firestore /safetyAlerts
      if (data.safetyFlag && data.safetyFlag.isAlert) {
        const alertData = {
          childId: child.id,
          parentId: child.parentId,
          childName: child.name,
          category: data.safetyFlag.category || 'distress',
          severity: data.safetyFlag.severity || 'medium',
          summary: data.safetyFlag.summary || `Safety flag detected in conversation.`,
          recommendation:
            data.safetyFlag.recommendation ||
            `Engage your child with warm, non-judgmental listening.`,
          status: 'unread',
          createdAt: new Date().toISOString(),
        };

        if (user) {
          try {
            await addDoc(collection(db, 'safetyAlerts'), alertData);
          } catch (err) {
            console.error('Failed to save safety alert to firestore:', err);
          }
        }
      }
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        conversationId: activeConversationId,
        childId: child.id,
        sender: 'nighton',
        text: `I'm right here with you, ${child.name}! 🌟 I had a little hiccup hearing you clearly. What were we exploring?`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMoodSelect = async (
    mood: 'positive' | 'neutral' | 'needs_attention',
    emoji: string,
    reason: string
  ) => {
    await updateChildStats(child.id, { currentMood: mood });

    const note = `I just checked in! Feeling ${emoji} (${reason}).`;
    handleSendMessage(note);
  };

  const handleToggleGoal = async (goalId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    if (user) {
      try {
        const ref = doc(db, 'goals', goalId);
        await updateDoc(ref, {
          completed: newStatus,
          completedAt: newStatus ? new Date().toISOString() : null,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, completed: newStatus } : g))
      );
    }
  };

  const handleAddGoal = async (title: string, category: ChildGoal['category']) => {
    const newGoalData = {
      childId: child.id,
      parentId: child.parentId,
      title,
      category,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        await addDoc(collection(db, 'goals'), newGoalData);
      } catch (err) {
        console.error(err);
      }
    } else {
      setGoals((prev) => [
        ...prev,
        { id: `goal-${Date.now()}`, ...newGoalData },
      ]);
    }
  };

  const handleStartNewSession = () => {
    const newId = `session-${Date.now()}`;
    setActiveConversationId(newId);
    setMessages([
      {
        id: `welcome-${newId}`,
        conversationId: newId,
        childId: child.id,
        sender: 'nighton',
        text: `Starting a brand new adventure, ${child.name}! 🚀 What exciting question, thought, or story should we dive into?`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowHistoryDrawer(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full px-2 sm:px-4 py-3">
      {/* Top Child Action Bar */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-md rounded-2xl p-2.5 px-4 border border-amber-200/80 shadow-xs mb-3">
        {/* Child Profile Info */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-inner animate-pulse">
            {child.avatar || '🦊'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-child font-bold text-lg text-slate-800">
                {child.name}'s Room
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Nighton is Online 🌟
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {child.learningMinutesThisWeek || 0} mins learned this week
            </p>
          </div>
        </div>

        {/* Action Buttons: Mood Check-in & Goals */}
        <div className="flex items-center space-x-2">
          {/* Mood Check-in */}
          <button
            onClick={() => setShowMoodModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-all hover:scale-105"
            title="Daily Feeling Check-in"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span className="hidden sm:inline">Feeling Check-in</span>
            <span className="sm:hidden">Feelings</span>
          </button>

          {/* Goals Drawer */}
          <button
            onClick={() => setShowGoalsModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold transition-all hover:scale-105"
            title="My Star Goals"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Goals ({goals.filter((g) => g.completed).length}/{goals.length})
            </span>
          </button>

          {/* TTS Read-Aloud Toggle */}
          <button
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              if (ttsEnabled && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
              ttsEnabled
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title={ttsEnabled ? 'Nighton Voice: ON' : 'Turn on Voice Read-Aloud'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* New Session Button */}
          <button
            onClick={handleStartNewSession}
            className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
            title="Start New Adventure"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-indigo-50/30 rounded-3xl p-4 sm:p-6 overflow-y-auto border border-amber-100 shadow-sm flex flex-col space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'child' ? 'flex-row-reverse self-end' : 'self-start max-w-2xl'
            }`}
          >
            {/* Avatar icon */}
            <div className="shrink-0 mt-1">
              {msg.sender === 'child' ? (
                <div className="w-9 h-9 rounded-2xl bg-amber-200 border-2 border-amber-400 flex items-center justify-center text-lg shadow-xs">
                  {child.avatar || '🦊'}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-[#00205B] text-white flex items-center justify-center shadow-md shadow-[#00205B]/20 transform hover:rotate-6 transition-transform">
                  <NightonLogo variant="icon" color="#FFFFFF" className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Bubble */}
            <div
              className={`rounded-3xl p-4 sm:p-5 transition-all shadow-xs ${
                msg.sender === 'child'
                  ? 'bg-amber-400 text-amber-950 rounded-tr-xs font-child text-base font-medium max-w-lg shadow-amber-400/20'
                  : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/90 text-sm sm:text-base leading-relaxed'
              }`}
            >
              {msg.sender === 'nighton' && (
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100">
                  <span className="font-child text-xs font-bold tracking-wide text-[#00205B] flex items-center gap-1.5">
                    <NightonLogo variant="icon" color="#00205B" className="w-3.5 h-3.5" />
                    <span>Nighton Mentor</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-3 self-start animate-in fade-in">
            <div className="w-10 h-10 rounded-2xl bg-[#00205B] text-white flex items-center justify-center shadow-md shadow-[#00205B]/20">
              <NightonLogo variant="icon" color="#FFFFFF" className="w-6 h-6 animate-pulse" />
            </div>
            <div className="bg-white rounded-3xl rounded-tl-xs px-5 py-4 border border-slate-200/90 shadow-xs flex items-center space-x-2">
              <span className="font-child text-xs text-indigo-600 font-bold">
                Nighton is thinking
              </span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-up Chips */}
      {suggestedChips.length > 0 && !isTyping && (
        <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center space-x-1">
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <span>Try asking:</span>
          </span>
          {suggestedChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-child font-medium shadow-2xs transition-all hover:scale-105"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Starter Prompts when conversation is short */}
      {messages.length <= 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 my-2">
          {STARTER_PROMPTS.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt.text)}
              className="p-2.5 rounded-2xl bg-white/90 hover:bg-amber-50/80 border border-amber-200/80 text-left transition-all hover:scale-102 shadow-2xs flex items-center justify-between"
            >
              <span className="text-xs font-child text-slate-700 line-clamp-1">
                {prompt.text}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-2 bg-white rounded-3xl p-2 pl-5 border-2 border-slate-200 focus-within:border-indigo-500 shadow-md shadow-slate-200/50 flex items-center gap-2 transition-colors"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Talk with Nighton... (e.g. "Why is Mars red?", "I made a new friend!")`}
          className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 outline-hidden font-child text-base"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="w-11 h-11 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-40 text-amber-950 flex items-center justify-center shadow-md shadow-orange-500/20 transition-all hover:scale-105"
          title="Send to Nighton"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </form>

      {/* Modals */}
      <MoodCheckinModal
        isOpen={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        childName={child.name}
        onSelectMood={handleMoodSelect}
      />

      <GoalsModal
        isOpen={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        childName={child.name}
        goals={goals}
        onToggleGoal={handleToggleGoal}
        onAddGoal={handleAddGoal}
      />
    </div>
  );
};
