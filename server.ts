import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header as required by guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Assistant Endpoint - Standard Generation
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in the server environment.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          systemInstruction ||
          'You are FacultyOS AI Teaching Assistant, an expert academic colleague helping college professors with curriculum, lesson design, rubrics, and pedagogy. Provide rigorous, scholarly, and immediately actionable academic materials.',
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate response from Gemini API',
    });
  }
});

// AI Assistant Endpoint - Structured Lesson Plan Draft
app.post('/api/ai/lesson-plan', async (req, res) => {
  try {
    const { subject, unit, topic, duration, targetClass } = req.body;
    if (!topic || !subject) {
      return res.status(400).json({ error: 'Subject and topic are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in the server environment.',
      });
    }

    const prompt = `Generate a detailed college-level lesson plan for:
Subject: ${subject}
Target Class: ${targetClass || 'Undergraduate'}
Unit: ${unit || 'Unit 1'}
Topic: ${topic}
Allocated Duration: ${duration || '50 minutes'}

Format the response in JSON with the following keys:
{
  "learningObjectives": ["string"],
  "expectedOutcomes": ["string"],
  "prerequisiteKnowledge": ["string"],
  "teachingMethodology": "Lecture / Discussion / Demonstration / Lab / Problem-Solving",
  "teachingAids": ["string"],
  "timeline": [
    { "phase": "Introduction / Hook", "minutes": 10, "activity": "string" },
    { "phase": "Core Instruction", "minutes": 25, "activity": "string" },
    { "phase": "Active Discussion / Practice", "minutes": 10, "activity": "string" },
    { "phase": "Summary & Check for Understanding", "minutes": 5, "activity": "string" }
  ],
  "homeworkOrFollowUp": "string",
  "reflectionNotes": "string"
}
Respond with only valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let resultJson;
    try {
      resultJson = JSON.parse(response.text || '{}');
    } catch {
      resultJson = { raw: response.text };
    }

    return res.json({ lessonPlan: resultJson });
  } catch (error: any) {
    console.error('Lesson Plan AI Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate lesson plan',
    });
  }
});

// AI Assistant Endpoint - Quiz & Question Bank Generator
app.post('/api/ai/quiz-generator', async (req, res) => {
  try {
    const { subject, topic, count, difficulty } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in the server environment.',
      });
    }

    const prompt = `Generate ${count || 5} academic examination/quiz questions for:
Subject: ${subject || 'Engineering / Computer Science'}
Topic: ${topic}
Difficulty: ${difficulty || 'Medium'}

Format the response in JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "string",
      "type": "MCQ or Short Answer or Descriptive",
      "options": ["A", "B", "C", "D"], // for MCQ only
      "correctAnswer": "string",
      "marks": 2,
      "bloomTaxonomy": "Remember / Understand / Apply / Analyze / Evaluate / Create",
      "rationale": "string"
    }
  ]
}
Respond with only valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let resultJson;
    try {
      resultJson = JSON.parse(response.text || '{}');
    } catch {
      resultJson = { raw: response.text };
    }

    return res.json({ result: resultJson });
  } catch (error: any) {
    console.error('Quiz AI Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate quiz questions',
    });
  }
});

// AI Assistant Endpoint - Remedial Activity Plan
app.post('/api/ai/remedial', async (req, res) => {
  try {
    const { subject, topic, deficiencyDescription } = req.body;
    if (!deficiencyDescription) {
      return res.status(400).json({ error: 'Deficiency description is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in the server environment.',
      });
    }

    const prompt = `As an empathetic university academic mentor, formulate a personalized remedial teaching and academic support plan for a student struggling with:
Subject: ${subject || 'Core Course'}
Specific Topic / Concept: ${topic || 'Fundamental Concept'}
Issue / Observation: ${deficiencyDescription}

Format response in JSON:
{
  "rootCauseAnalysis": "string",
  "remedialStrategy": "string",
  "stepByStepActionPlan": [
    { "step": 1, "title": "string", "description": "string", "targetDuration": "string" }
  ],
  "recommendedPracticeResources": ["string"],
  "followUpChecklist": ["string"],
  "mentorEncouragementNote": "string"
}
Respond with only valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let resultJson;
    try {
      resultJson = JSON.parse(response.text || '{}');
    } catch {
      resultJson = { raw: response.text };
    }

    return res.json({ remedialPlan: resultJson });
  } catch (error: any) {
    console.error('Remedial AI Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate remedial plan',
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'FacultyOS Server',
    time: new Date().toISOString(),
  });
});

// Dev vs Prod Vite Integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FacultyOS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
