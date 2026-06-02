import { useState, useCallback } from "react";

export function useHistory(initial) {
  const [history, setHistory] = useState([initial]);
  const [index, setIndex] = useState(0);

  const current = history[index];

  const push = useCallback((newState) => {
    setHistory((h) => {
      const sliced = h.slice(0, index + 1);
      return [...sliced, newState];
    });
    setIndex((i) => i + 1);
  }, [index]);

  const undo = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      setIndex((i) => Math.min(h.length - 1, i + 1));
      return h;
    });
  }, []);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  const reset = useCallback((newState) => {
    setHistory([newState]);
    setIndex(0);
  }, []);

  return { current, push, undo, redo, canUndo, canRedo, reset };
}
