require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Groq = require("groq-sdk");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 4000;

/* ------------------ MIDDLEWARE ------------------ */

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Slow down." },
  })
);

/* ------------------ GROQ ------------------ */

const getGroq = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

/* ------------------ UTIL: TIMEOUT WRAPPER ------------------ */

const withTimeout = (promise, ms = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI timeout")), ms)
    ),
  ]);
};

/* ------------------ IMAGE BUILDER ------------------ */

function buildImageUrl(prompt, seed) {
  const imagePrompt = `${prompt}, cinematic background, ultra HD, no text, smooth lighting, modern design`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    imagePrompt
  )}?width=1024&height=1024&seed=${seed}`;
}

/* ------------------ SAFE JSON PARSER ------------------ */

function parseLayout(text) {
  try {
    if (!text) return null;

    let cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) return null;

    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (err) {
    console.warn("⚠ JSON parse failed");
    return null;
  }
}

/* ------------------ VALIDATION ------------------ */

function validateLayout(layout) {
  if (!layout || typeof layout !== "object") return false;
  if (!layout.background) return false;
  if (!Array.isArray(layout.elements)) return false;

  return layout.elements.every(
    (el) =>
      typeof el.text === "string" &&
      typeof el.x === "number" &&
      typeof el.y === "number"
  );
}

/* ------------------ NORMALIZATION ------------------ */

function normalizeLayout(layout) {
  layout = layout || {};

  layout.background = layout.background || {};
  layout.background.gradient =
    layout.background.gradient ||
    "linear-gradient(135deg, #141e30, #243b55)";

  if (!Array.isArray(layout.elements)) {
    layout.elements = [];
  }

  if (layout.elements.length === 0) {
    layout.elements.push({
      id: "title",
      text: "Your Title",
      x: 200,
      y: 300,
      fontSize: 64,
      fontFamily: "Montserrat",
      color: "#ffffff",
      width: 600,
    });
  }

  layout.elements = layout.elements.map((el, i) => ({
    id: el.id || `el-${i}`,
    text: el.text || "Text",
    x: typeof el.x === "number" ? el.x : 150,
    y: typeof el.y === "number" ? el.y : 150 + i * 80,
    fontSize: el.fontSize || 36,
    fontFamily: el.fontFamily || "Montserrat",
    color: el.color || "#ffffff",
    width: el.width || 500,
  }));

  return layout;
}

/* ------------------ IMAGE PROXY ------------------ */

app.get("/api/proxy-image", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send("Missing URL");

    const response = await fetch(url);
    const buffer = await response.buffer();

    res.set("Content-Type", response.headers.get("content-type"));
    res.set("Access-Control-Allow-Origin", "*");

    res.send(buffer);
  } catch (err) {
    console.error("❌ Proxy error:", err.message);
    res.status(500).send("Proxy failed");
  }
});

/* ------------------ HEALTH ------------------ */

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ------------------ GENERATE ------------------ */

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt required" });
  }

  try {
    let layout = null;

    try {
      const groq = getGroq();

      const aiResponse = await withTimeout(
        groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          temperature: 0.5,
          messages: [
            {
              role: "system",
              content: `
You are a STRICT JSON layout generator.

Rules:
- Output ONLY JSON
- No explanation
- Max 3 elements
- Clean spacing
- Modern typography

Schema:
{
  "background": {
    "gradient": "string"
  },
  "elements": [
    {
      "id": "string",
      "text": "string",
      "x": number,
      "y": number,
      "fontSize": number,
      "color": "string"
    }
  ]
}
`,
            },
            { role: "user", content: prompt },
          ],
        })
      );

      const text = aiResponse.choices?.[0]?.message?.content || "";
      const parsed = parseLayout(text);

      if (validateLayout(parsed)) {
        layout = parsed;
      } else {
        console.warn("⚠ Invalid AI layout → fallback");
      }
    } catch (err) {
      console.warn("⚠ AI failed:", err.message);
    }

    layout = normalizeLayout(layout);

    /* background image */
    const seed = Math.floor(Math.random() * 99999);
    const rawUrl = buildImageUrl(prompt, seed);

    layout.background.imageUrl = `http://localhost:${PORT}/api/proxy-image?url=${encodeURIComponent(
      rawUrl
    )}`;

    res.json({
      success: true,
      layout,
    });
  } catch (err) {
    console.error("❌ Generate error:", err.message);
    res.status(500).json({ error: "Generation failed" });
  }
});

/* ------------------ REFINE ------------------ */

app.post("/api/refine", async (req, res) => {
  const { currentLayout, instruction } = req.body;

  if (!instruction) {
    return res.status(400).json({ error: "Instruction required" });
  }

  try {
    let layout = normalizeLayout(currentLayout);

    const text = instruction.toLowerCase();

    if (text.includes("bigger")) {
      layout.elements.forEach((el) => (el.fontSize += 10));
    }

    if (text.includes("smaller")) {
      layout.elements.forEach((el) => (el.fontSize -= 6));
    }

    if (text.includes("center")) {
      layout.elements.forEach((el) => {
        el.x = 512 - el.width / 2;
      });
    }

    if (text.includes("color")) {
      layout.elements.forEach((el) => {
        el.color = "#ffcc00";
      });
    }

    res.json({
      success: true,
      layout,
    });
  } catch (err) {
    console.error("❌ Refine error:", err.message);
    res.status(500).json({ error: "Refine failed" });
  }
});

/* ------------------ START ------------------ */

app.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
});