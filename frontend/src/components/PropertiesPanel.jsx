import React from "react";
import {
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Copy,
  Layers,
} from "lucide-react";

const FONTS = [
  "Playfair Display",
  "Montserrat",
  "Bebas Neue",
  "Raleway",
  "Oswald",
  "Cormorant Garamond",
  "Merriweather",
  "Lato",
  "Georgia",
  "Arial",
  "Times New Roman",
];

export default function PropertiesPanel({
  element,
  onChange,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
}) {
  if (!element) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>✨</div>
        <p>Select an element to edit</p>
      </div>
    );
  }

  const update = (key, val) => onChange({ ...element, [key]: val });

  const updateShadow = (key, val) =>
    onChange({
      ...element,
      shadow: { ...(element.shadow || {}), [key]: val },
    });

  const parseValue = (val) => {
    if (val === "center") return val;
    if (typeof val === "string" && val.includes("%")) return val;
    return Number(val);
  };

  return (
    <div style={styles.panel}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <Type size={16} /> Properties
        </div>

        <div style={styles.headerBtns}>
          <IconBtn onClick={onDuplicate}>
            <Copy size={14} />
          </IconBtn>
          <IconBtn onClick={onDelete} danger>
            <Trash2 size={14} />
          </IconBtn>
        </div>
      </div>

      {/* TEXT */}
      <Section label="TEXT">
        <textarea
          value={element.text}
          onChange={(e) => update("text", e.target.value)}
          style={styles.textarea}
        />
      </Section>

      {/* FONT */}
      <Section label="FONT">
        <select
          value={element.fontFamily}
          onChange={(e) => update("fontFamily", e.target.value)}
          style={styles.select}
        >
          {FONTS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>

        <Row>
          <label>Size</label>
          <input
            type="range"
            min={8}
            max={120}
            value={element.fontSize || 32}
            onChange={(e) => update("fontSize", Number(e.target.value))}
            style={styles.slider}
          />
          <span>{element.fontSize}px</span>
        </Row>
      </Section>

      {/* STYLE */}
      <Section label="STYLE">
        <Row>
          <IconBtn
            active={element.fontWeight === "bold"}
            onClick={() =>
              update(
                "fontWeight",
                element.fontWeight === "bold" ? "normal" : "bold"
              )
            }
          >
            <Bold size={14} />
          </IconBtn>

          <IconBtn
            active={element.fontStyle === "italic"}
            onClick={() =>
              update(
                "fontStyle",
                element.fontStyle === "italic" ? "normal" : "italic"
              )
            }
          >
            <Italic size={14} />
          </IconBtn>
        </Row>

        <Row>
          <IconBtn
            active={element.textAlign === "left"}
            onClick={() => update("textAlign", "left")}
          >
            <AlignLeft size={14} />
          </IconBtn>
          <IconBtn
            active={element.textAlign === "center"}
            onClick={() => update("textAlign", "center")}
          >
            <AlignCenter size={14} />
          </IconBtn>
          <IconBtn
            active={element.textAlign === "right"}
            onClick={() => update("textAlign", "right")}
          >
            <AlignRight size={14} />
          </IconBtn>
        </Row>
      </Section>

      {/* COLOR */}
      <Section label="COLOR">
        <input
          type="color"
          value={element.color || "#ffffff"}
          onChange={(e) => update("color", e.target.value)}
          style={styles.color}
        />
      </Section>

      {/* POSITION */}
      <Section label="POSITION">
        <Row>
          <input
            value={element.x}
            onChange={(e) => update("x", parseValue(e.target.value))}
            placeholder="X"
            style={styles.input}
          />
          <input
            value={element.y}
            onChange={(e) => update("y", parseValue(e.target.value))}
            placeholder="Y"
            style={styles.input}
          />
        </Row>

        <Row>
          <button style={styles.smallBtn} onClick={() => update("x", "center")}>
            Center X
          </button>
          <button style={styles.smallBtn} onClick={() => update("y", "50%")}>
            Middle Y
          </button>
        </Row>
      </Section>

      {/* LAYER */}
      <Section label="LAYER">
        <Row>
          <button style={styles.smallBtn} onClick={onBringForward}>
            ⬆ Forward
          </button>
          <button style={styles.smallBtn} onClick={onSendBackward}>
            ⬇ Back
          </button>
        </Row>
      </Section>

      {/* SHADOW */}
      <Section label="SHADOW">
        <Row>
          <IconBtn
            active={element.shadow?.enabled}
            onClick={() =>
              updateShadow("enabled", !element.shadow?.enabled)
            }
          >
            <Layers size={14} />
          </IconBtn>
        </Row>

        {element.shadow?.enabled && (
          <input
            type="color"
            value={element.shadow?.color || "#000000"}
            onChange={(e) => updateShadow("color", e.target.value)}
            style={styles.color}
          />
        )}
      </Section>
    </div>
  );
}

/* ---------- UI COMPONENTS ---------- */

function Section({ label, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.label}>{label}</div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={styles.row}>{children}</div>;
}

function IconBtn({ active, danger, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.iconBtn,
        background: active
          ? "linear-gradient(135deg,#7c6af7,#9d8cff)"
          : "rgba(255,255,255,0.05)",
        border: danger ? "1px solid #ff4d6d" : "1px solid #2a2a35",
      }}
    >
      {children}
    </button>
  );
}

/* ---------- STYLES ---------- */

const styles = {
  panel: {
    padding: 14,
    color: "#fff",
    backdropFilter: "blur(14px)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
  },

  headerBtns: {
    display: "flex",
    gap: 6,
  },

  section: {
    marginBottom: 18,
  },

  label: {
    fontSize: 10,
    opacity: 0.6,
    marginBottom: 6,
    letterSpacing: "0.1em",
  },

  row: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },

  textarea: {
    width: "100%",
    height: 60,
    background: "#111",
    border: "1px solid #2a2a35",
    color: "#fff",
    padding: 8,
    borderRadius: 6,
  },

  select: {
    width: "100%",
    padding: 6,
    background: "#111",
    border: "1px solid #2a2a35",
    color: "#fff",
    borderRadius: 6,
  },

  input: {
    flex: 1,
    padding: 6,
    background: "#111",
    border: "1px solid #2a2a35",
    color: "#fff",
    borderRadius: 6,
  },

  slider: {
    flex: 1,
  },

  color: {
    width: "100%",
    height: 36,
    border: "none",
    background: "none",
  },

  iconBtn: {
    padding: 6,
    borderRadius: 6,
    cursor: "pointer",
    color: "#fff",
  },

  smallBtn: {
    flex: 1,
    padding: 6,
    background: "#1a1a22",
    border: "1px solid #2a2a35",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer",
  },

  empty: {
    padding: 30,
    textAlign: "center",
    opacity: 0.6,
  },

  emptyIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
};