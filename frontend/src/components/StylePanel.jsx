import React from "react";

export default function StylePanel({
  selectedElement,
  onChange,
}) {
  if (!selectedElement) {
    return <div style={styles.empty}>Select an element</div>;
  }

  const update = (key, value) => {
    onChange({
      ...selectedElement,
      [key]: value,
    });
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Style</h3>

      {/* TEXT */}
      <label style={styles.label}>Text</label>
      <input
        value={selectedElement.text}
        onChange={(e) => update("text", e.target.value)}
        style={styles.input}
      />

      {/* FONT SIZE */}
      <label style={styles.label}>Font Size</label>
      <input
        type="range"
        min="10"
        max="120"
        value={selectedElement.fontSize}
        onChange={(e) => update("fontSize", Number(e.target.value))}
      />
      <div style={styles.value}>{selectedElement.fontSize}px</div>

      {/* COLOR */}
      <label style={styles.label}>Color</label>
      <input
        type="color"
        value={selectedElement.color}
        onChange={(e) => update("color", e.target.value)}
      />

      {/* FONT FAMILY */}
      <label style={styles.label}>Font</label>
      <select
        value={selectedElement.fontFamily}
        onChange={(e) => update("fontFamily", e.target.value)}
        style={styles.input}
      >
        <option>Arial</option>
        <option>Montserrat</option>
        <option>Poppins</option>
        <option>Impact</option>
        <option>Courier New</option>
      </select>
    </div>
  );
}

const styles = {
  panel: {
    width: 260,
    padding: 20,
    background: "rgba(255,255,255,0.04)",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  title: {
    marginBottom: 10,
    color: "#fff",
  },

  label: {
    fontSize: 12,
    color: "#aaa",
  },

  input: {
    padding: 8,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#111",
    color: "#fff",
  },

  value: {
    fontSize: 12,
    color: "#888",
  },

  empty: {
    width: 260,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
  },
};