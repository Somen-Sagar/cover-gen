import React, { useState } from "react";

/* ---------- PRESETS ---------- */
const PRESETS = [
  { label: "YouTube", value: "YouTube thumbnail, bold, high contrast, modern" },
  { label: "Book", value: "book cover, elegant typography, minimal, professional" },
  { label: "Poster", value: "event poster, cinematic, dramatic lighting" },
  { label: "Startup", value: "startup presentation cover, clean UI, modern SaaS" },
  { label: "Album", value: "music album cover, artistic, moody, creative" },
];

/* ---------- STYLES ---------- */
const STYLES = [
  "minimal",
  "bold",
  "luxury",
  "dark",
  "colorful",
  "futuristic",
];

export default function PromptBar({ onGenerate, loading }) {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [focused, setFocused] = useState(false);

  const buildPrompt = () => {
    let parts = [];
    if (selectedPreset) parts.push(selectedPreset);
    if (prompt) parts.push(prompt);
    if (selectedStyle) parts.push(selectedStyle);
    return parts.join(" | ");
  };

  const handle = () => {
    if (loading) return;
    const finalPrompt = buildPrompt();
    if (!finalPrompt.trim()) return;

    onGenerate(finalPrompt);
    setPrompt("");
  };

  return (
    <div style={styles.wrap}>
      {/* INPUT */}
      <div
        style={{
          ...styles.inner,
          border: focused
            ? "1px solid rgba(139,124,255,0.6)"
            : "1px solid rgba(255,255,255,0.08)",
          boxShadow: focused
            ? "0 0 20px rgba(139,124,255,0.25)"
            : "none",
        }}
      >
        <span style={styles.icon}>✦</span>

        <input
          style={styles.input}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your design… (e.g. modern tech YouTube thumbnail with neon glow)"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === "Enter" && handle()}
        />

        <button
          style={{
            ...styles.btn,
            opacity: loading ? 0.6 : 1,
            transform: loading ? "scale(0.98)" : "scale(1)",
          }}
          onClick={handle}
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>

      {/* PRESETS */}
      <div style={styles.row}>
        {PRESETS.map((p) => {
          const active = selectedPreset === p.value;
          return (
            <button
              key={p.label}
              onClick={() => setSelectedPreset(p.value)}
              style={{
                ...styles.chip,
                background: active
                  ? "linear-gradient(135deg,#8b7cff,#6a5cff)"
                  : "rgba(255,255,255,0.03)",
                border: active
                  ? "1px solid rgba(139,124,255,0.6)"
                  : "1px solid rgba(255,255,255,0.08)",
                color: active ? "#fff" : "#aaa",
                boxShadow: active
                  ? "0 0 12px rgba(139,124,255,0.4)"
                  : "none",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* STYLES */}
      <div style={styles.row}>
        {STYLES.map((s) => {
          const active = selectedStyle === s;
          return (
            <button
              key={s}
              onClick={() =>
                setSelectedStyle(active ? "" : s)
              }
              style={{
                ...styles.chip,
                background: active
                  ? "linear-gradient(135deg,#ff7aa2,#ff5c87)"
                  : "rgba(255,255,255,0.03)",
                border: active
                  ? "1px solid rgba(255,122,162,0.6)"
                  : "1px solid rgba(255,255,255,0.08)",
                color: active ? "#fff" : "#aaa",
                boxShadow: active
                  ? "0 0 12px rgba(255,122,162,0.4)"
                  : "none",
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */
const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "18px 24px",
    background: "rgba(10,10,20,0.6)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },

  inner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: "12px 16px",
    transition: "all 0.2s ease",
  },

  icon: {
    fontSize: 18,
    color: "#8b7cff",
    textShadow: "0 0 10px rgba(139,124,255,0.6)",
  },

  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#f5f5ff",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
  },

  btn: {
    background: "linear-gradient(135deg,#8b7cff,#ff7aa2)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 10,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 6px 20px rgba(139,124,255,0.3)",
  },

  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 11,
    cursor: "pointer",
    transition: "all 0.2s ease",
    backdropFilter: "blur(6px)",
  },
};