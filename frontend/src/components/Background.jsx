import React from "react";
import Background from "./Background";
import DraggableText from "./DraggableText";

export default function Canvas({ layout, setLayout }) {
  if (!layout) return null;

  return (
    <div style={styles.canvas}>
      <Background layout={layout} />

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
  );
}

const styles = {
  canvas: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
    background: "#111",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
};