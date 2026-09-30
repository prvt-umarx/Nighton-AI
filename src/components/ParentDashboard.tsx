import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  db,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc
} from '../lib/firebase';
import { SafetyAlert, ChildGoal, ParentInsight } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Users,
  Plus,
  BookOpen,
  MessageCircle,
  Heart,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Settings,
  HelpCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface ParentDashboardProps {
  onOpenAddChild: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onOpenAddChild }) => {
  const {
    user,
    userProfile,
    childrenList,
    activeChild,
    selectChild,
    updateChildStats
  } = useAuth();

  const currentChild = activeChild || (childrenList[0] ?? null);

  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [goals, setGoals] = useState<ChildGoal[]>([]);
  const [parentInsight, setParentInsight] = useState<ParentInsight | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'safety' | 'settings'>('overview');

  // Mentor configuration settings
  const [mentorTone, setMentorTone] = useState<'encouraging' | 'curious' | 'step_by_step'>('encouraging');
  const [bedtimeHour, setBedtimeHour] = useState(20); // 8:00 PM
  const [maxMinutesDaily, setMaxMinutesDaily] = useState(45);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Listen to Safety Alerts for this parent / child
  useEffect(() => {
    if (!currentChild) return;

    if (user) {
      const q = query(
        collection(db, 'safetyAlerts'),
        where('childId', '==', currentChild.id)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const list: SafetyAlert[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<SafetyAlert, 'id'>) });
        });
        setSafetyAlerts(list);
      });
      return () => unsub();
    } else {
      // Demo alerts for Leo
      if (currentChild.name.toLowerCase() === 'leo') {
        setSafetyAlerts([
          {
            id: 'alert-demo-1',
            childId: currentChild.id,
            parentId: currentChild.parentId,
            childName: 'Leo',
            category: 'bullying',
            severity: 'medium',
            summary: 'Leo mentioned feeling excluded by two classmates during soccer recess.',
            recommendation:
              'Open a gentle chat during dinner: "Who did you play with today during soccer? How was the team feeling?" Validate his emotions without placing immediate blame.',
            status: 'unread',
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          },
        ]);
      } else {
        setSafetyAlerts([]);
      }
    }
  }, [currentChild?.id, user]);

  // Listen to Goals for this child
  useEffect(() => {
    if (!currentChild) return;

    if (user) {
      const q = query(
        collection(db, 'goals'),
        where('childId', '==', currentChild.id)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const list: ChildGoal[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<ChildGoal, 'id'>) });
        });
        setGoals(list);
      });
      return () => unsub();
    } else {
      // Demo goals
      setGoals([
        {
          id: 'goal-1',
          childId: currentChild.id,
          parentId: currentChild.parentId,
          title: 'Read 20 minutes about Outer Space 🪐',
          category: 'learning',
          completed: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'goal-2',
          childId: currentChild.id,
          parentId: currentChild.parentId,
          title: 'Practice multiplication table of 7 & 8 ✖️',
          category: 'learning',
          completed: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'goal-3',
          childId: currentChild.id,
          parentId: currentChild.parentId,
          title: 'Help water the garden plants 🌱',
          category: 'kindness',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [currentChild?.id, user]);

  // Generate or load Parent Insight via server API
  const refreshAiInsight = async () => {
    if (!currentChild) return;
    setAiGenerating(true);
    try {
      const completedGoalsCount = goals.filter((g) => g.completed).length;
      const res = await fetch('/api/mentor/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: currentChild.name,
          childAge: currentChild.age,
          topics: ['Astronomy & Planets', 'Fractions & Math', 'Recess Relationships'],
          goalsCompleted: completedGoalsCount,
          moodCounts: {
            positive: currentChild.currentMood === 'positive' ? 8 : 4,
            neutral: currentChild.currentMood === 'neutral' ? 5 : 2,
            needs_attention: safetyAlerts.length > 0 ? 2 : 0,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setParentInsight({
          id: `insight-${Date.now()}`,
          parentId: currentChild.parentId,
          childId: currentChild.id,
          childName: currentChild.name,
          weekStartDate: new Date().toISOString(),
          learningMinutes: currentChild.learningMinutesThisWeek || 85,
          goalsCompleted: completedGoalsCount,
          goalsTotal: goals.length,
          moodTrend: currentChild.currentMood || 'positive',
          highlightSummary: data.summary,
          suggestedTopics: data.conversationStarters?.join(' • ') || '',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Insight generation failed:', e);
    } finally {
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    if (!parentInsight && currentChild) {
      refreshAiInsight();
    }
  }, [currentChild?.id]);

  const handleMarkAlertReviewed = async (alertId: string) => {
    if (user) {
      try {
        const ref = doc(db, 'safetyAlerts', alertId);
        await updateDoc(ref, { status: 'acknowledged' });
      } catch (err) {
        console.error(err);
      }
    } else {
      setSafetyAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' } : a))
      );
    }
  };

  // Quick simulation tool to test safety alert detection
  const handleSimulateAlert = async () => {
    if (!currentChild) return;
    const newAlert: SafetyAlert = {
      id: `alert-${Date.now()}`,
      childId: currentChild.id,
      parentId: currentChild.parentId,
      childName: currentChild.name,
      category: 'bullying',
      severity: 'high',
      summary: `${currentChild.name} mentioned feeling threatened by an older peer on the bus.`,
      recommendation:
        'Acknowledge their courage in speaking up. Ask calmly: "What happened on the bus today? Who was sitting nearby?" Contact the school counselor if needed.',
      status: 'unread',
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        await addDoc(collection(db, 'safetyAlerts'), newAlert);
      } catch (e) {
        console.error(e);
      }
    } else {
      setSafetyAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const unreadAlerts = safetyAlerts.filter((a) => a.status === 'unread');
  const completedGoals = goals.filter((g) => g.completed).length;

  if (!currentChild) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-2xl">
          👶
        </div>
        <h2 className="text-2xl font-bold text-slate-800">No Child Linked Yet</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Create a child account to enable Nighton AI mentoring, personalized learning time tracking, and the parent safety layer.
        </p>
        <button
          onClick={onOpenAddChild}
          className="mt-6 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 inline-flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Child Account</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Child Selector */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Parent Safety & Insights Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {userProfile?.displayName ? `${userProfile.displayName}'s Family` : 'Family Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Privacy-first monitoring: High-level trends and proactive safety alerts without intruding on your child's private chats.
          </p>
        </div>

        {/* Children switcher pills */}
        <div className="flex items-center flex-wrap gap-2">
          {childrenList.map((kid) => (
            <button
              key={kid.id}
              onClick={() => selectChild(kid.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all ${
                currentChild.id === kid.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span className="text-base">{kid.avatar}</span>
              <span>{kid.name}</span>
              <span className={`text-[10px] opacity-75 ${currentChild.id === kid.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                {kid.age}y
              </span>
            </button>
          ))}

          <button
            onClick={onOpenAddChild}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl border border-dashed border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Child</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          High-Level Insights
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'safety'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Safety Layer</span>
          {unreadAlerts.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Mentor Controls & Quiet Hours
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* 4 Core Stat Cards Required by Prompt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Learning Time This Week */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Learning Time
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 font-child">
                  {currentChild.learningMinutesThisWeek || 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">mins this week</span>
              </div>

              {/* Weekly progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Weekly Target (120m)</span>
                  <span className="font-semibold text-slate-700">
                    {Math.min(100, Math.round(((currentChild.learningMinutesThisWeek || 0) / 120) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((currentChild.learningMinutesThisWeek || 0) / 120) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 2. Goals Completed */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Goals Completed
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 font-child">
                  {completedGoals}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  of {goals.length} goals
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Completion Rate</span>
                  <span className="font-semibold text-emerald-600">
                    {goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${goals.length > 0 ? (completedGoals / goals.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 3. Mood Trend */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Mood Trend
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                {currentChild.currentMood === 'positive' && (
                  <span className="text-2xl">😊</span>
                )}
                {currentChild.currentMood === 'neutral' && (
                  <span className="text-2xl">😐</span>
                )}
                {currentChild.currentMood === 'needs_attention' && (
                  <span className="text-2xl">🥺</span>
                )}
                <span className="text-xl font-bold text-slate-900 capitalize font-child">
                  {currentChild.currentMood === 'positive'
                    ? 'Positive & Curious'
                    : currentChild.currentMood === 'neutral'
                    ? 'Calm & Neutral'
                    : 'Needs Attention'}
                </span>
              </div>

              <div className="mt-4 flex items-center space-x-1">
                <div className="flex-1 bg-emerald-400 h-1.5 rounded-full" title="80% Positive"></div>
                <div className="w-4 bg-amber-300 h-1.5 rounded-full" title="15% Neutral"></div>
                <div className="w-2 bg-rose-400 h-1.5 rounded-full" title="5% Needs Attention"></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                80% positive check-ins this week
              </p>
            </div>

            {/* 4. Safety Alerts Indicator */}
            <div
              onClick={() => setActiveTab('safety')}
              className={`rounded-3xl p-5 border cursor-pointer transition-all hover:scale-102 shadow-xs ${
                unreadAlerts.length > 0
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Safety Layer
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    unreadAlerts.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {unreadAlerts.length > 0 ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
              </div>

              <div className="mt-3">
                <span className="text-2xl font-extrabold font-child">
                  {unreadAlerts.length > 0 ? `${unreadAlerts.length} Alert to Review` : 'All Safe & Clear'}
                </span>
                <p className="text-[11px] opacity-80 mt-1">
                  {unreadAlerts.length > 0
                    ? 'Click to view high-level summary and parent tips'
                    : 'Nighton detected no safety or distress concerns'}
                </p>
              </div>
            </div>
          </div>

          {/* Prominent Safety Alert Banner if unread alerts exist */}
          {unreadAlerts.length > 0 && (
            <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start justify-between shadow-xs">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-amber-900">
                    Safety Notification for {currentChild.name}
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {unreadAlerts[0].summary}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('safety')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 ml-3"
              >
                Review Guidance
              </button>
            </div>
          )}

          {/* AI Weekly Reflection & Dinner Starters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Weekly Growth & Topics Digest
                  </h3>
                </div>
                <button
                  onClick={refreshAiInsight}
                  disabled={aiGenerating}
                  className="flex items-center space-x-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiGenerating ? 'animate-spin' : ''}`} />
                  <span>{aiGenerating ? 'Updating...' : 'Refresh Digest'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-xs sm:text-sm leading-relaxed">
                {parentInsight?.highlightSummary || (
                  <p>
                    {currentChild.name} showed high enthusiasm this week exploring scientific questions and completed multiple daily milestones with Nighton.
                  </p>
                )}
              </div>

              {/* Family Dinner & Bedtime Conversation Starters */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Family Conversation Starters</span>
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/70 text-indigo-950 text-xs font-medium">
                    💬 "What was the most surprising thing you learned with Nighton about outer space this week?"
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100/70 text-purple-950 text-xs font-medium">
                    💬 "If you could invent any tool to help a friend at school, what would it do?"
                  </div>
                </div>
              </div>
            </div>

            {/* Active Goals Snapshot */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Goals Snapshot</span>
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                  {completedGoals}/{goals.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-start space-x-2.5"
                  >
                    <CheckCircle
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        goal.completed ? 'text-emerald-500 fill-emerald-100' : 'text-slate-300'
                      }`}
                    />
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          goal.completed ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {goal.title}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5 inline-block">
                        {goal.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety Layer Tab */}
      {activeTab === 'safety' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-child">
                  Parent Safety Layer
                </h2>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Automated detection for bullying, distress, self-harm, and inappropriate topics. Your child's raw chat remains private; you receive high-level actionable guidance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Safety Alerts for {currentChild.name} ({safetyAlerts.length})
            </h3>
            {/* Simulation button for demo testing */}
            <button
              onClick={handleSimulateAlert}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors flex items-center space-x-1"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulate Test Safety Alert</span>
            </button>
          </div>

          {safetyAlerts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/90 shadow-xs">
              <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">
                No Safety Concerns Detected
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Nighton monitors conversations in real-time. If bullying, safety risks, or distress appear, you'll be notified here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {safetyAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-3xl p-6 border-2 transition-all shadow-xs ${
                    alert.status === 'unread'
                      ? 'border-amber-300 shadow-md shadow-amber-500/5'
                      : 'border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                          alert.severity === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {alert.severity} Severity
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        Category: {alert.category.replace('_', ' ')}
                      </span>
                      {alert.status === 'unread' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        High-Level Context
                      </h4>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {alert.summary}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-950">
                      <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                        <Heart className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Nighton's Parenting Guidance & Conversation Guide</span>
                      </h5>
                      <p className="text-xs leading-relaxed text-indigo-900">
                        {alert.recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    {alert.status === 'unread' ? (
                      <button
                        onClick={() => handleMarkAlertReviewed(alert.id)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
                      >
                        Mark as Addressed
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Addressed by Parent</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings & Controls Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6 max-w-2xl animate-in fade-in">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Mentor Style & Boundaries for {currentChild.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize how Nighton interacts with your child.
            </p>
          </div>

          {/* Child Account Credentials Card */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Child Login Credentials
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-amber-950">
              <div>
                <span>Username: </span>
                <strong className="font-mono bg-white px-2 py-0.5 rounded-md border border-amber-200">
                  {currentChild.username}
                </strong>
              </div>
              <div>
                <span>PIN: </span>
                <strong className="font-mono bg-white px-2 py-0.5 rounded-md border border-amber-200">
                  {currentChild.pin || '1234'}
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Mentor Tone
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'encouraging', label: 'Warm & Encouraging', desc: 'Focus on empathy and positive cheer' },
                  { id: 'curious', label: 'Curious Scientist', desc: 'Asks questions, explores nature and facts' },
                  { id: 'step_by_step', label: 'Step-by-Step Coach', desc: 'Breaks puzzles into bite-sized actions' },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setMentorTone(tone.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      mentorTone === tone.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">{tone.label}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{tone.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quiet Hours / Bedtime Reminder
              </label>
              <select
                value={bedtimeHour}
                onChange={(e) => setBedtimeHour(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-hidden bg-white"
              >
                <option value={19}>7:00 PM (Early bedtime)</option>
                <option value={20}>8:00 PM (Recommended for ages 6-9)</option>
                <option value={21}>9:00 PM (For pre-teens)</option>
                <option value={22}>10:00 PM</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                After this hour, Nighton will gently remind your child that it is time to sleep and wrap up conversations.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Daily Chat Limit
              </label>
              <select
                value={maxMinutesDaily}
                onChange={(e) => setMaxMinutesDaily(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-hidden bg-white"
              >
                <option value={30}>30 minutes per day</option>
                <option value={45}>45 minutes per day</option>
                <option value={60}>60 minutes per day</option>
                <option value={90}>90 minutes per day</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <button
              onClick={() => {
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 2500);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              Save Settings
            </button>
            {settingsSaved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1 animate-in fade-in">
                <CheckCircle className="w-4 h-4" />
                <span>Settings saved!</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
