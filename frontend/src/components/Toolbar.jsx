import React from "react";

export default function Toolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onAddText,
  onNewBg,
  hasLayout,
  bgLoading,
}) {
  return (
    <div style={styles.bar}>
      {/* LEFT ACTIONS */}
      <div style={styles.group}>
        <TBtn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          ↩
        </TBtn>
        <TBtn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          ↪
        </TBtn>
      </div>

      <Divider />

      {/* CENTER ACTIONS */}
      <div style={styles.group}>
        <TBtn onClick={onAddText} disabled={!hasLayout} title="Add text">
          ✍️ Text
        </TBtn>

        <TBtn
          onClick={onNewBg}
          disabled={!hasLayout || bgLoading}
          glow
          title="Generate new background"
        >
          {bgLoading ? (
            <div style={styles.loadingWrap}>
              <span style={styles.spinner} />
              Generating...
            </div>
          ) : (
            "🎨 New BG"
          )}
        </TBtn>
      </div>

      <Divider />

      {/* RIGHT ACTIONS */}
      <div style={styles.group}>
        <TBtn
          onClick={() => onExport("png")}
          disabled={!hasLayout}
          accent
          title="Export PNG"
        >
          ⬇ PNG
        </TBtn>

        <TBtn
          onClick={() => onExport("json")}
          disabled={!hasLayout}
          title="Export JSON"
        >
          ⬇ JSON
        </TBtn>
      </div>
    </div>
  );
}

/* ---------------- BUTTON ---------------- */

function TBtn({ children, onClick, disabled, title, accent, glow }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...styles.btn,
        ...(accent && styles.accentBtn),
        ...(glow && styles.glowBtn),
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      className="toolbar-btn"
    >
      {children}
    </button>
  );
}

/* ---------------- DIVIDER ---------------- */

function Divider() {
  return <div style={styles.divider} />;
}

/* ---------------- STYLES ---------------- */

const styles = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    background: "rgba(18,18,28,0.75)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  group: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  divider: {
    width: 1,
    height: 24,
    background: "rgba(255,255,255,0.08)",
    margin: "0 10px",
  },

  btn: {
    padding: "8px 16px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "Inter, sans-serif",
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#e6e6ff",
    transition: "all 0.25s ease",
  },

  accentBtn: {
    background: "linear-gradient(135deg,#7c5cff,#ff6fa5)",
    border: "none",
    color: "#fff",
    boxShadow: "0 6px 20px rgba(124,92,255,0.4)",
  },

  glowBtn: {
    boxShadow: "0 0 18px rgba(124,92,255,0.35)",
  },

  loadingWrap: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  spinner: {
    width: 14,
    height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

/* ---------------- GLOBAL CSS ---------------- */

/* Add this in your global CSS file */
// const styleSheet = document.styleSheets[0];
// const keyframes = `
// @keyframes spin {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }

// .toolbar-btn:hover {
//   transform: translateY(-2px) scale(1.02);
//   box-shadow: 0 10px 25px rgba(0,0,0,0.5);
// }

// .toolbar-btn:active {
//   transform: scale(0.96);
// }
// `;

// if (styleSheet) {
//   styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
// }