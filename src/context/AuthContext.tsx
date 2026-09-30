import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  addDoc,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import {
  UserProfile,
  ChildProfile,
  ChildGoal,
  SafetyAlert,
  ParentInsight,
  UserRole
} from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  activeRole: UserRole;
  childrenList: ChildProfile[];
  activeChild: ChildProfile | null;
  loading: boolean;
  error: string | null;
  setActiveRole: (role: UserRole) => void;
  selectChild: (childId: string) => void;
  signInParent: (email: string, pass: string) => Promise<void>;
  signUpParent: (email: string, pass: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInChild: (username: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addChild: (data: { name: string; age: number; avatar: string; username: string; pin: string }) => Promise<ChildProfile>;
  updateChildStats: (childId: string, updates: Partial<ChildProfile>) => Promise<void>;
  seedDemoFamily: () => Promise<void>;
  loginAsDemoParent: () => void;
  loginAsDemoChild: (childName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial fallback mock data for instant offline/demo testing
const DEMO_PARENT_PROFILE: UserProfile = {
  id: 'demo-parent-sarah',
  displayName: 'Sarah Jenkins',
  email: 'sarah.jenkins@example.com',
  role: 'parent',
  avatar: '👩‍👧‍👦',
  createdAt: new Date().toISOString(),
};

const DEMO_CHILDREN: ChildProfile[] = [
  {
    id: 'child-leo-9',
    parentId: 'demo-parent-sarah',
    name: 'Leo',
    username: 'leo_explorer',
    avatar: '🦊',
    age: 9,
    pin: '1234',
    learningMinutesThisWeek: 95,
    currentMood: 'positive',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'child-maya-6',
    parentId: 'demo-parent-sarah',
    name: 'Maya',
    username: 'maya_star',
    avatar: '🦄',
    age: 6,
    pin: '5678',
    learningMinutesThisWeek: 45,
    currentMood: 'positive',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('parent');
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [activeChild, setActiveChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            setActiveRole(data.role || 'parent');
          } else {
            // New user registered via Google
            const newProfile: UserProfile = {
              id: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Parent',
              role: 'parent',
              avatar: '🌟',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            setActiveRole('parent');
          }
        } catch (err) {
          console.warn('Could not fetch user profile from Firestore:', err);
        }
      } else {
        // If no user is logged in, check if a demo session or child session was saved
        const savedDemo = localStorage.getItem('nighton_demo_mode');
        if (savedDemo === 'parent') {
          setUserProfile(DEMO_PARENT_PROFILE);
          setChildrenList(DEMO_CHILDREN);
          setActiveChild(DEMO_CHILDREN[0]);
          setActiveRole('parent');
        } else if (savedDemo === 'child') {
          setUserProfile(DEMO_PARENT_PROFILE);
          setChildrenList(DEMO_CHILDREN);
          setActiveChild(DEMO_CHILDREN[0]);
          setActiveRole('child');
        } else {
          // Default to demo parent for instant preview satisfaction
          setUserProfile(DEMO_PARENT_PROFILE);
          setChildrenList(DEMO_CHILDREN);
          setActiveChild(DEMO_CHILDREN[0]);
          setActiveRole('parent');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to linked children whenever logged-in parent changes
  useEffect(() => {
    if (!user || userProfile?.role !== 'parent') return;

    const childrenRef = collection(db, 'children');
    const q = query(childrenRef, where('parentId', '==', user.uid));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const kids: ChildProfile[] = [];
        snapshot.forEach((docSnap) => {
          kids.push({ id: docSnap.id, ...(docSnap.data() as Omit<ChildProfile, 'id'>) });
        });
        setChildrenList(kids);
        if (kids.length > 0 && !activeChild) {
          setActiveChild(kids[0]);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'children');
      }
    );

    return () => unsub();
  }, [user, userProfile]);

  const selectChild = (childId: string) => {
    const found = childrenList.find((c) => c.id === childId);
    if (found) {
      setActiveChild(found);
    }
  };

  const signInParent = async (email: string, pass: string) => {
    setError(null);
    try {
      localStorage.removeItem('nighton_demo_mode');
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
      throw err;
    }
  };

  const signUpParent = async (email: string, pass: string, name: string) => {
    setError(null);
    try {
      localStorage.removeItem('nighton_demo_mode');
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, 'users', cred.user.uid);
      const profile: UserProfile = {
        id: cred.user.uid,
        email,
        displayName: name || 'Parent',
        role: 'parent',
        avatar: '👩‍👧‍👦',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, profile);
      setUserProfile(profile);
      setActiveRole('parent');
      // Seed initial demo children for this parent
      await seedFamilyForParent(cred.user.uid, name);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      localStorage.removeItem('nighton_demo_mode');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Google sign in failed.');
      throw err;
    }
  };

  const signInChild = async (username: string, pin: string): Promise<boolean> => {
    setError(null);
    // 1. Check local childrenList first
    const matched = childrenList.find(
      (c) => c.username.toLowerCase() === username.trim().toLowerCase() && c.pin === pin.trim()
    );
    if (matched) {
      setActiveChild(matched);
      setActiveRole('child');
      return true;
    }

    // 2. Check demo kids
    const demoMatched = DEMO_CHILDREN.find(
      (c) => c.username.toLowerCase() === username.trim().toLowerCase() && c.pin === pin.trim()
    );
    if (demoMatched) {
      setActiveChild(demoMatched);
      setActiveRole('child');
      localStorage.setItem('nighton_demo_mode', 'child');
      return true;
    }

    // 3. Otherwise try querying firestore if user is online
    try {
      const q = query(
        collection(db, 'children'),
        where('username', '==', username.trim().toLowerCase()),
        where('pin', '==', pin.trim())
      );
      // Wait for snapshot
      let foundChild: ChildProfile | null = null;
      onSnapshot(q, (snapshot) => {
        snapshot.forEach((d) => {
          foundChild = { id: d.id, ...(d.data() as Omit<ChildProfile, 'id'>) };
        });
      });
      if (foundChild) {
        setActiveChild(foundChild);
        setActiveRole('child');
        return true;
      }
    } catch (e) {
      console.warn('Child signin check failed:', e);
    }

    setError('Could not find a child account with that username and PIN.');
    return false;
  };

  const logout = async () => {
    try {
      localStorage.removeItem('nighton_demo_mode');
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setChildrenList(DEMO_CHILDREN);
      setActiveChild(DEMO_CHILDREN[0]);
      setActiveRole('parent');
    } catch (err) {
      console.error(err);
    }
  };

  const addChild = async (data: {
    name: string;
    age: number;
    avatar: string;
    username: string;
    pin: string;
  }): Promise<ChildProfile> => {
    const parentId = user ? user.uid : (userProfile?.id || 'demo-parent-sarah');
    const newChildData: Omit<ChildProfile, 'id'> = {
      parentId,
      name: data.name,
      username: data.username.toLowerCase().replace(/\s+/g, '_'),
      avatar: data.avatar || '🦊',
      age: data.age,
      pin: data.pin || '1234',
      learningMinutesThisWeek: 0,
      currentMood: 'positive',
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        const docRef = await addDoc(collection(db, 'children'), newChildData);
        const created: ChildProfile = { id: docRef.id, ...newChildData };
        setActiveChild(created);
        return created;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'children');
      }
    } else {
      const demoId = `child-${Date.now()}`;
      const created: ChildProfile = { id: demoId, ...newChildData };
      setChildrenList((prev) => [...prev, created]);
      setActiveChild(created);
      return created;
    }
  };

  const updateChildStats = async (childId: string, updates: Partial<ChildProfile>) => {
    if (user) {
      try {
        const childRef = doc(db, 'children', childId);
        await updateDoc(childRef, updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `children/${childId}`);
      }
    } else {
      setChildrenList((prev) =>
        prev.map((c) => (c.id === childId ? { ...c, ...updates } : c))
      );
      if (activeChild && activeChild.id === childId) {
        setActiveChild((prev) => (prev ? { ...prev, ...updates } : null));
      }
    }
  };

  const seedFamilyForParent = async (parentId: string, parentName: string) => {
    try {
      // Create Leo
      const leoRef = await addDoc(collection(db, 'children'), {
        parentId,
        name: 'Leo',
        username: 'leo_explorer',
        avatar: '🦊',
        age: 9,
        pin: '1234',
        learningMinutesThisWeek: 95,
        currentMood: 'positive',
        createdAt: new Date().toISOString(),
      });

      // Create Maya
      const mayaRef = await addDoc(collection(db, 'children'), {
        parentId,
        name: 'Maya',
        username: 'maya_star',
        avatar: '🦄',
        age: 6,
        pin: '5678',
        learningMinutesThisWeek: 45,
        currentMood: 'positive',
        createdAt: new Date().toISOString(),
      });

      // Seed Leo goals
      await addDoc(collection(db, 'goals'), {
        childId: leoRef.id,
        parentId,
        title: 'Read 20 minutes about Outer Space 🪐',
        category: 'learning',
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'goals'), {
        childId: leoRef.id,
        parentId,
        title: 'Practice multiplication table of 7 & 8 ✖️',
        category: 'learning',
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'goals'), {
        childId: leoRef.id,
        parentId,
        title: 'Help water the garden plants 🌱',
        category: 'kindness',
        completed: false,
        createdAt: new Date().toISOString(),
      });

      // Seed 1 Safety Alert for Leo so parent can experience the safety layer
      await addDoc(collection(db, 'safetyAlerts'), {
        childId: leoRef.id,
        parentId,
        childName: 'Leo',
        category: 'bullying',
        severity: 'medium',
        summary: 'Leo mentioned feeling excluded by two classmates during soccer recess.',
        recommendation:
          'Ask Leo about recess in an open, gentle way: "Who did you play with today during soccer? How was the team feeling?" Validate his emotions without placing immediate blame.',
        status: 'unread',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      });

      // Seed Parent Insight
      await addDoc(collection(db, 'parentInsights'), {
        parentId,
        childId: leoRef.id,
        childName: 'Leo',
        weekStartDate: new Date(Date.now() - 86400000 * 6).toISOString(),
        learningMinutes: 95,
        goalsCompleted: 2,
        goalsTotal: 3,
        moodTrend: 'positive',
        highlightSummary: 'Leo showed high enthusiasm exploring black holes and stellar science, while expressing mild hesitation regarding soccer friendships.',
        suggestedTopics: 'Black hole trivia, team sport dynamics, and positive playground boundaries.',
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Seed family failed:', e);
    }
  };

  const seedDemoFamily = async () => {
    if (user) {
      await seedFamilyForParent(user.uid, userProfile?.displayName || 'Parent');
    } else {
      setChildrenList(DEMO_CHILDREN);
      setActiveChild(DEMO_CHILDREN[0]);
    }
  };

  const loginAsDemoParent = () => {
    localStorage.setItem('nighton_demo_mode', 'parent');
    setUserProfile(DEMO_PARENT_PROFILE);
    setChildrenList(DEMO_CHILDREN);
    setActiveChild(DEMO_CHILDREN[0]);
    setActiveRole('parent');
  };

  const loginAsDemoChild = (childName: string = 'Leo') => {
    localStorage.setItem('nighton_demo_mode', 'child');
    setUserProfile(DEMO_PARENT_PROFILE);
    setChildrenList(DEMO_CHILDREN);
    const chosen = DEMO_CHILDREN.find((c) => c.name.toLowerCase() === childName.toLowerCase()) || DEMO_CHILDREN[0];
    setActiveChild(chosen);
    setActiveRole('child');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        activeRole,
        childrenList,
        activeChild,
        loading,
        error,
        setActiveRole,
        selectChild,
        signInParent,
        signUpParent,
        signInWithGoogle,
        signInChild,
        logout,
        addChild,
        updateChildStats,
        seedDemoFamily,
        loginAsDemoParent,
        loginAsDemoChild,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
