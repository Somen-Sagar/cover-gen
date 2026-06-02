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

  const {
    current: layout,
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  } = useHistory(null);

  /* ---------------- KEYBOARD ---------------- */
  useEffect(() => {
    const handler = (e) => {
      const isCmd = e.ctrlKey || e.metaKey;

      // UNDO / REDO
      if (isCmd && e.key === "z") {
        e.preventDefault();
        undo();
      }

      if (isCmd && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        redo();
      }

      // DELETE ELEMENT
      if (e.key === "Delete" && selectedId && layout) {
        e.preventDefault();
        handleDeleteSelected();
      }

      // ARROW MOVE (🔥 pro feature)
      if (selectedId && layout) {
        const step = e.shiftKey ? 10 : 2;

        let dx = 0;
        let dy = 0;

        if (e.key === "ArrowUp") dy = -step;
        if (e.key === "ArrowDown") dy = step;
        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;

        if (dx || dy) {
          e.preventDefault();

          const el = layout.elements.find((e) => e.id === selectedId);
          if (!el) return;

          handleElementChange({
            ...el,
            x: el.x + dx,
            y: el.y + dy,
          });
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectedId, layout]);

  /* ---------------- GENERATE ---------------- */
  const handleGenerate = useCallback(
    async (prompt) => {
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
    },
    [reset]
  );

  /* ---------------- REFINE ---------------- */
  const handleRefine = useCallback(
    async (instruction) => {
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
    },
    [layout, push]
  );

  /* ---------------- ELEMENT CHANGE ---------------- */
  const handleElementChange = useCallback(
    (updatedEl) => {
      if (!layout) return;

      push({
        ...layout,
        elements: layout.elements.map((el) =>
          el.id === updatedEl.id ? updatedEl : el
        ),
      });
    },
    [layout, push]
  );

  

  /* ---------------- ADD TEXT ---------------- */
  const handleAddText = useCallback(() => {
    if (!layout) return;

    const el = {
      id: `text-${nextId++}`,
      text: "New Text",
      x: 120,
      y: 120,
      fontSize: 42,
      fontFamily: "Montserrat",
      color: "#ffffff",
      width: 500,
    };

    push({ ...layout, elements: [...layout.elements, el] });
    setSelectedId(el.id);
  }, [layout, push]);

  /* ---------------- DELETE ---------------- */
  const handleDeleteSelected = useCallback(() => {
    if (!layout || !selectedId) return;

    push({
      ...layout,
      elements: layout.elements.filter((el) => el.id !== selectedId),
    });

    setSelectedId(null);
  }, [layout, selectedId, push]);

  /* ---------------- EXPORT ---------------- */
  const handleExport = useCallback(
    (type) => {
      if (!layout) return;

      if (type === "png" && stageRef.current) {
        setSelectedId(null);

        setTimeout(() => {
          const dataURL = stageRef.current.toDataURL({
            pixelRatio: 2,
          });

          const a = document.createElement("a");
          a.href = dataURL;
          a.download = "design.png";
          a.click();
        }, 80);
      }
    },
    [layout]
  );

  const selectedElement =
    layout?.elements?.find((el) => el.id === selectedId) ?? null;

  return (
    <div style={styles.root}>
      {/* TOPBAR */}
      <header style={styles.topbar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>✦</span>
          <span style={styles.logoText}>CoverGen</span>
        </div>

        {error && <div style={styles.error}>⚠ {error}</div>}
      </header>

      <PromptBar onGenerate={handleGenerate} loading={loading} />

      <Toolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={handleExport}
        onAddText={handleAddText}
        onNewBg={() => {}}
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
          />
        </aside>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={styles.overlay}>
          <div style={styles.loaderCard}>
            <div className="spinner" />
            <h2>Designing...</h2>
            <p>AI is crafting your layout</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(circle at top, #12121a, #0c0c0f)",
    color: "#fff",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "14px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(20,20,30,0.6)",
    backdropFilter: "blur(10px)",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  logoIcon: {
    color: "#7c6af7",
    fontSize: 20,
  },

  logoText: {
    fontWeight: 700,
    fontSize: 16,
  },

  error: {
    color: "#ff6b81",
    fontSize: 12,
  },

  main: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },

  sidebarLeft: {
    width: 220,
    background: "rgba(20,20,30,0.6)",
    borderRight: "1px solid rgba(255,255,255,0.05)",
  },

  sidebarRight: {
    width: 260,
    background: "rgba(20,20,30,0.6)",
    borderLeft: "1px solid rgba(255,255,255,0.05)",
  },

  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  loaderCard: {
    background: "#1e1e2a",
    padding: 40,
    borderRadius: 20,
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.08)",
  },
};