require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Groq = require("groq-sdk");
const https = require("https");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 4000;

/* --------------------------------------------------
   DEBUG LOGGER
-------------------------------------------------- */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/* --------------------------------------------------
   CORS
-------------------------------------------------- */
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://cover-gen-rx7n.vercel.app",
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.error("Blocked by CORS:", origin);
    return callback(new Error(`Origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options(/.*/, cors());

app.use(express.json({ limit: "1mb" }));

app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Slow down." },
}));

/* --------------------------------------------------
   GROQ
-------------------------------------------------- */
const getGroq = () => {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI timeout")), ms)
    ),
  ]);

/* --------------------------------------------------
   IMAGE URL BUILDER
-------------------------------------------------- */
function buildImageUrl(prompt, seed) {
  // Unsplash Source — free, instant, no API key, no CORS issues
  // Extracts keywords from prompt for relevant images
  const keywords = prompt
    .replace(/,.*$/g, "") // take first part before comma
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(",");
  return `https://source.unsplash.com/1600x900/?${encodeURIComponent(keywords)}&sig=${seed}`;
}

/* --------------------------------------------------
   FETCH WITH REDIRECT FOLLOWING (native Node https)
   No external dependencies needed
-------------------------------------------------- */
function fetchWithRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const follow = (currentUrl, remaining) => {
      if (remaining === 0) return reject(new Error("Too many redirects"));

      const client = currentUrl.startsWith("https") ? https : http;

      const req = client.get(currentUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CoverGen/1.0)",
        },
        timeout: 30000,
      }, (res) => {
        // Follow redirects (301, 302, 307, 308)
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          const nextUrl = res.headers.location.startsWith("http")
            ? res.headers.location
            : new URL(res.headers.location, currentUrl).href;
          res.resume(); // drain
          return follow(nextUrl, remaining - 1);
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({
          buffer: Buffer.concat(chunks),
          contentType: res.headers["content-type"] || "image/jpeg",
        }));
        res.on("error", reject);
      });

      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });
    };

    follow(url, maxRedirects);
  });
}

/* --------------------------------------------------
   IMAGE PROXY — fetches on server, sends to browser
   Browser never touches Pollinations directly
-------------------------------------------------- */
// app.get("/api/proxy-image", async (req, res) => {
//   const { url } = req.query;

//   if (!url) return res.status(400).send("Missing url param");

//   try {
//     console.log("Proxying image:", decodeURIComponent(url).slice(0, 80) + "…");

//     const { buffer, contentType } = await fetchWithRedirects(decodeURIComponent(url));

//     res.set({
//       "Content-Type": contentType,
//       "Content-Length": buffer.length,
//       "Cache-Control": "public, max-age=3600",
//       "Access-Control-Allow-Origin": "*",
//     });

//     res.send(buffer);
//     console.log(`✅ Proxied image: ${buffer.length} bytes`);
//   } catch (err) {
//     console.error("Proxy error:", err.message);
//     res.status(502).send("Image fetch failed: " + err.message);
//   }
// });

/* --------------------------------------------------
   JSON PARSER + VALIDATOR + NORMALIZER
-------------------------------------------------- */
function parseLayout(text) {
  try {
    if (!text) return null;
    let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function validateLayout(layout) {
  return layout &&
    layout.background &&
    Array.isArray(layout.elements) &&
    layout.elements.every(el => typeof el.id === "string" && typeof el.text === "string");
}

function normalizeLayout(layout) {
  layout = layout || {};
  layout.background = layout.background || {};
  layout.background.gradient = layout.background.gradient || "linear-gradient(135deg,#141e30,#243b55)";

  if (!Array.isArray(layout.elements)) layout.elements = [];

  layout.elements = layout.elements.map((el, i) => ({
    id: el.id || `el-${i + 1}`,
    type: "text",
    text: el.text || "Text",
    x: el.x ?? 100,
    y: el.y ?? 100 + i * 80,
    width: el.width ?? 500,
    fontSize: el.fontSize ?? 32,
    fontFamily: el.fontFamily || "Montserrat",
    fontWeight: el.fontWeight || "normal",
    fontStyle: el.fontStyle || "normal",
    color: el.color || "#ffffff",
    opacity: el.opacity ?? 1,
    rotation: el.rotation ?? 0,
    letterSpacing: el.letterSpacing ?? 0,
    lineHeight: el.lineHeight ?? 1.2,
    visible: true,
    locked: false,
    strokeColor: el.strokeColor || "#000000",
    strokeWidth: el.strokeWidth ?? 0,
    shadow: {
      enabled: el.shadow?.enabled ?? false,
      color: el.shadow?.color ?? "#000000",
      blur: el.shadow?.blur ?? 10,
      offsetX: el.shadow?.offsetX ?? 4,
      offsetY: el.shadow?.offsetY ?? 4,
    },
  }));

  if (layout.elements.length === 0) {
    layout.elements = [{
      id: "el-1", type: "text", text: "Your Design",
      x: 100, y: 200, width: 600, fontSize: 72,
      fontFamily: "Montserrat", fontWeight: "bold", fontStyle: "normal",
      color: "#ffffff", opacity: 1, rotation: 0, letterSpacing: 0, lineHeight: 1.2,
      visible: true, locked: false, strokeColor: "#000000", strokeWidth: 0,
      shadow: { enabled: false, color: "#000000", blur: 10, offsetX: 4, offsetY: 4 },
    }];
  }

  return layout;
}

/* --------------------------------------------------
   SYSTEM PROMPT
-------------------------------------------------- */
const SYSTEM_PROMPT = `You are an expert cover page designer like Canva.
Return ONLY valid JSON — no explanation, no markdown.

IMPORTANT: The user's input is a THEME or TOPIC — NOT the text to display.
You must INVENT creative, compelling text that fits the theme.
NEVER use the user's exact words as element text.

Examples:
- User says "modern image" → you write "VISION 2026", "The Future Is Now", "Beyond Boundaries"
- User says "book cover" → you write the actual book title, author name, tagline
- User says "music album" → you write the band name, album title, track listing style text
- User says "tech conference" → you write "INNOVATE", "Summit 2026", "Where Ideas Become Reality"

Canvas: 800x600px. Keep all elements within bounds.
Create 4-6 text elements with varied sizes for visual hierarchy.
Title elements: y between 120-280. Others spread naturally.

JSON format:
{
  "background": {
    "gradient": "linear-gradient(135deg, #hex1, #hex2)",
    "imagePrompt": "short cinematic background description, no people, no text"
  },
  "elements": [
    {
      "id": "el-1",
      "type": "text",
      "text": "YOUR INVENTED CREATIVE TEXT HERE",
      "x": 80, "y": 160,
      "width": 640,
      "fontSize": 72,
      "fontFamily": "Playfair Display",
      "fontWeight": "bold",
      "fontStyle": "normal",
      "color": "#ffffff",
      "opacity": 1,
      "rotation": 0,
      "letterSpacing": 2,
      "lineHeight": 1.1,
      "strokeColor": "#000000",
      "strokeWidth": 0,
      "shadow": { "enabled": true, "color": "#000000", "blur": 20, "offsetX": 0, "offsetY": 4 }
    }
  ]
}

fontFamily options: "Playfair Display","Montserrat","Bebas Neue","Raleway","Oswald","Cormorant Garamond","Merriweather","Lato"
Use high-contrast colors (white, cream, gold) for text on dark backgrounds.
Vary font sizes dramatically — mix 72px titles with 18px subtitles.
gradient should match the mood of the theme.`;

/* --------------------------------------------------
   HEALTH
-------------------------------------------------- */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", groq: !!process.env.GROQ_API_KEY, port: PORT });
});

/* --------------------------------------------------
   GENERATE
-------------------------------------------------- */
app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  try {
    let layout = null;

    try {
      const groq = getGroq();
      const aiResponse = await withTimeout(
        groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 2048,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Create a stunning cover page for: "${prompt}"` },
          ],
        })
      );

      const parsed = parseLayout(aiResponse.choices?.[0]?.message?.content || "");
      if (validateLayout(parsed)) layout = parsed;
    } catch (err) {
      console.warn("AI error, using fallback:", err.message);
    }

    layout = normalizeLayout(layout);

    const seed = Math.floor(Math.random() * 99999);
    const imagePrompt = layout.background?.imagePrompt || prompt;
    const pollinationsUrl = buildImageUrl(imagePrompt, seed);

    // Store raw URL for regeneration
    layout.background.imagePrompt = imagePrompt;
    layout.background.seed = seed;

    // Route image through our proxy — browser loads from localhost, no CORS issues
    layout.background.imageUrl = buildImageUrl(imagePrompt, seed);

    console.log(`✅ Generated layout for: "${prompt}"`);
    res.json({ success: true, layout });
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Generation failed" });
  }
});

/* --------------------------------------------------
   REFINE
-------------------------------------------------- */
app.post("/api/refine", async (req, res) => {
  const { currentLayout, instruction } = req.body;
  if (!instruction) return res.status(400).json({ error: "Instruction required" });

  try {
    const groq = getGroq();

    const layoutForAI = JSON.parse(JSON.stringify(currentLayout || {}));
    delete layoutForAI.background?.imageUrl;

    const aiResponse = await withTimeout(
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 2048,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Current layout:\n${JSON.stringify(layoutForAI, null, 2)}\n\nApply this change: "${instruction}"\n\nReturn the complete updated layout JSON.`,
          },
        ],
      })
    );

    let layout = parseLayout(aiResponse.choices?.[0]?.message?.content || "");
    if (!validateLayout(layout)) layout = currentLayout;
    layout = normalizeLayout(layout);

    const imagePromptChanged = layout.background?.imagePrompt !== currentLayout?.background?.imagePrompt;
    const seed = imagePromptChanged ? Math.floor(Math.random() * 99999) : (currentLayout?.background?.seed || 42);
    const imagePrompt = layout.background?.imagePrompt || currentLayout?.background?.imagePrompt || instruction;
    const pollinationsUrl = buildImageUrl(imagePrompt, seed);

    layout.background.imagePrompt = imagePrompt;
    layout.background.seed = seed;
   layout.background.imageUrl = buildImageUrl(imagePrompt, seed);

    console.log(`✅ Refined: "${instruction}"`);
    res.json({ success: true, layout });
  } catch (err) {
    console.error("Refine error:", err);
    res.status(500).json({ error: "Refine failed: " + err.message });
  }
});

/* --------------------------------------------------
   REGENERATE BACKGROUND
-------------------------------------------------- */
app.post("/api/regenerate-bg", async (req, res) => {
  const { imagePrompt } = req.body;
  if (!imagePrompt) return res.status(400).json({ error: "imagePrompt required" });

  const seed = Math.floor(Math.random() * 99999);
  const pollinationsUrl = buildImageUrl(imagePrompt, seed);

  res.json({
    success: true,
    imageUrl: `http://localhost:${PORT}/api/proxy-image?url=${encodeURIComponent(pollinationsUrl)}`,
    seed,
  });
});

/* --------------------------------------------------
   START
-------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`   Groq API Key : ${process.env.GROQ_API_KEY ? "✓ Loaded" : "✗ MISSING"}`);
  console.log(`   Image Proxy  : ✓ Built-in (no node-fetch needed)\n`);
});
