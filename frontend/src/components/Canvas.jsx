import React from "react";
import Background from "./Background";
import DraggableText from "./DraggableText";

export default function Canvas({ layout, setLayout }) {
  if (!layout) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.canvas}>
        {/* Background */}
        <Background layout={layout} />

        {/* Grid Overlay */}
        <div style={styles.grid} />

        {/* Elements */}
        {layout.elements.map((el, index) => (
          <DraggableText
            key={el.id || index}
            element={el}
            index={index}
            layout={layout}
            setLayout={setLayout}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  /* OUTER AREA (like Canva workspace) */
  wrapper: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg,#0f0f18,#1a1a2e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  /* MAIN ARTBOARD */
  canvas: {
    position: "relative",
    width: 900,
    height: 500,
    borderRadius: 18,
    overflow: "hidden",

    background: "#111",
    boxShadow: `
      0 30px 80px rgba(0,0,0,0.6),
      inset 0 0 0 1px rgba(255,255,255,0.05)
    `,

    transform: "scale(1)",
    transition: "all 0.3s ease",
  },

  /* GRID OVERLAY */
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
};