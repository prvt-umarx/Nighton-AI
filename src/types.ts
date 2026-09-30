export type UserRole = 'parent' | 'child';

export interface UserProfile {
  id: string;
  email?: string;
  displayName: string;
  role: UserRole;
  parentId?: string;
  avatar?: string;
  age?: number;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  childUid?: string;
  name: string;
  username: string;
  avatar: string;
  age: number;
  pin?: string;
  learningMinutesThisWeek: number;
  currentMood: 'positive' | 'neutral' | 'needs_attention';
  createdAt: string;
}

export interface Conversation {
  id: string;
  childId: string;
  parentId: string;
  title: string;
  topic: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  childId: string;
  sender: 'child' | 'nighton' | 'system';
  text: string;
  moodDetected?: 'positive' | 'neutral' | 'needs_attention' | 'curious' | 'proud';
  safetyFlag?: string;
  timestamp: string;
}

export interface ChildGoal {
  id: string;
  childId: string;
  parentId: string;
  title: string;
  category: 'learning' | 'kindness' | 'health' | 'creativity' | 'routine';
  completed: boolean;
  targetDays?: number;
  completedAt?: string;
  createdAt: string;
}

export interface SafetyAlert {
  id: string;
  childId: string;
  parentId: string;
  childName: string;
  category: 'bullying' | 'self_harm' | 'dangerous_topics' | 'distress' | 'inappropriate_contact';
  severity: 'low' | 'medium' | 'high';
  summary: string;
  recommendation: string;
  status: 'unread' | 'acknowledged' | 'resolved';
  createdAt: string;
}

export interface ParentInsight {
  id: string;
  parentId: string;
  childId: string;
  childName: string;
  weekStartDate: string;
  learningMinutes: number;
  goalsCompleted: number;
  goalsTotal: number;
  moodTrend: 'positive' | 'neutral' | 'needs_attention';
  highlightSummary: string;
  suggestedTopics: string;
  updatedAt: string;
}

export interface MentorToneSettings {
  tone: 'encouraging' | 'curious' | 'step_by_step';
  bedtimeQuietHour: number; // e.g. 21 (9 PM)
  maxDailyMinutes: number;
}
