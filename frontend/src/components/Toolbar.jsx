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
    <div style={styles.wrapper}>
      <div style={styles.toolbar}>
        {/* LEFT */}
        <div style={styles.section}>
          <IconBtn
            icon="↶"
            onClick={onUndo}
            disabled={!canUndo}
          />

          <IconBtn
            icon="↷"
            onClick={onRedo}
            disabled={!canRedo}
          />
        </div>

        {/* CENTER */}
        <div style={styles.section}>
          <ActionBtn
            icon="T"
            text="Text"
            onClick={onAddText}
            disabled={!hasLayout}
          />

          <ActionBtn
            icon="✨"
            text={
              bgLoading
                ? "Generating..."
                : "New Background"
            }
            onClick={onNewBg}
            disabled={!hasLayout || bgLoading}
            primary
          />
        </div>

        {/* RIGHT */}
        <div style={styles.section}>
          <ActionBtn
            icon="⬇"
            text="PNG"
            onClick={() => onExport("png")}
            disabled={!hasLayout}
          />

          <ActionBtn
            icon="{}"
            text="JSON"
            onClick={() => onExport("json")}
            disabled={!hasLayout}
          />
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  icon,
  onClick,
  disabled,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.iconBtn,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {icon}
    </button>
  );
}

function ActionBtn({
  icon,
  text,
  onClick,
  disabled,
  primary,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.actionBtn,
        ...(primary
          ? styles.primaryBtn
          : {}),
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </button>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    padding: "14px",
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 16,

    padding: "10px 14px",

    borderRadius: 999,

    background:
      "rgba(20,20,30,0.75)",

    backdropFilter: "blur(20px)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    boxShadow:
      "0 20px 60px rgba(0,0,0,0.45)",
  },

  section: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  iconBtn: {
    width: 42,
    height: 42,

    borderRadius: 14,

    border:
      "1px solid rgba(255,255,255,0.08)",

    background:
      "rgba(255,255,255,0.04)",

    color: "white",

    fontSize: 18,
    cursor: "pointer",

    transition: "0.25s",
  },

  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,

    padding: "0 18px",

    height: 42,

    borderRadius: 14,

    border:
      "1px solid rgba(255,255,255,0.08)",

    background:
      "rgba(255,255,255,0.04)",

    color: "#fff",

    fontWeight: 600,

    cursor: "pointer",

    transition: "0.25s",
  },

  primaryBtn: {
    background:
      "linear-gradient(135deg,#7c6af7,#b16eff)",

    border: "none",

    boxShadow:
      "0 10px 35px rgba(124,106,247,.45)",
  },
};