const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function extractJson(text) {
  if (!text) return { error: "Empty response", raw: text };
  const t = String(text).trim();
  // 1) Direct parse
  const direct = safeParseJson(t);
  if (direct) return direct;
  // 2) Strip code fences
  const unfenced = t.replace(/```json|```/g, "").trim();
  const fencedParsed = safeParseJson(unfenced);
  if (fencedParsed) return fencedParsed;
  // 3) Braces window
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const sliced = t.slice(first, last + 1);
    const slicedParsed = safeParseJson(sliced);
    if (slicedParsed) return slicedParsed;
  }
  return { error: "Invalid JSON from model", raw: text };
}

function isRetryableError(error) {
  const msg = (error?.message || "").toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("overloaded") ||
    msg.includes("rate") ||
    msg.includes("429")
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Generate workout plan using Gemini
router.post("/workout-plan", async (req, res) => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const payload = req.body || {};

    const prompt = `You are a fitness coach. Create a clear, actionable weekly workout plan in JSON only for the following user. Do not include any markdown fences or commentary.
User profile JSON: ${JSON.stringify(payload)}
Return JSON with this exact shape:
{
  "result": {
    "goal": string,
    "fitness_level": string,
    "schedule": { "days_per_week": number, "session_duration": number },
    "exercises": [
      { "day": string, "exercises": [ { "name": string, "duration": string | null, "repetitions": string | null, "sets": string | null, "equipment": string } ] }
    ],
    "seo_content": string
  }
}`;

    let lastErr;
    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        });
        lastErr = undefined;
        break;
      } catch (err) {
        lastErr = err;
        if (!isRetryableError(err) || attempt === 2) {
          throw err;
        }
        await sleep(500 * (attempt + 1));
      }
    }
    const text = result.response.text();
    const json = extractJson(text);
    res.json(json);
  } catch (error) {
    console.error("Gemini workout-plan error:", error);
    res.status(500).json({ error: error.message || "Failed to generate plan" });
  }
});

// Analyze meal image using Gemini Vision
router.post("/analyze-meal", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Image file is required (field name: image)" });
    }
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const base64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    const prompt = `Analyze the food in this image. Estimate total calories and macronutrients. Respond with pure JSON only, no markdown fences, matching this shape:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "items": [ { "name": string, "confidence": number } ],
  "recommendations": string[]
}`;

    let lastErr;
    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { data: base64, mimeType } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        });
        lastErr = undefined;
        break;
      } catch (err) {
        lastErr = err;
        if (!isRetryableError(err) || attempt === 2) {
          throw err;
        }
        await sleep(500 * (attempt + 1));
      }
    }
    const text = result.response.text();
    const json = extractJson(text);
    res.json(json);
  } catch (error) {
    console.error("Gemini analyze-meal error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze meal" });
  }
});

module.exports = router;

// Chat with Gemini (contextual Q&A about workouts/app)
router.post("/chat", async (req, res) => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const { messages } = req.body || { messages: [] };
    // Build chat content; include brief system guidance
    const parts = [
      {
        text: "You are FitMentor assistant. Be brief, helpful, and specific to workouts and this app. If asked about user data, reference generic guidance unless provided explicitly in context.",
      },
    ];
    for (const m of messages || []) {
      parts.push({ text: `${m.role || "user"}: ${m.content}` });
    }

    let result;
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts }],
          generationConfig: { maxOutputTokens: 512 },
        });
        lastErr = undefined;
        break;
      } catch (err) {
        lastErr = err;
        if (!isRetryableError(err) || attempt === 2) throw err;
        await sleep(400 * (attempt + 1));
      }
    }
    const text = result.response.text();
    res.json({ message: text });
  } catch (error) {
    console.error("Gemini chat error:", error);
    res.status(500).json({ error: error.message || "Failed to chat" });
  }
});

// Generate a short session quiz (3 questions) based on a provided plan/day
router.post("/session-quiz", async (req, res) => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const { sessionContext } = req.body || {};
    const prompt = `Create a short quiz JSON (no markdown) with 3 multiple-choice questions about this workout session. Focus on correct form, safety, breathing, and target muscles. Strict JSON format:
{
  "questions": [
    { "q": string, "choices": [string, string, string, string], "answerIndex": number }
  ]
}
Session JSON: ${JSON.stringify(sessionContext || {})}`;

    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        });
        break;
      } catch (err) {
        if (!isRetryableError(err) || attempt === 2) throw err;
        await sleep(400 * (attempt + 1));
      }
    }
    const json = extractJson(result.response.text());
    res.json(json);
  } catch (error) {
    console.error("Gemini session-quiz error:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz" });
  }
});

// Score quiz answers quickly (return score 0-3)
router.post("/session-quiz-score", async (req, res) => {
  try {
    const { quiz, answers } = req.body || {};
    if (!quiz?.questions || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.answerIndex) score += 1;
    });
    res.json({ score, total: quiz.questions.length });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to score quiz" });
  }
});

// Diet coach advice (general wellness guidance, non-medical)
router.post("/diet-coach", async (req, res) => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const { profile, nutritionSummary, preferences } = req.body || {};
    const prompt = `You are a professional fitness and nutrition coach. Provide general wellness, non-medical dietary guidance tailored to the user's profile and goals. Avoid medical claims and include a brief disclaimer. Use clear, actionable bullet points and a concise plan.

Return structured markdown (no code fences) with these sections:
Title
Disclaimer (1-2 lines)
Overview (2-3 lines)
Daily Targets (bullets)
Meal Ideas (bullets)
Tips (bullets)

User Profile JSON: ${JSON.stringify(profile || {})}
Recent Nutrition Summary JSON: ${JSON.stringify(nutritionSummary || {})}
User Preferences JSON: ${JSON.stringify(preferences || {})}`;

    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 900 },
        });
        break;
      } catch (err) {
        if (!isRetryableError(err) || attempt === 2) throw err;
        await sleep(500 * (attempt + 1));
      }
    }
    const text = result.response.text();
    res.json({ advice: text });
  } catch (error) {
    console.error("Gemini diet-coach error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to get diet advice" });
  }
});
