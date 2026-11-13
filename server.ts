import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/wasm/source', (_req, res) => {
    try {
      const cPath = path.resolve(process.cwd(), 'public/wasm/quiz_engine.c');
      const code = fs.readFileSync(cPath, 'utf8');
      res.json({ source: code });
    } catch {
      res.status(404).json({ error: 'C source file not found.' });
    }
  });

  app.post('/api/ai/recommend', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        code: 'MISSING_API_KEY',
      });
    }

    const startedAt = performance.now();

    try {
      const { courses, quizHistory, completedLessons, accessibilityProfile } = req.body ?? {};

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are an adaptive accessibility and systems engineering curriculum advisor for an accessible e-learning platform.
Analyze the student's live learning telemetry below and generate 3 tailored, concrete recommendations (courses or quizzes from the available catalog) with actionable study focus and accessibility-aware guidance.

Available Courses & Quizzes:
${JSON.stringify(courses ?? [], null, 2)}

Completed Lesson IDs:
${JSON.stringify(completedLessons ?? [])}

Recent Quiz Attempts (scores are 0-100%, computed via C-Wasm engine):
${JSON.stringify(quizHistory ?? [], null, 2)}

Student Accessibility Preferences:
${JSON.stringify(accessibilityProfile ?? {})}

Respond strictly as JSON matching the schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Be concise, analytical, and grounded strictly in the provided student telemetry. Reference exact scores or completion gaps. Never fabricate scores that were not provided.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              learnerSummary: {
                type: Type.STRING,
                description: 'One concise 2-sentence synthesis of current strengths and gaps.',
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    targetId: {
                      type: Type.STRING,
                      description: 'Exact courseId or quizId from the provided catalog.',
                    },
                    targetType: {
                      type: Type.STRING,
                      description: 'Either "course" or "quiz".',
                    },
                    title: {
                      type: Type.STRING,
                      description: 'Recommendation headline.',
                    },
                    priority: {
                      type: Type.STRING,
                      description: 'One of "High", "Medium", or "Next Step".',
                    },
                    rationale: {
                      type: Type.STRING,
                      description: 'Specific reasoning grounded in quiz scores, timing, or incomplete lessons.',
                    },
                    studyTip: {
                      type: Type.STRING,
                      description: 'Concrete study action or accessibility tip.',
                    },
                  },
                },
              },
            },
          },
        },
      });

      const elapsedMs = Math.round(performance.now() - startedAt);
      const parsed = JSON.parse((response.text ?? '{}').trim());

      return res.json({
        model: 'gemini-4-hydrogen',
        latencyMs: elapsedMs,
        learnerSummary: parsed.learnerSummary ?? 'Personalized curriculum analysis ready.',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown Gemini API error';
      console.error('Gemini recommendation error:', message);
      return res.status(502).json({
        error: message,
        code: 'GEMINI_UPSTREAM_ERROR',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AccessiLearn Wasm server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
