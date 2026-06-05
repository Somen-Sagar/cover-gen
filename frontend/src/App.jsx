import React, { useRef, useState, useCallback, useEffect } from "react";
import PromptBar from "./components/PromptBar";
import Toolbar from "./components/Toolbar";
import CanvasEditor from "./components/CanvasEditor";
import ElementsList from "./components/ElementsList";
import PropertiesPanel from "./components/PropertiesPanel";
import RefinePanel from "./components/RefinePanel";
import { useHistory } from "./hooks/useHistory";
import { generateLayout, refineLayout } from "./utils/api";

let nextId = 1;

export default function App() {
  const stageRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [bgLoading, setBgLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);

  const { current: layout, push, undo, redo, canUndo, canRedo, reset } =
    useHistory(null);

  /* --------------------------------------------------
     KEYBOARD SHORTCUTS
  -------------------------------------------------- */
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      const isCmd = e.ctrlKey || e.metaKey;

      if (isCmd && e.key === "z") { e.preventDefault(); undo(); return; }
      if (isCmd && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); redo(); return; }

      if (!isTyping && (e.key === "Delete" || e.key === "Backspace") && selectedId && layout) {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Arrow key nudge
      if (!isTyping && selectedId && layout) {
        const step = e.shiftKey ? 10 : 2;
        let dx = 0, dy = 0;
        if (e.key === "ArrowUp") dy = -step;
        if (e.key === "ArrowDown") dy = step;
        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;

        if (dx || dy) {
          e.preventDefault();
          const el = layout.elements.find((e) => e.id === selectedId);
          if (!el) return;
          handleElementChange({ ...el, x: el.x + dx, y: el.y + dy });
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectedId, layout]);

  /* --------------------------------------------------
     GENERATE
  -------------------------------------------------- */
  const handleGenerate = useCallback(async (prompt) => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    try {
      const result = await generateLayout(prompt);
      reset(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  /* --------------------------------------------------
     REFINE
  -------------------------------------------------- */
  const handleRefine = useCallback(async (instruction) => {
    if (!layout) return;
    setRefining(true);
    setError(null);
    try {
      const result = await refineLayout(layout, instruction);
      push(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setRefining(false);
    }
  }, [layout, push]);

  /* --------------------------------------------------
     NEW BACKGROUND IMAGE
  -------------------------------------------------- */
  const handleNewBg = useCallback(async () => {
    if (!layout) return;
    setBgLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/regenerate-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePrompt: layout.background?.imagePrompt || "cinematic abstract professional background",
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        push({
          ...layout,
          background: { ...layout.background, imageUrl: data.imageUrl, seed: data.seed },
        });
      }
    } catch (e) {
      setError("Failed to regenerate background");
    } finally {
      setBgLoading(false);
    }
  }, [layout, push]);

  /* --------------------------------------------------
     ELEMENT CHANGE
  -------------------------------------------------- */
  const handleElementChange = useCallback((updatedEl) => {
    if (!layout) return;
    push({
      ...layout,
      elements: layout.elements.map((el) =>
        el.id === updatedEl.id ? updatedEl : el
      ),
    });
  }, [layout, push]);

  /* --------------------------------------------------
     LAYER ORDER
  -------------------------------------------------- */
  const handleBringForward = useCallback(() => {
    if (!layout || !selectedId) return;
    const idx = layout.elements.findIndex((e) => e.id === selectedId);
    if (idx >= layout.elements.length - 1) return;
    const els = [...layout.elements];
    [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
    push({ ...layout, elements: els });
  }, [layout, selectedId, push]);

  const handleSendBackward = useCallback(() => {
    if (!layout || !selectedId) return;
    const idx = layout.elements.findIndex((e) => e.id === selectedId);
    if (idx <= 0) return;
    const els = [...layout.elements];
    [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
    push({ ...layout, elements: els });
  }, [layout, selectedId, push]);

  /* --------------------------------------------------
     DUPLICATE
  -------------------------------------------------- */
  const handleDuplicate = useCallback(() => {
    if (!layout || !selectedId) return;
    const el = layout.elements.find((e) => e.id === selectedId);
    if (!el) return;
    const copy = { ...el, id: `text-${nextId++}`, x: el.x + 20, y: el.y + 20 };
    push({ ...layout, elements: [...layout.elements, copy] });
    setSelectedId(copy.id);
  }, [layout, selectedId, push]);

  /* --------------------------------------------------
     ADD TEXT
  -------------------------------------------------- */
  const handleAddText = useCallback(() => {
    if (!layout) return;
    const el = {
      id: `text-${nextId++}`,
      type: "text",
      text: "New Text",
      x: 120,
      y: 120,
      fontSize: 42,
      fontFamily: "Montserrat",
      fontWeight: "bold",
      fontStyle: "normal",
      color: "#ffffff",
      width: 500,
      opacity: 1,
      rotation: 0,
      letterSpacing: 0,
      lineHeight: 1.2,
      strokeColor: "#000000",
      strokeWidth: 0,
      shadow: { enabled: false, color: "#000000", blur: 10, offsetX: 4, offsetY: 4 },
    };
    push({ ...layout, elements: [...layout.elements, el] });
    setSelectedId(el.id);
  }, [layout, push]);

  /* --------------------------------------------------
     DELETE
  -------------------------------------------------- */
  const handleDeleteSelected = useCallback(() => {
    if (!layout || !selectedId) return;
    push({ ...layout, elements: layout.elements.filter((el) => el.id !== selectedId) });
    setSelectedId(null);
  }, [layout, selectedId, push]);

  /* --------------------------------------------------
     EXPORT
  -------------------------------------------------- */
  const handleExport = useCallback((type) => {
    if (!layout) return;

    if (type === "json") {
      const blob = new Blob([JSON.stringify(layout, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "cover-layout.json";
      a.click();
      return;
    }

    if (type === "png" && stageRef.current) {
      setSelectedId(null);
      setTimeout(() => {
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = "cover-page.png";
        a.click();
      }, 100);
    }
  }, [layout]);

  const selectedElement = layout?.elements?.find((el) => el.id === selectedId) ?? null;

  return (
    <div style={styles.root}>
      {/* TOPBAR */}
      <header style={styles.topbar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>✦</span>
          <span style={styles.logoText}>CoverGen</span>
          <span style={styles.badge}>Groq + Pollinations</span>
        </div>
        {error && (
          <div style={styles.error} onClick={() => setError(null)}>
            ⚠ {error} <span style={{ opacity: 0.5 }}>✕</span>
          </div>
        )}
      </header>

      <PromptBar onGenerate={handleGenerate} loading={loading} />

      <Toolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={handleExport}
        onAddText={handleAddText}
        onNewBg={handleNewBg}
        hasLayout={!!layout}
        bgLoading={bgLoading}
      />

      <div style={styles.main}>
        {/* LEFT */}
        <aside style={styles.sidebarLeft}>
          <ElementsList
            elements={layout?.elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>

        {/* CENTER */}
        <div style={styles.center}>
          <CanvasEditor
            layout={layout}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onElementChange={handleElementChange}
            stageRef={stageRef}
          />
          <RefinePanel
            onRefine={handleRefine}
            loading={refining}
            hasLayout={!!layout}
          />
        </div>

        {/* RIGHT */}
        <aside style={styles.sidebarRight}>
          <PropertiesPanel
            element={selectedElement}
            onChange={handleElementChange}
            onDelete={handleDeleteSelected}
            onDuplicate={handleDuplicate}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
          />
        </aside>
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div style={styles.overlay}>
          <div style={styles.loaderCard}>
            <div className="spinner" />
            <h2 style={{ margin: "12px 0 4px" }}>Designing…</h2>
            <p style={{ color: "#888", margin: 0, fontSize: 13 }}>AI is crafting your layout</p>
            <p style={{ color: "#555", margin: "4px 0 0", fontSize: 12 }}>Background image will load after</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------
   STYLES
-------------------------------------------------- */
const styles = {
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(circle at top, #12121a, #0c0c0f)",
    color: "#fff",
    overflow: "hidden",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(20,20,30,0.6)",
    backdropFilter: "blur(10px)",
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { color: "#7c6af7", fontSize: 20 },
  logoText: { fontWeight: 700, fontSize: 16 },
  badge: {
    fontSize: 10,
    background: "rgba(124,106,247,0.15)",
    border: "1px solid rgba(124,106,247,0.3)",
    color: "#9080e0",
    padding: "2px 8px",
    borderRadius: 20,
    fontWeight: 600,
  },
  error: {
    color: "#ff6b81",
    fontSize: 12,
    cursor: "pointer",
    background: "rgba(255,107,129,0.1)",
    border: "1px solid rgba(255,107,129,0.25)",
    padding: "4px 12px",
    borderRadius: 8,
    display: "flex",
    gap: 8,
  },
  main: { display: "flex", flex: 1, overflow: "hidden" },
  sidebarLeft: {
    width: 220,
    background: "rgba(20,20,30,0.6)",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    overflowY: "auto",
  },
  sidebarRight: {
    width: 260,
    background: "rgba(20,20,30,0.6)",
    borderLeft: "1px solid rgba(255,255,255,0.05)",
    overflowY: "auto",
  },
  center: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  loaderCard: {
    background: "#1e1e2a",
    padding: 40,
    borderRadius: 20,
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.08)",
  },
};
