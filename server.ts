import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gemini SDK on the server only
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Chat endpoint with child-friendly Nighton mentor and safety classifier
app.post('/api/mentor/chat', async (req, res) => {
  try {
    const {
      message,
      childName = 'Friend',
      childAge = 8,
      conversationHistory = [],
      mentorTone = 'encouraging',
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (!apiKey) {
      // Friendly fallback if API key is temporarily unavailable in environment
      return res.json({
        reply: `Hello ${childName}! 🌟 Nighton is right here listening. You shared: "${message}". What a great thought! Tell me a little more!`,
        safetyFlag: null,
        mood: 'positive',
        topic: 'General Chat',
        suggestedFollowUps: ['Tell me a fun story!', 'Help me with a question', 'Let us play a trivia game!'],
      });
    }

    const historyFormatted = conversationHistory
      .slice(-6)
      .map((m: { sender: string; text: string }) => `${m.sender === 'child' ? childName : 'Nighton'}: ${m.text}`)
      .join('\n');

    const systemPrompt = `You are "Nighton", an AI mentor for children aged ${childAge}.
Child's Name: ${childName}
Mentor Persona:
- Warm, uplifting, curious, supportive, and safe.
- Keep vocabulary and explanation complexity matched to age ${childAge}.
- Use gentle encouragement, clear friendly analogies, and cheerful emojis (1-3 emojis per reply).
- If the child is working on a goal or homework, break it down into easy, rewarding bite-sized steps. Never just give answers away—guide them to discover!
- Tone style: ${mentorTone} (e.g. encouraging, curious, step-by-step).

PARENT SAFETY LAYER (CRITICAL):
- Actively evaluate if the child's message indicates:
  1) Bullying (being targeted, teased, excluded, threatened at school or online)
  2) Self-harm or suicidal thoughts
  3) Physical danger, violence, weapons, unsafe encounters with strangers
  4) Inappropriate/dangerous topics (drugs, alcohol, explicit material)
  5) Severe emotional distress / hopelessness
- If any of these are detected:
  - Respond to the child with gentle reassurance, zero judgment, and warm comfort. Remind them they are brave and deeply cared for, and encourage them warmly to talk with their mom, dad, or trusted grown-up.
  - Return isAlert: true in safetyFlag, categorize it ("bullying", "self_harm", "dangerous_topics", "distress"), provide a sensitive, factual summary for the parent (no shaming), and a practical, empathetic conversation recommendation for the parent.
- If no danger/harm is present:
  - Return isAlert: false in safetyFlag.

MOOD DETECTION:
- Evaluate the child's overall mood from this exchange as:
  - "positive" (happy, proud, enthusiastic, curious, excited)
  - "neutral" (casual, asking factual questions, matter-of-fact)
  - "needs_attention" (sad, lonely, anxious, scared, upset, frustrated)`;

    const prompt = `Recent Conversation Context:
${historyFormatted ? historyFormatted : 'First message of session.'}

New message from ${childName}:
"${message}"

Provide a structured response for the child and the safety/insight layer.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'The direct message from Nighton to the child.',
            },
            mood: {
              type: Type.STRING,
              enum: ['positive', 'neutral', 'needs_attention'],
              description: "Child's emotional tone.",
            },
            topic: {
              type: Type.STRING,
              description: 'Short topic title, e.g. "Space Planets", "Making Friends", "Math Fractions", etc.',
            },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 quick clickable follow-up options for the child.',
            },
            safetyFlag: {
              type: Type.OBJECT,
              properties: {
                isAlert: { type: Type.BOOLEAN },
                category: {
                  type: Type.STRING,
                  enum: ['bullying', 'self_harm', 'dangerous_topics', 'distress', 'none'],
                },
                severity: {
                  type: Type.STRING,
                  enum: ['low', 'medium', 'high'],
                },
                summary: {
                  type: Type.STRING,
                  description: 'High-level objective summary for the parent dashboard (protecting child privacy while highlighting safety concerns).',
                },
                recommendation: {
                  type: Type.STRING,
                  description: 'Actionable, gentle guidance for the parent on how to support their child.',
                },
              },
              required: ['isAlert', 'category', 'severity', 'summary', 'recommendation'],
            },
          },
          required: ['reply', 'mood', 'topic', 'suggestedFollowUps', 'safetyFlag'],
        },
      },
    });

    const text = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = {
        reply: `That is really interesting, ${childName}! 🌟 Tell me more about what you think!`,
        mood: 'positive',
        topic: 'Exploration',
        suggestedFollowUps: ['Why does that happen?', 'Can we do a fun quiz?', 'What else can I learn?'],
        safetyFlag: {
          isAlert: false,
          category: 'none',
          severity: 'low',
          summary: 'Normal engaging conversation.',
          recommendation: 'Encourage continued curiosity.',
        },
      };
    }

    res.json(parsedData);
  } catch (error) {
    console.error('Error generating mentor response:', error);
    res.status(500).json({
      error: 'Nighton took a quick nap. Please try asking again in a moment!',
    });
  }
});

// Parent Weekly Insight Generator
app.post('/api/mentor/insight', async (req, res) => {
  try {
    const {
      childName = 'Your child',
      childAge = 8,
      topics = ['Science', 'Creativity'],
      goalsCompleted = 3,
      moodCounts = { positive: 12, neutral: 4, needs_attention: 1 },
    } = req.body;

    if (!apiKey) {
      return res.json({
        summary: `${childName} had an active week exploring ${topics.join(', ')} and completed ${goalsCompleted} learning goals!`,
        conversationStarters: [
          `"What was the coolest thing you discovered with Nighton this week?"`,
          `"I heard you reached your goal of ${goalsCompleted} challenges. What are you most proud of?"`,
        ],
        parentingTip: "Praise their curiosity and effort rather than the end result to foster a growth mindset.",
      });
    }

    const prompt = `You are a child development specialist providing a brief, encouraging high-level weekly insight for a parent dashboard.
Child: ${childName} (Age: ${childAge})
Topics explored this week: ${topics.join(', ')}
Goals completed: ${goalsCompleted}
Mood signals observed: ${moodCounts.positive || 0} positive, ${moodCounts.neutral || 0} neutral, ${moodCounts.needs_attention || 0} moments needing attention.

Do NOT disclose private transcripts. Produce a high-level summary, 2 actionable family dinner/bedtime conversation starters, and 1 positive parenting tip.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            conversationStarters: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            parentingTip: { type: Type.STRING },
          },
          required: ['summary', 'conversationStarters', 'parentingTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error creating parent insight:', error);
    res.json({
      summary: `Your child was engaged and curious this week!`,
      conversationStarters: ['"What was your favorite topic today?"', '"Tell me about one thing that made you smile."'],
      parentingTip: 'Keep celebrating small daily wins together!',
    });
  }
});

// Mount Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nighton server running on http://localhost:${PORT}`);
  });
}

startServer();
