import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Text,
  Transformer,
  Image as KImage,
  Line,
} from "react-konva";

const CANVAS_W = 800;
const CANVAS_H = 600;
const SNAP_THRESHOLD = 6;


/* --------------------------------------------------
   POSITION HELPERS
-------------------------------------------------- */

function resolvePosition(value, size, canvasSize) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    if (value === "center") {
      return canvasSize / 2 - size / 2;
    }

    if (value.endsWith("%")) {
      return (parseFloat(value) / 100) * canvasSize;
    }
  }

  return 0;
}

/* --------------------------------------------------
   IMAGE LOADER
-------------------------------------------------- */

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

  /* --------------------------------------------------
     BACKGROUND
  -------------------------------------------------- */

  useEffect(() => {
    if (!layout?.background?.imageUrl) {
      setBgImage(null);
      return;
    }

    loadImage(layout.background.imageUrl)
      .then(setBgImage)
      .catch(() => setBgImage(null));
  }, [layout?.background?.imageUrl]);

  /* --------------------------------------------------
     TRANSFORMER
  -------------------------------------------------- */

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const node = stageRef.current.findOne(`#el-${selectedId}`);

    if (node) {
      transformerRef.current.nodes([node]);
    } else {
      transformerRef.current.nodes([]);
    }

    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, layout, stageRef]);

  /* --------------------------------------------------
     SNAP LINES
  -------------------------------------------------- */

  const getSnapPosition = (x, y, width, height) => {
    const lines = [];

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    if (Math.abs(centerX - CANVAS_W / 2) < SNAP_THRESHOLD) {
      lines.push({
        type: "v",
        x: CANVAS_W / 2,
      });

      x = CANVAS_W / 2 - width / 2;
    }

    if (Math.abs(centerY - CANVAS_H / 2) < SNAP_THRESHOLD) {
      lines.push({
        type: "h",
        y: CANVAS_H / 2,
      });

      y = CANVAS_H / 2 - height / 2;
    }

    return { x, y, lines };
  };

  /* --------------------------------------------------
     DRAGGING
  -------------------------------------------------- */

  const handleDragMove = (el, e) => {
    const node = e.target;

    const width = el.width || 400;
    const height = el.fontSize || 40;

    let { x, y } = node.position();

    const snap = getSnapPosition(
      x,
      y,
      width,
      height
    );

    node.position({
      x: snap.x,
      y: snap.y,
    });

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

  /* --------------------------------------------------
     RESIZE / ROTATE
  -------------------------------------------------- */

  const handleTransformEnd = useCallback(
    (el, node) => {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      onElementChange({
        ...el,
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        width: Math.max(
          50,
          Math.round((el.width || 400) * scaleX)
        ),
        fontSize: Math.max(
          8,
          Math.round((el.fontSize || 32) * scaleY)
        ),
        rotation: Math.round(node.rotation()),
      });
    },
    [onElementChange]
  );

  /* --------------------------------------------------
     EMPTY STATE
  -------------------------------------------------- */

  if (!layout) {
    return (
      <div style={styles.empty}>
        ✨ Generate a cover first
      </div>
    );
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
            if (e.target === e.target.getStage()) {
              onSelect(null);
            }
          }}
        >
          {/* BACKGROUND */}

          

          <Layer>
     {bgImage && (() => {
  const scale = Math.max(
    CANVAS_W / bgImage.width,
    CANVAS_H / bgImage.height
  );

  const w = bgImage.width * scale;
  const h = bgImage.height * scale;

  const x = (CANVAS_W - w) / 2;
  const y = (CANVAS_H - h) / 2;

  return (
    <KImage
      image={bgImage}
      x={x}
      y={y}
      width={w}
      height={h}
      listening={false}
    />
  );
})()}
          </Layer>

          {/* ELEMENTS */}

          <Layer>
            {layout.elements?.map((el) => {
              const width = el.width || 400;

              const x = resolvePosition(
                el.x,
                width,
                CANVAS_W
              );

              const y = resolvePosition(
                el.y,
                el.fontSize || 32,
                CANVAS_H
              );

              const isSelected =
                selectedId === el.id;

              const isHovered =
                hoverId === el.id;

              return (
                <Text
                  key={el.id}
                  id={`el-${el.id}`}
                  text={el.text || ""}
                  x={x}
                  y={y}
                  width={width}
                  draggable
                  rotation={el.rotation || 0}
                  fontSize={el.fontSize || 32}
                  fontFamily={el.fontFamily || "Arial"}
                  fontStyle={
                    el.fontWeight === "bold" &&
                    el.fontStyle === "italic"
                      ? "bold italic"
                      : el.fontWeight === "bold"
                      ? "bold"
                      : el.fontStyle === "italic"
                      ? "italic"
                      : "normal"
                  }
                  align={el.textAlign || "left"}
                  fill={el.color || "#ffffff"}
                  shadowEnabled={
                    el.shadow?.enabled
                  }
                  shadowColor={
                    el.shadow?.color || "#000000"
                  }
                  shadowBlur={
                    el.shadow?.enabled ? 12 : 0
                  }
                  shadowOpacity={
                    el.shadow?.enabled ? 0.9 : 0
                  }
                  shadowOffsetX={
                    el.shadow?.enabled ? 2 : 0
                  }
                  shadowOffsetY={
                    el.shadow?.enabled ? 2 : 0
                  }
                  stroke={
                    isHovered
                      ? "#7c6af7"
                      : undefined
                  }
                  strokeWidth={
                    isHovered ? 0.5 : 0
                  }
                  onMouseEnter={() =>
                    setHoverId(el.id)
                  }
                  onMouseLeave={() =>
                    setHoverId(null)
                  }
                  onClick={() =>
                    onSelect(el.id)
                  }
                  onTap={() =>
                    onSelect(el.id)
                  }
                  onDragMove={(e) =>
                    handleDragMove(el, e)
                  }
                  onDragEnd={(e) =>
                    handleDragEnd(el, e)
                  }
                  onTransformEnd={(e) =>
                    handleTransformEnd(
                      el,
                      e.target
                    )
                  }
                />
              );
            })}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
              ]}
              anchorSize={10}
              borderStroke="#7c6af7"
              anchorFill="#7c6af7"
              anchorCornerRadius={6}
            />
          </Layer>

          {/* GUIDES */}

          <Layer listening={false}>
            {guides.map((g, i) =>
              g.type === "v" ? (
                <Line
                  key={i}
                  points={[
                    g.x,
                    0,
                    g.x,
                    CANVAS_H,
                  ]}
                  stroke="#7c6af7"
                  strokeWidth={1}
                  dash={[6, 4]}
                />
              ) : (
                <Line
                  key={i}
                  points={[
                    0,
                    g.y,
                    CANVAS_W,
                    g.y,
                  ]}
                  stroke="#7c6af7"
                  strokeWidth={1}
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

/* --------------------------------------------------
   STYLES
-------------------------------------------------- */

const styles = {
  wrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "auto",
    padding: 30,
  },

  canvasContainer: {
    padding: 24,
    borderRadius: 24,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 40px 100px rgba(0,0,0,0.65)",
  },

  stage: {
    background: "#000",
    borderRadius: 16,
    overflow: "hidden",
  },

  empty: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#888",
    fontSize: 18,
  },
};