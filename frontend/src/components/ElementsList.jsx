import React from "react";

export default function ElementsList({ elements, selectedId, onSelect }) {
  if (!elements || elements.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>✦</div>
        <p>No elements yet</p>
        <span>Generate a layout to begin</span>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>LAYERS</div>

      {[...elements].reverse().map((el, index) => {
        const isActive = selectedId === el.id;

        return (
          <div
            key={el.id}
            style={{
              ...styles.item,
              ...(isActive ? styles.activeItem : {}),
            }}
            onClick={() => onSelect(el.id)}
          >
            {/* ICON */}
            <div style={styles.iconWrap}>
              <span style={styles.icon}>T</span>
            </div>

            {/* META */}
            <div style={styles.meta}>
              <div style={styles.topRow}>
                <span style={styles.elId}>{el.id}</span>
                <span style={styles.index}>{elements.length - index}</span>
              </div>

              <div style={styles.elText}>
                {el.text?.slice(0, 28)}
                {el.text?.length > 28 ? "…" : ""}
              </div>
            </div>

            {/* ACTIVE GLOW */}
            {isActive && <div style={styles.glow} />}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- STYLES ---------- */
const styles = {
  panel: {
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    gap: 6,
    height: "100%",
    overflowY: "auto",
    background: "linear-gradient(180deg, #0f0f14, #0c0c10)",
  },

  header: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "#6e6e8a",
    padding: "6px 10px",
    textTransform: "uppercase",
  },

  item: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px",
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid transparent",
  },

  activeItem: {
    background: "rgba(124,106,247,0.12)",
    border: "1px solid rgba(124,106,247,0.35)",
    boxShadow: "0 0 12px rgba(124,106,247,0.25)",
  },

  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "linear-gradient(135deg, #2a2a35, #1a1a22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  icon: {
    fontSize: 12,
    fontWeight: 700,
    color: "#7c6af7",
  },

  meta: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  elId: {
    fontSize: 11,
    fontWeight: 600,
    color: "#e4e4f0",
    fontFamily: "monospace",
  },

  index: {
    fontSize: 10,
    color: "#6a6a85",
  },

  elText: {
    fontSize: 12,
    color: "#9a9ab0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  glow: {
    position: "absolute",
    inset: 0,
    borderRadius: 10,
    boxShadow: "0 0 20px rgba(124,106,247,0.25)",
    pointerEvents: "none",
  },

  empty: {
    padding: 30,
    textAlign: "center",
    color: "#6e6e8a",
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    fontSize: 22,
    color: "#7c6af7",
    opacity: 0.7,
  },
};