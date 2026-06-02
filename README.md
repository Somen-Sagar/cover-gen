# AI-Powered Cover Page Generator — Demo Project

A full-stack demo implementing the design from the technical spec:
**Prompt → AI → Structured JSON Layout → Editable Canvas Editor**

---

## 📁 Project Structure

```
cover-gen/
├── backend/          ← Node.js + Express API
│   ├── server.js     ← Main server (all routes here)
│   ├── .env.example  ← Copy to .env and add your key
│   └── package.json
│
└── frontend/         ← React + Vite + Konva.js
    ├── src/
    │   ├── App.jsx              ← Root app, state management
    │   ├── components/
    │   │   ├── PromptBar.jsx    ← Input + example prompts
    │   │   ├── Toolbar.jsx      ← Undo/Redo/Export/Add
    │   │   ├── CanvasEditor.jsx ← Konva canvas (drag/transform)
    │   │   ├── ElementsList.jsx ← Layer panel (left)
    │   │   ├── PropertiesPanel.jsx ← Style editor (right)
    │   │   └── RefinePanel.jsx  ← AI refinement bar
    │   ├── hooks/
    │   │   └── useHistory.js    ← Undo/Redo state history
    │   └── utils/
    │       └── api.js           ← Fetch helpers for backend
    └── package.json
```

---

## 🚀 Quick Start

### 1. Get an Anthropic API Key
Sign up at https://console.anthropic.com and create an API key.

### 2. Setup Backend

```bash
cd cover-gen/backend
npm install
cp .env.example .env
# Edit .env → paste your ANTHROPIC_API_KEY
npm run dev      # starts on http://localhost:4000
```

### 3. Setup Frontend (in a new terminal)

```bash
cd cover-gen/frontend
npm install
npm run dev      # starts on http://localhost:5173
```

### 4. Open the App
Visit **http://localhost:5173** in your browser.

---

## ✅ Features Implemented

| Feature | Status |
|---|---|
| AI layout generation (JSON) | ✅ |
| Gradient background rendering | ✅ |
| Draggable text elements | ✅ |
| Click-to-select elements | ✅ |
| Resize & rotate via transformer | ✅ |
| Undo / Redo (full history) | ✅ |
| Add new text elements | ✅ |
| Delete elements | ✅ |
| Font family picker | ✅ |
| Font size, weight, style, alignment | ✅ |
| Color picker | ✅ |
| Position (X/Y), opacity, rotation | ✅ |
| Layer panel (left) | ✅ |
| AI Refine (update existing layout) | ✅ |
| Export as PNG (2x resolution) | ✅ |
| Export as JSON | ✅ |
| Rate limiting (20 req/min) | ✅ |

---

## 🔌 API Endpoints

### `GET /api/health`
Health check.

### `POST /api/generate`
Generate a new layout from a text prompt.

**Body:**
```json
{ "prompt": "Annual Tech Summit 2026 cover page" }
```

**Response:**
```json
{
  "success": true,
  "layout": {
    "canvas": { "width": 800, "height": 600 },
    "background": { "gradient": "linear-gradient(...)" },
    "theme": { "primaryColor": "...", "secondaryColor": "...", "accentColor": "..." },
    "elements": [
      {
        "id": "title",
        "type": "text",
        "text": "Tech Summit 2026",
        "x": 80, "y": 200,
        "fontSize": 64,
        "fontFamily": "Playfair Display",
        "color": "#ffffff",
        "fontWeight": "bold",
        "fontStyle": "normal",
        "textAlign": "left",
        "rotation": 0,
        "opacity": 1,
        "width": 640
      }
    ]
  }
}
```

### `POST /api/refine`
Refine an existing layout using a natural language instruction.

**Body:**
```json
{
  "currentLayout": { ... },
  "instruction": "Make the title larger and change colors to gold and black"
}
```

---

## 🧪 Testing the Flow

1. **Type a prompt** → e.g. "Music album cover for a jazz band"
2. **Click Generate** → AI creates a structured JSON layout
3. **Click any text** on the canvas to select it
4. **Drag** to reposition, **use handles** to resize/rotate
5. **Edit** text, font, color in the right Properties panel
6. **Undo/Redo** with toolbar buttons
7. **Use AI Refine** to modify the entire layout with a new instruction
8. **Export PNG** for a high-res image, or **Export JSON** to save the editable structure

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| AI | Anthropic Claude (claude-sonnet-4) |
| Frontend | React 18, Vite |
| Canvas | Konva.js + react-konva |
| Fonts | Google Fonts |

---

## 🔮 What to Build Next (from the spec)

- [ ] Background image generation (Stable Diffusion / DALL-E)
- [ ] Snap-to-grid alignment guides
- [ ] Multi-layer z-index management
- [ ] Template marketplace / save/load projects
- [ ] Real-time collaboration
- [ ] Shape elements (rectangles, lines, icons)
- [ ] Image upload elements
# cover-gen
