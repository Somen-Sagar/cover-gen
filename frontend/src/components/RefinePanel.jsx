import React, { useState } from "react";

const SUGGESTIONS = [
  "Make the title larger and bolder",
  "Change the color scheme to gold and black",
  "Add a subtitle with today's date",
  "Make the layout more minimal",
  "Add a tagline at the bottom",
];

export default function RefinePanel({ onRefine, loading, hasLayout }) {
  const [instruction, setInstruction] = useState("");

  const handle = (val) => {
    const v = val ?? instruction;
    if (!v.trim() || loading || !hasLayout) return;
    onRefine(v.trim());
    if (!val) setInstruction("");
  };

  if (!hasLayout) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.label}>✦ AI Refine</div>
      <div style={styles.row}>
        <input
          style={styles.input}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. Make the title bolder and add a subtitle..."
          onKeyDown={(e) => e.key === "Enter" && handle()}
          disabled={loading}
        />
        <button style={styles.btn} onClick={() => handle()} disabled={loading || !instruction.trim()}>
          {loading ? <span className="spinner" /> : "Refine"}
        </button>
      </div>
      <div style={styles.chips}>
        {SUGGESTIONS.map((s) => (
          <button key={s} style={styles.chip} onClick={() => handle(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    padding: "10px 20px",
    borderTop: "1px solid #2a2a35",
    background: "#0c0c0f",
    display: "flex", flexDirection: "column", gap: 8,
  },
  label: { fontSize: 11, color: "#7c6af7", fontWeight: 700, letterSpacing: "0.08em" },
  row: { display: "flex", gap: 8 },
  input: {
    flex: 1, background: "#1e1e25", border: "1px solid #2a2a35",
    borderRadius: 7, color: "#f0f0f5", fontSize: 13, padding: "7px 12px",
  },
  btn: {
    background: "#2a2a3a", border: "1px solid #3a3a50",
    color: "#c0c0d0", fontWeight: 600, fontSize: 12,
    padding: "7px 16px", borderRadius: 7, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "Montserrat, sans-serif",
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 5 },
  chip: {
    background: "#1e1e25", border: "1px solid #2a2a35",
    color: "#7a7a90", fontSize: 11, borderRadius: 16,
    padding: "3px 10px", cursor: "pointer",
    fontFamily: "Montserrat, sans-serif",
  },
};
