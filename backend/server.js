require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Groq = require("groq-sdk");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 4000;

/* --------------------------------------------------
   DEBUG LOGGER
-------------------------------------------------- */

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url}`
  );
  console.log("Origin:", req.headers.origin || "No Origin");
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

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("Blocked by CORS:", origin);

      return callback(
        new Error(`Origin not allowed: ${origin}`)
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options(/.*/, cors());

/* --------------------------------------------------
   BODY PARSER
-------------------------------------------------- */

app.use(express.json({ limit: "1mb" }));

/* --------------------------------------------------
   RATE LIMITER
-------------------------------------------------- */

app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests. Slow down.",
    },
  })
);

/* --------------------------------------------------
   GROQ
-------------------------------------------------- */

const getGroq = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
};

/* --------------------------------------------------
   TIMEOUT WRAPPER
-------------------------------------------------- */

const withTimeout = (promise, ms = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("AI timeout")),
        ms
      )
    ),
  ]);
};

/* --------------------------------------------------
   IMAGE BUILDER
-------------------------------------------------- */

function buildImageUrl(prompt, seed) {
const imagePrompt = `
${prompt},

cinematic sci-fi environment,
digital painting,
concept art,
background artwork,
empty space for title placement,
no typography,
no text,
no letters
cinematic illustration,
full background artwork,
highly detailed,
dramatic lighting,
clean composition,

EMPTY DESIGN SPACE,
NO WRITING,
NO TYPOGRAPHY,
NO LETTERS,
NO WORDS,
NO TITLE,
NO AUTHOR NAME,
NO LOGO,
NO WATERMARK,
NO MAGAZINE COVER,
NO BOOK COVER,
NO POSTER,
NO TEXT ANYWHERE,
TEXT FREE IMAGE,
PURE ARTWORK ONLY
`;

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    imagePrompt
  )}?width=1600&height=900&seed=${seed}`;
}

/* --------------------------------------------------
   SAFE JSON PARSER
-------------------------------------------------- */

function parseLayout(text) {
  try {
    if (!text) return null;

    let cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return null;
    }

    return JSON.parse(
      cleaned.slice(start, end + 1)
    );
  } catch (err) {
    console.warn("JSON parse failed");
    return null;
  }
}

/* --------------------------------------------------
   VALIDATION
-------------------------------------------------- */

function validateLayout(layout) {
  if (!layout) return false;

  if (!layout.background) return false;

  if (!Array.isArray(layout.elements)) return false;

  return layout.elements.every(
    (el) =>
      typeof el.id === "string" &&
      typeof el.text === "string"
  );
}

/* --------------------------------------------------
   NORMALIZATION
-------------------------------------------------- */

function normalizeLayout(layout) {
  layout = layout || {};

  layout.background = layout.background || {};

  layout.background.gradient =
    layout.background.gradient ||
    "linear-gradient(135deg,#141e30,#243b55)";

  if (!Array.isArray(layout.elements)) {
    layout.elements = [];
  }

  layout.elements = layout.elements.map((el, index) => ({
    id: el.id || `el-${index + 1}`,
    type: el.type || "text",

    text: el.text || "Text",

    x: el.x ?? 100,
    y: el.y ?? 100 + index * 80,

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

    visible: el.visible ?? true,
    locked: el.locked ?? false,

    stroke: el.stroke || "#000000",
    strokeWidth: el.strokeWidth ?? 0,

    shadow: {
      enabled: el.shadow?.enabled ?? false,
      color: el.shadow?.color ?? "#000000",
      blur: el.shadow?.blur ?? 10,
      offsetX: el.shadow?.offsetX ?? 4,
      offsetY: el.shadow?.offsetY ?? 4,
      opacity: el.shadow?.opacity ?? 0.5,
    },
  }));

  if (layout.elements.length === 0) {
    layout.elements = [
      {
        id: "el-1",
        type: "text",
        text: "Your Design",
        x: 100,
        y: 100,
        width: 600,
        fontSize: 72,
        color: "#ffffff",
      },
    ];
  }

  return layout;
}

/* --------------------------------------------------
   IMAGE PROXY
-------------------------------------------------- */

app.get("/api/proxy-image", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res
        .status(400)
        .send("Missing URL");
    }

    const response = await fetch(url);

    if (!response.ok) {
      return res
        .status(response.status)
        .send("Failed to fetch image");
    }

    const buffer = await response.buffer();

    res.set(
      "Content-Type",
      response.headers.get(
        "content-type"
      ) || "image/png"
    );

    res.send(buffer);
  } catch (err) {
    console.error(
      "Proxy image error:",
      err
    );

    res
      .status(500)
      .send("Proxy failed");
  }
});

/* --------------------------------------------------
   HEALTH
-------------------------------------------------- */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    port: PORT,
  });
});

/* --------------------------------------------------
   GENERATE
-------------------------------------------------- */

app.post(
  "/api/generate",
  async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt required",
      });
    }

    try {
      let layout = null;

      try {
        const groq = getGroq();

        const aiResponse =
          await withTimeout(
            groq.chat.completions.create({
              model:
                "llama-3.3-70b-versatile",
              temperature: 0.5,
              messages: [
                {
                  role: "system",
                  content: `
You are an expert Canva designer.

Return ONLY valid JSON.

Create 4-8 independent text elements.

Every piece of text must be a separate element.

Example:

{
  "background": {
    "gradient": "linear-gradient(135deg,#111,#222)"
  },
  "elements": [
    {
      "id":"el-1",
      "type":"text",
      "text":"THE FUTURE",
      "x":100,
      "y":80,
      "width":600,
      "fontSize":72,
      "fontWeight":"bold",
      "color":"#ffffff"
    },
    {
      "id":"el-2",
      "type":"text",
      "text":"OF AI",
      "x":100,
      "y":170,
      "width":600,
      "fontSize":72,
      "fontWeight":"bold",
      "color":"#ffffff"
    }
  ]
}

Rules:

- create 4-8 text blocks
- never use title/subtitle/author
- every phrase separate
- make layout visually attractive
- vary font sizes
- include positioning
- output JSON only
`,
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
            })
          );

        const text =
          aiResponse.choices?.[0]
            ?.message?.content || "";

        const parsed =
          parseLayout(text);

        if (
          validateLayout(parsed)
        ) {
          layout = parsed;
        }
      } catch (err) {
        console.warn(
          "AI fallback:",
          err.message
        );
      }

      layout =
        normalizeLayout(layout);

      const seed = Math.floor(
        Math.random() * 99999
      );

      const rawUrl =
        buildImageUrl(
          prompt,
          seed
        );

      layout.background.imageUrl =
        `http://localhost:${PORT}/api/proxy-image?url=${encodeURIComponent(
          rawUrl
        )}`;

      res.json({
        success: true,
        layout,
      });
    } catch (err) {
      console.error(
        "Generate error:",
        err
      );

      res.status(500).json({
        error:
          "Generation failed",
      });
    }
  }
);

/* --------------------------------------------------
   REFINE
-------------------------------------------------- */

app.post(
  "/api/refine",
  (req, res) => {
    try {
      const {
        currentLayout,
        instruction,
      } = req.body;

      if (!instruction) {
        return res.status(400).json({
          error:
            "Instruction required",
        });
      }

      let layout =
        normalizeLayout(
          currentLayout
        );

      const text =
        instruction.toLowerCase();

      if (
        text.includes("bigger")
      ) {
        layout.elements.forEach(
          (el) =>
            (el.fontSize += 10)
        );
      }

      if (
        text.includes("smaller")
      ) {
        layout.elements.forEach(
          (el) =>
            (el.fontSize -= 6)
        );
      }

      if (
        text.includes("center")
      ) {
        layout.elements.forEach(
          (el) => {
            el.x =
              512 -
              el.width / 2;
          }
        );
      }

      if (
        text.includes("color")
      ) {
        layout.elements.forEach(
          (el) => {
            el.color =
              "#ffcc00";
          }
        );
      }

      res.json({
        success: true,
        layout,
      });
    } catch (err) {
      console.error(
        "Refine error:",
        err
      );

      res.status(500).json({
        error:
          "Refine failed",
      });
    }
  }
);

/* --------------------------------------------------
   START SERVER
-------------------------------------------------- */

app.listen(PORT, () => {
  console.log(
    `🚀 Server running at http://localhost:${PORT}`
  );
});