import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Text,
  Transformer,
  Image as KImage,
  Rect,
  Line,
} from "react-konva";

const CANVAS_W = 800;
const CANVAS_H = 600;
const SNAP_THRESHOLD = 6;

/* ---------------- POSITION ---------------- */
function resolvePosition(val, size, canvasSize) {
  if (typeof val === "number") return val;

  if (typeof val === "string") {
    if (val === "center") return canvasSize / 2 - size / 2;
    if (val.endsWith("%")) return (parseFloat(val) / 100) * canvasSize;
  }

  return 0;
}

/* ---------------- IMAGE ---------------- */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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
  const [guides, setGuides] = useState([]);
  const [hoverId, setHoverId] = useState(null);

  /* ---------------- LOAD BG ---------------- */
  useEffect(() => {
    if (!layout?.background?.imageUrl) return;

    loadImage(layout.background.imageUrl)
      .then(setBgImage)
      .catch(() => setBgImage(null));
  }, [layout?.background?.imageUrl]);

  /* ---------------- TRANSFORMER ---------------- */
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const node = stageRef.current.findOne(`#el-${selectedId}`);
    transformerRef.current.nodes(node ? [node] : []);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, layout, stageRef]);

  /* ---------------- SNAP ---------------- */
  const getSnapLines = (x, y, width, height) => {
    const lines = [];

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    if (Math.abs(centerX - CANVAS_W / 2) < SNAP_THRESHOLD) {
      lines.push({ type: "v", x: CANVAS_W / 2 });
      x = CANVAS_W / 2 - width / 2;
    }

    if (Math.abs(centerY - CANVAS_H / 2) < SNAP_THRESHOLD) {
      lines.push({ type: "h", y: CANVAS_H / 2 });
      y = CANVAS_H / 2 - height / 2;
    }

    return { x, y, lines };
  };

  /* ---------------- HANDLERS ---------------- */
  const handleDragMove = (el, e) => {
    const node = e.target;

    const width = el.width || 300;
    const height = el.fontSize || 40;

    let { x, y } = node.position();

    const snap = getSnapLines(x, y, width, height);

    node.position({ x: snap.x, y: snap.y });
    setGuides(snap.lines);
  };

  const handleDragEnd = useCallback(
    (el, e) => {
      setGuides([]);

      onElementChange({
        ...el,
        x: Math.round(e.target.x()),
        y: Math.round(e.target.y()),
      });
    },
    [onElementChange]
  );

  const handleTransformEnd = useCallback(
    (el, node) => {
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
    },
    [onElementChange]
  );

  /* ---------------- EMPTY ---------------- */
  if (!layout) {
    return <div style={styles.empty}>✨ Generate something first</div>;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.canvasContainer}>
        <Stage
          ref={stageRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={styles.stage}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) onSelect(null);
          }}
        >
          {/* BACKGROUND */}
          <Layer>
            {bgImage && (
              <KImage image={bgImage} width={CANVAS_W} height={CANVAS_H} />
            )}

            {/* cinematic overlay */}
            <Rect
              width={CANVAS_W}
              height={CANVAS_H}
              fill="rgba(0,0,0,0.35)"
            />
          </Layer>

          {/* GRID (subtle) */}
          <Layer opacity={0.15}>
            {[...Array(20)].map((_, i) => (
              <Line
                key={i}
                points={[i * 40, 0, i * 40, CANVAS_H]}
                stroke="#ffffff"
              />
            ))}
            {[...Array(15)].map((_, i) => (
              <Line
                key={i}
                points={[0, i * 40, CANVAS_W, i * 40]}
                stroke="#ffffff"
              />
            ))}
          </Layer>

          {/* ELEMENTS */}
          <Layer>
            {layout.elements?.map((el) => {
              const width = el.width || 400;
              const x = resolvePosition(el.x, width, CANVAS_W);
              const y = resolvePosition(el.y, el.fontSize || 40, CANVAS_H);

              const isSelected = selectedId === el.id;
              const isHover = hoverId === el.id;

              return (
                <Text
                  key={el.id}
                  id={`el-${el.id}`}
                  text={el.text}
                  x={x}
                  y={y}
                  width={width}
                  fontSize={el.fontSize || 32}
                  fontFamily={el.fontFamily || "Arial"}
                  fill={el.color || "#fff"}
                  draggable
                  rotation={el.rotation || 0}
                  shadowColor={isSelected ? "#7c6af7" : "transparent"}
                  shadowBlur={isSelected ? 20 : 0}
                  shadowOpacity={0.8}
                  stroke={isHover ? "#7c6af7" : undefined}
                  strokeWidth={isHover ? 0.5 : 0}
                  onMouseEnter={() => setHoverId(el.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => onSelect(el.id)}
                  onTap={() => onSelect(el.id)}
                  onDragMove={(e) => handleDragMove(el, e)}
                  onDragEnd={(e) => handleDragEnd(el, e)}
                  onTransformEnd={(e) =>
                    handleTransformEnd(el, e.target)
                  }
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
            />
          </Layer>

          {/* SNAP GUIDES */}
          <Layer>
            {guides.map((g, i) =>
              g.type === "v" ? (
                <Line
                  key={i}
                  points={[g.x, 0, g.x, CANVAS_H]}
                  stroke="#7c6af7"
                  dash={[6, 4]}
                />
              ) : (
                <Line
                  key={i}
                  points={[0, g.y, CANVAS_W, g.y]}
                  stroke="#7c6af7"
                  dash={[6, 4]}
                />
              )
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  wrapper: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  canvasContainer: {
    padding: 24,
    borderRadius: 24,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
  },

  stage: {
    borderRadius: 16,
    background: "#000",
  },

  empty: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#888",
  },
};