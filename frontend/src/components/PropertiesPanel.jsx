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

      <Section label="QUICK ACTIONS">
  <Row>
    <IconBtn onClick={onDuplicate}>
      <Copy size={14}/>
    </IconBtn>

    <IconBtn onClick={onBringForward}>
      ↑
    </IconBtn>

    <IconBtn onClick={onSendBackward}>
      ↓
    </IconBtn>

    <IconBtn danger onClick={onDelete}>
      <Trash2 size={14}/>
    </IconBtn>
  </Row>
</Section>
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

      <Section label="TEXT EFFECTS">

  <Row>
    <label>Opacity</label>

    <input
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={element.opacity ?? 1}
      onChange={(e) =>
        update("opacity", Number(e.target.value))
      }
    />
  </Row>

  <Row>
    <label>Letter</label>

    <input
      type="range"
      min="-5"
      max="20"
      value={element.letterSpacing || 0}
      onChange={(e) =>
        update("letterSpacing", Number(e.target.value))
      }
    />
  </Row>

  <Row>
    <label>Line</label>

    <input
      type="range"
      min="0.8"
      max="3"
      step="0.1"
      value={element.lineHeight || 1.2}
      onChange={(e) =>
        update("lineHeight", Number(e.target.value))
      }
    />
  </Row>

</Section>

<Section label="OUTLINE">

  <label>Stroke Color</label>

  <input
    type="color"
    value={element.strokeColor || "#000000"}
    onChange={(e) =>
      update("strokeColor", e.target.value)
    }
    style={styles.color}
  />

  <label>Stroke Width</label>

  <input
    type="range"
    min="0"
    max="10"
    value={element.strokeWidth || 0}
    onChange={(e) =>
      update("strokeWidth", Number(e.target.value))
    }
  />

</Section>

<Section label="ROTATION">

  <input
    type="range"
    min="-180"
    max="180"
    value={element.rotation || 0}
    onChange={(e) =>
      update("rotation", Number(e.target.value))
    }
  />

  <div>{element.rotation || 0}°</div>

</Section>

<Row>
  <label>Width</label>

  <input
    type="range"
    min="100"
    max="700"
    value={element.width || 400}
    onChange={(e) =>
      update("width", Number(e.target.value))
    }
  />
</Row>
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
    <label>Enable</label>

    <input
      type="checkbox"
      checked={element.shadow?.enabled || false}
      onChange={(e) =>
        updateShadow("enabled", e.target.checked)
      }
    />
  </Row>

  {element.shadow?.enabled && (
    <>
      <label>Color</label>

      <input
        type="color"
        value={element.shadow?.color || "#000000"}
        onChange={(e) =>
          updateShadow("color", e.target.value)
        }
        style={styles.color}
      />

      <label>Blur</label>

      <input
        type="range"
        min="0"
        max="50"
        value={element.shadow?.blur || 10}
        onChange={(e) =>
          updateShadow("blur", Number(e.target.value))
        }
      />

      <label>Offset X</label>

      <input
        type="range"
        min="-50"
        max="50"
        value={element.shadow?.offsetX || 0}
        onChange={(e) =>
          updateShadow("offsetX", Number(e.target.value))
        }
      />

      <label>Offset Y</label>

      <input
        type="range"
        min="-50"
        max="50"
        value={element.shadow?.offsetY || 0}
        onChange={(e) =>
          updateShadow("offsetY", Number(e.target.value))
        }
      />
    </>
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
          ? "linear-gradient(135deg,#7c6af7,#b16eff)"
          : "rgba(255,255,255,.04)",

        border: danger
          ? "1px solid rgba(255,90,120,.5)"
          : "1px solid rgba(255,255,255,.08)",

        boxShadow: active
          ? "0 12px 30px rgba(124,106,247,.4)"
          : "none",
      }}
    >
      {children}
    </button>
  );
}

/* ---------- STYLES ---------- */

const styles = {
  panel: {
    height: "100%",
    overflowY: "auto",
    padding: 20,

    background: `
      radial-gradient(
        circle at top,
        rgba(124,106,247,.18),
        transparent 40%
      ),
      linear-gradient(
        180deg,
        #141420 0%,
        #0d0d14 100%
      )
    `,

    color: "#fff",

    borderLeft:
      "1px solid rgba(255,255,255,.05)",

    backdropFilter: "blur(40px)",

    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,.04),
      inset 0 0 80px rgba(124,106,247,.06)
    `,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 20,

    paddingBottom: 14,

    borderBottom:
      "1px solid rgba(255,255,255,.06)",
  },

  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,

    fontSize: 16,
    fontWeight: 700,

    color: "#fff",
  },

  headerBtns: {
    display: "flex",
    gap: 8,
  },

  section: {
    marginBottom: 16,

    padding: 14,

    borderRadius: 18,

    background:
      "rgba(255,255,255,.03)",

    border:
      "1px solid rgba(255,255,255,.06)",

    backdropFilter: "blur(20px)",

    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,.04),
      0 10px 30px rgba(0,0,0,.25)
    `,
  },

  label: {
    fontSize: 10,
    fontWeight: 700,

    letterSpacing: ".18em",

    color: "#8c8ca5",

    marginBottom: 12,
  },

  row: {
    display: "flex",
    alignItems: "center",

    gap: 10,

    marginTop: 10,
  },

  textarea: {
    width: "100%",
    minHeight: 110,

    resize: "vertical",

    padding: 14,

    color: "#fff",

    borderRadius: 14,

    background:
      "rgba(255,255,255,.03)",

    border:
      "1px solid rgba(255,255,255,.08)",

    outline: "none",

    fontSize: 14,

    lineHeight: 1.6,
  },

  select: {
    width: "100%",
    height: 42,

    padding: "0 12px",

    borderRadius: 12,

    color: "#fff",

    background:
      "rgba(255,255,255,.03)",

    border:
      "1px solid rgba(255,255,255,.08)",

    outline: "none",
  },

  input: {
    flex: 1,

    height: 40,

    padding: "0 12px",

    borderRadius: 12,

    color: "#fff",

    background:
      "rgba(255,255,255,.03)",

    border:
      "1px solid rgba(255,255,255,.08)",

    outline: "none",
  },

  slider: {
    flex: 1,

    accentColor: "#8b5cf6",

    cursor: "pointer",
  },

  color: {
    width: "100%",
    height: 44,

    border: "none",

    borderRadius: 12,

    overflow: "hidden",

    background: "transparent",

    cursor: "pointer",
  },

  iconBtn: {
    width: 42,
    height: 42,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    borderRadius: 14,

    background:
      "rgba(255,255,255,.04)",

    border:
      "1px solid rgba(255,255,255,.08)",

    color: "#fff",

    cursor: "pointer",

    transition: "all .25s ease",

    backdropFilter: "blur(10px)",

    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,.05)
    `,
  },

  smallBtn: {
    flex: 1,

    height: 40,

    borderRadius: 12,

    border:
      "1px solid rgba(255,255,255,.08)",

    background:
      "rgba(255,255,255,.04)",

    color: "#fff",

    fontWeight: 600,

    cursor: "pointer",

    transition: ".25s",
  },

  empty: {
    height: "100%",

    display: "flex",
    flexDirection: "column",

    justifyContent: "center",
    alignItems: "center",

    gap: 12,

    color: "#9ca3af",
  },

  emptyIcon: {
    width: 70,
    height: 70,

    borderRadius: 20,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: 30,

    background:
      "linear-gradient(135deg,#7c6af7,#b16eff)",

    boxShadow:
      "0 15px 40px rgba(124,106,247,.45)",
  },
};