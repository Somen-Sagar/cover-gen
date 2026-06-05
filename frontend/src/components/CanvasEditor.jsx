import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Stage, Layer, Text, Transformer,
  Image as KImage, Line, Rect,
} from "react-konva";

const CANVAS_W = 800;
const CANVAS_H = 600;
const SNAP_THRESHOLD = 6;

/* --------------------------------------------------
   RESOLVE POSITION
-------------------------------------------------- */
function resolvePosition(val, size, canvasSize) {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    if (val === "center") return canvasSize / 2 - size / 2;
    if (val.endsWith("%")) return (parseFloat(val) / 100) * canvasSize;
  }
  return 0;
}

/* --------------------------------------------------
   LOAD IMAGE
   - NO crossOrigin (Pollinations blocks it)
   - Retries with increasing delays
   - First attempt after 3s (Pollinations needs time to generate)
-------------------------------------------------- */
function loadImage(src, attempt = 1) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    // DO NOT set crossOrigin — Pollinations rejects it
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Load failed attempt ${attempt}`));
    img.src = src + (attempt > 1 ? `&_retry=${attempt}_${Date.now()}` : "");
  });
}

async function loadImageWithRetry(src) {
  const delays = [3000, 5000, 7000, 10000]; // wait before each attempt
  for (let i = 0; i < delays.length; i++) {
    await new Promise((r) => setTimeout(r, delays[i]));
    try {
      const img = await loadImage(src, i + 1);
      return img;
    } catch (e) {
      console.log(`BG image attempt ${i + 1} failed, ${i < delays.length - 1 ? "retrying…" : "giving up"}`);
    }
  }
  throw new Error("All attempts failed");
}

/* --------------------------------------------------
   PARSE GRADIENT COLORS → Konva color stops
-------------------------------------------------- */
function parseGradientColors(gradient) {
  const matches = gradient?.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) || [];
  if (matches.length >= 2) return [0, matches[0], 1, matches[matches.length - 1]];
  return [0, "#141e30", 1, "#243b55"];
}

export default function CanvasEditor({
  layout,
  selectedId,
  onSelect,
  onElementChange,
  stageRef,
}) {
  const transformerRef = useRef(null);
  const [bgImage, setBgImage] = useState(null);
  const [bgStatus, setBgStatus] = useState("idle");
  const [guides, setGuides] = useState([]);
  const [hoverId, setHoverId] = useState(null);

  /* --------------------------------------------------
     LOAD BACKGROUND
  -------------------------------------------------- */
  useEffect(() => {
    if (!layout?.background?.imageUrl) return;

    setBgImage(null);
    setBgStatus("loading");

    let cancelled = false;

    loadImageWithRetry(layout.background.imageUrl)
      .then((img) => {
        if (!cancelled) {
          setBgImage(img);
          setBgStatus("loaded");
        }
      })
      .catch(() => {
        if (!cancelled) setBgStatus("error");
      });

    return () => { cancelled = true; };
  }, [layout?.background?.imageUrl]);

  /* --------------------------------------------------
     SYNC TRANSFORMER
  -------------------------------------------------- */
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const node = stageRef.current.findOne(`#el-${selectedId}`);
    transformerRef.current.nodes(node ? [node] : []);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, layout, stageRef]);

  /* --------------------------------------------------
     SNAP GUIDES
  -------------------------------------------------- */
  const getSnapLines = (x, y, width, height) => {
    const lines = [];
    const cx = x + width / 2;
    const cy = y + height / 2;
    if (Math.abs(cx - CANVAS_W / 2) < SNAP_THRESHOLD) {
      lines.push({ type: "v", x: CANVAS_W / 2 });
      x = CANVAS_W / 2 - width / 2;
    }
    if (Math.abs(cy - CANVAS_H / 2) < SNAP_THRESHOLD) {
      lines.push({ type: "h", y: CANVAS_H / 2 });
      y = CANVAS_H / 2 - height / 2;
    }
    return { x, y, lines };
  };

  const handleDragMove = (el, e) => {
    const node = e.target;
    const width = el.width || 300;
    const height = el.fontSize || 40;
    let { x, y } = node.position();
    const snap = getSnapLines(x, y, width, height);
    node.position({ x: snap.x, y: snap.y });
    setGuides(snap.lines);
  };

  const handleDragEnd = useCallback((el, e) => {
    setGuides([]);
    onElementChange({ ...el, x: Math.round(e.target.x()), y: Math.round(e.target.y()) });
  }, [onElementChange]);

  const handleTransformEnd = useCallback((el, node) => {
    const sx = node.scaleX();
    const sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onElementChange({
      ...el,
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      fontSize: Math.max(8, Math.round((el.fontSize || 20) * sy)),
      width: Math.max(50, Math.round((el.width || 300) * sx)),
      rotation: Math.round(node.rotation()),
    });
  }, [onElementChange]);

  /* --------------------------------------------------
     EMPTY STATE
  -------------------------------------------------- */
  if (!layout) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>✦</div>
        <div style={styles.emptyTitle}>Generate something first</div>
        <div style={styles.emptySub}>Enter a prompt above and click Generate</div>
      </div>
    );
  }

  const gradientStops = parseGradientColors(layout.background?.gradient);

  return (
    <div style={styles.wrapper}>
      {/* Status badge */}
      {bgStatus === "loading" && (
        <div style={styles.badge}>
          <span style={styles.dot} />
          Generating background image… (this takes 10–20s)
        </div>
      )}
      {bgStatus === "loaded" && (
        <div style={{ ...styles.badge, ...styles.badgeSuccess }}>
          ✓ Background loaded
        </div>
      )}

      <div style={styles.canvasContainer}>
        <Stage
          ref={stageRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) onSelect(null);
          }}
        >
          {/* ── BACKGROUND LAYER ── */}
          <Layer>
            {/* Gradient always visible as fallback */}
            <Rect
              width={CANVAS_W}
              height={CANVAS_H}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: CANVAS_W, y: CANVAS_H }}
              fillLinearGradientColorStops={gradientStops}
              listening={false}
            />
            {/* Real photo once loaded */}
            {bgImage && (
              <KImage image={bgImage} width={CANVAS_W} height={CANVAS_H} listening={false} />
            )}
            {/* Overlay for readability */}
            {bgImage && (
              <Rect width={CANVAS_W} height={CANVAS_H} fill="rgba(0,0,0,0.32)" listening={false} />
            )}
          </Layer>

          {/* ── TEXT ELEMENTS LAYER ── */}
          <Layer>
            {layout.elements?.map((el) => {
              const width = el.width || 400;
              const x = resolvePosition(el.x, width, CANVAS_W);
              const y = resolvePosition(el.y, el.fontSize || 40, CANVAS_H);
              const isSelected = selectedId === el.id;

              const shadowProps = el.shadow?.enabled ? {
                shadowColor: el.shadow.color || "#000",
                shadowBlur: el.shadow.blur || 10,
                shadowOffsetX: el.shadow.offsetX || 0,
                shadowOffsetY: el.shadow.offsetY || 4,
                shadowOpacity: 0.85,
              } : {};

              return (
                <Text
                  key={el.id}
                  id={`el-${el.id}`}
                  text={el.text}
                  x={x} y={y}
                  width={width}
                  fontSize={el.fontSize || 32}
                  fontFamily={el.fontFamily || "Montserrat"}
                  fontStyle={[
                    el.fontWeight === "bold" ? "bold" : "",
                    el.fontStyle === "italic" ? "italic" : "",
                  ].filter(Boolean).join(" ") || "normal"}
                  fill={el.color || "#ffffff"}
                  align={el.textAlign || "left"}
                  opacity={el.opacity ?? 1}
                  rotation={el.rotation || 0}
                  letterSpacing={el.letterSpacing || 0}
                  lineHeight={el.lineHeight || 1.2}
                  stroke={el.strokeWidth > 0 ? (el.strokeColor || "#000") : undefined}
                  strokeWidth={el.strokeWidth || 0}
                  {...shadowProps}
                  shadowColor={isSelected ? "#7c6af7" : (el.shadow?.enabled ? el.shadow.color : undefined)}
                  shadowBlur={isSelected ? 24 : (el.shadow?.enabled ? el.shadow.blur : 0)}
                  draggable={!el.locked}
                  onMouseEnter={() => setHoverId(el.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => onSelect(el.id)}
                  onTap={() => onSelect(el.id)}
                  onDragMove={(e) => handleDragMove(el, e)}
                  onDragEnd={(e) => handleDragEnd(el, e)}
                  onTransformEnd={(e) => handleTransformEnd(el, e.target)}
                />
              );
            })}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              anchorSize={10}
              borderStroke="#7c6af7"
              anchorFill="#7c6af7"
              anchorCornerRadius={6}
              borderDash={[4, 2]}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
              }
            />
          </Layer>

          {/* ── SNAP GUIDES LAYER ── */}
          <Layer>
            {guides.map((g, i) =>
              g.type === "v"
                ? <Line key={i} points={[g.x, 0, g.x, CANVAS_H]} stroke="#7c6af7" strokeWidth={1} dash={[6, 4]} />
                : <Line key={i} points={[0, g.y, CANVAS_W, g.y]} stroke="#7c6af7" strokeWidth={1} dash={[6, 4]} />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: "16px 0",
    overflow: "auto",
  },
  canvasContainer: {
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
  },
  badge: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(124,106,247,0.12)",
    border: "1px solid rgba(124,106,247,0.25)",
    color: "#a090f0", fontSize: 12,
    padding: "6px 16px", borderRadius: 20,
  },
  badgeSuccess: {
    background: "rgba(76,175,100,0.12)",
    border: "1px solid rgba(76,175,100,0.25)",
    color: "#4caf64",
  },
  dot: {
    display: "inline-block",
    width: 8, height: 8,
    borderRadius: "50%",
    background: "#a090f0",
    animation: "pulse 1.2s ease-in-out infinite",
  },
  empty: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    color: "#444460", gap: 10,
  },
  emptyIcon: { fontSize: 40, color: "#3a3a55" },
  emptyTitle: { fontSize: 18, fontWeight: 600 },
  emptySub: { fontSize: 13 },
};
