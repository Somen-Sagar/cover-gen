import React, { useState } from "react";
import Draggable from "react-draggable";

export default function DraggableText({
  element,
  index,
  layout,
  setLayout,
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(element.text);
  const [selected, setSelected] = useState(false);

  /* ---------------- UPDATE HELPERS ---------------- */

  const updateElement = (updates) => {
    const newLayout = {
      ...layout,
      elements: layout.elements.map((el, i) =>
        i === index ? { ...el, ...updates } : el
      ),
    };
    setLayout(newLayout);
  };

  /* ---------------- DRAG ---------------- */

  const updatePosition = (e, data) => {
    updateElement({
      x: Math.round(data.x),
      y: Math.round(data.y),
    });
  };

  /* ---------------- TEXT EDIT ---------------- */

  const updateText = () => {
    updateElement({ text });
    setEditing(false);
  };

  /* ---------------- RENDER ---------------- */

  return (
    <Draggable
      position={{ x: element.x, y: element.y }}
      onStop={updatePosition}
    >
      <div
        style={{
          ...styles.wrapper,
          ...(selected && styles.selected),
        }}
        onClick={() => setSelected(true)}
      >
        {/* RESIZE HANDLE (bottom-right basic) */}
        {selected && !editing && (
          <div
            style={styles.resizeHandle}
            onMouseDown={(e) => handleResizeStart(e)}
          />
        )}

        {/* TEXT / INPUT */}
        {editing ? (
          <input
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onBlur={updateText}
            onKeyDown={(e) => e.key === "Enter" && updateText()}
            style={{
              ...styles.text,
              fontSize: element.fontSize,
              color: element.color,
            }}
          />
        ) : (
          <div
            onDoubleClick={() => setEditing(true)}
            style={{
              ...styles.text,
              fontSize: element.fontSize,
              color: element.color,
            }}
          >
            {element.text}
          </div>
        )}
      </div>
    </Draggable>
  );

  /* ---------------- RESIZE ---------------- */

  function handleResizeStart(e) {
    e.stopPropagation();

    const startX = e.clientX;
    const startSize = element.fontSize || 24;

    function onMove(ev) {
      const delta = ev.clientX - startX;

      updateElement({
        fontSize: Math.max(10, startSize + delta / 4),
      });
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
}

/* ---------------- STYLES ---------------- */

const styles = {
  wrapper: {
    position: "absolute",
    cursor: "move",
    transition: "all 0.15s ease",
  },

  selected: {
    outline: "2px solid #7c6af7",
    boxShadow: "0 0 20px rgba(124,106,247,0.4)",
    borderRadius: 8,
  },

  text: {
    fontWeight: 700,
    padding: "6px 10px",
    borderRadius: 8,
    backdropFilter: "blur(6px)",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.1)",
    whiteSpace: "nowrap",
  },

  resizeHandle: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "#7c6af7",
    cursor: "nwse-resize",
    boxShadow: "0 0 10px rgba(124,106,247,0.8)",
  },
};