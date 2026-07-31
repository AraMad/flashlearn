import React, { useState, useEffect, useRef, useMemo } from "react";
import { CardEntity } from "../../types";

interface MazeTaskProps {
  card: CardEntity;
  onResult: (isCorrect: boolean) => void;
  feedback: "correct" | "wrong" | null;
}

export const MazeTask: React.FC<MazeTaskProps> = ({
  card,
  onResult,
  feedback,
}) => {
  const fullTargetWord = card.front.toUpperCase();
  const mazeWord = fullTargetWord;
  const [grid, setGrid] = useState<{ char: string; id: number }[]>([]);
  const [startIdx, setStartIdx] = useState<number>(-1);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const selectedIndicesRef = useRef<number[]>([]);
  const gridRef = useRef(grid);

  useEffect(() => {
    selectedIndicesRef.current = selectedIndices;
  }, [selectedIndices]);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    let size = 9;
    while (size < mazeWord.length) {
      const cols = Math.sqrt(size) + 1;
      size = cols * cols;
    }

    const cols = Math.sqrt(size);
    const rows = cols;

    const getAdjacent = (idx: number) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const adj = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          if (Math.abs(dr) + Math.abs(dc) > 1) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            adj.push(nr * cols + nc);
          }
        }
      }
      return adj;
    };

    let path: number[] = [];
    let attempts = 0;
    while (path.length < mazeWord.length && attempts < 1000) {
      attempts++;
      path = [Math.floor(Math.random() * size)];
      let stuck = false;
      while (path.length < mazeWord.length && !stuck) {
        const current = path[path.length - 1];
        const adjs = getAdjacent(current).filter((a) => !path.includes(a));
        if (adjs.length === 0) {
          stuck = true;
        } else {
          path.push(adjs[Math.floor(Math.random() * adjs.length)]);
        }
      }
    }

    if (path.length < mazeWord.length) {
      path = Array.from({ length: mazeWord.length }, (_, i) => i % size);
    }

    const newGrid = Array(size).fill(null);
    path.forEach((gridIdx, wordIdx) => {
      newGrid[gridIdx] = mazeWord[wordIdx];
    });

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fillerChars = alphabet;
    for (let i = 0; i < size; i++) {
      if (newGrid[i] === null) {
        newGrid[i] = fillerChars[Math.floor(Math.random() * fillerChars.length)];
      }
    }

    setGrid(newGrid.map((char, id) => ({ char, id })));
    setStartIdx(path[0]);
    selectedIndicesRef.current = [];
    setSelectedIndices([]);
    setMistakes(0);
    isDraggingRef.current = false;
    setIsDragging(false);
  }, [card]);

  const updateSelectedIndices = (newSelected: number[]) => {
    selectedIndicesRef.current = newSelected;
    setSelectedIndices(newSelected);
  };

  const handleInteract = (index: number) => {
    if (feedback) return;
    const currentSelected = selectedIndicesRef.current;

    if (currentSelected.includes(index)) {
      const existingPos = currentSelected.indexOf(index);
      if (existingPos < currentSelected.length - 1) {
        updateSelectedIndices(currentSelected.slice(0, existingPos + 1));
      }
      return;
    }

    if (currentSelected.length === 0) {
      if (index === startIdx) {
        updateSelectedIndices([startIdx]);
      }
      return;
    }

    const cols = Math.sqrt(grid.length);
    const lastIdx = currentSelected[currentSelected.length - 1];
    const r1 = Math.floor(lastIdx / cols),
      c1 = lastIdx % cols;
    const r2 = Math.floor(index / cols),
      c2 = index % cols;

    // Do not count toward mistake move by diagonal, simply ignore it
    if (Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 1) {
      return;
    }

    // Must be orthogonally adjacent
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) {
      const newSelected = [...currentSelected, index];
      updateSelectedIndices(newSelected);

      if (newSelected.length === mazeWord.length) {
        const allCorrect = newSelected.every(
          (idx, i) => grid[idx]?.char === mazeWord[i]
        );
        if (allCorrect) {
          isDraggingRef.current = false;
          setIsDragging(false);
          setTimeout(() => onResult(true), 500);
        }
      }
    }
  };

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    if (feedback) return;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch (_) {}
    isDraggingRef.current = true;
    setIsDragging(true);
    handleInteract(index);
  };

  const handlePointerEnter = (index: number) => {
    if (isDraggingRef.current) {
      handleInteract(index);
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (feedback) return;

    const currentSelected = selectedIndicesRef.current;
    let firstWrongIdx = -1;
    for (let i = 0; i < currentSelected.length; i++) {
      if (gridRef.current[currentSelected[i]]?.char !== mazeWord[i]) {
        firstWrongIdx = i;
        break;
      }
    }

    if (firstWrongIdx !== -1) {
      const validPrefix = currentSelected.slice(0, firstWrongIdx);
      updateSelectedIndices(validPrefix);

      setShake(true);
      setTimeout(() => setShake(false), 400);

      setMistakes((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          onResult(false);
        }
        return next;
      });
    }
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      let clientX: number | undefined;
      let clientY: number | undefined;

      if ("touches" in e && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = (e as PointerEvent).clientX;
        clientY = (e as PointerEvent).clientY;
      }

      if (clientX === undefined || clientY === undefined) return;

      const el = document.elementFromPoint(clientX, clientY);
      if (el) {
        const cellEl = el.closest("[data-cell-index]");
        if (cellEl) {
          const indexAttr = cellEl.getAttribute("data-cell-index");
          if (indexAttr !== null) {
            const index = parseInt(indexAttr, 10);
            if (!isNaN(index)) {
              handleInteract(index);
            }
          }
        }
      }
    };

    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current) {
        handlePointerUp();
      }
    };

    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: true });
    window.addEventListener("touchmove", handleGlobalPointerMove, { passive: true });
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("touchend", handleGlobalPointerUp);
    window.addEventListener("touchcancel", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("touchmove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("touchend", handleGlobalPointerUp);
      window.removeEventListener("touchcancel", handleGlobalPointerUp);
    };
  }, [mazeWord.length, feedback, onResult]);

  const cols = Math.sqrt(grid.length);

  let validPrefixLength = 0;
  for (let i = 0; i < selectedIndices.length; i++) {
    if (grid[selectedIndices[i]]?.char === mazeWord[i]) {
      validPrefixLength++;
    } else {
      break;
    }
  }

  let revealedCount = validPrefixLength;
  const wordDisplay = fullTargetWord.split("").map((char, idx) => {
    const isRevealed = revealedCount > 0 || feedback === "wrong";
    if (revealedCount > 0) revealedCount--;

    if (char === " ") {
      return (
        <div key={idx} className="w-4 sm:w-6 h-12 sm:h-14"></div>
      );
    }
    return (
      <div
        key={idx}
        className={`w-8 h-10 sm:w-10 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-black rounded-lg border-b-4 transition-all ${
          isRevealed
            ? "bg-slate-800 border-slate-700 text-slate-100"
            : "bg-slate-900/50 border-slate-800 text-transparent"
        }`}
      >
        {isRevealed ? char : "_"}
      </div>
    );
  });

  return (
    <div
      className={`flex flex-col items-center w-full max-w-full justify-center space-y-6 touch-none ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>

      {/* Target word display */}
      <div className="flex flex-wrap justify-center gap-1 sm:gap-2 min-h-[50px]">
        {wordDisplay}
      </div>

      {/* Grid */}
      {!feedback && grid.length > 0 && (
        <div className="w-full overflow-auto flex justify-center pb-2 px-2 no-scrollbar">
          <div
            className="relative grid gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-900/50 rounded-3xl shrink-0 touch-none select-none"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            <svg
              className="absolute inset-0 pointer-events-none w-full h-full"
              style={{ zIndex: 0 }}
            >
            {selectedIndices.length > 1 &&
              selectedIndices.map((idx, i) => {
                if (i === 0) return null;
                const prevIdx = selectedIndices[i - 1];
                const r1 = Math.floor(prevIdx / cols), c1 = prevIdx % cols;
                const r2 = Math.floor(idx / cols), c2 = idx % cols;
                return (
                  <line
                    key={i}
                    x1={`${(c1 + 0.5) * (100 / cols)}%`}
                    y1={`${(r1 + 0.5) * (100 / cols)}%`}
                    x2={`${(c2 + 0.5) * (100 / cols)}%`}
                    y2={`${(r2 + 0.5) * (100 / cols)}%`}
                    stroke="rgba(245, 158, 11, 0.5)"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                );
              })}
          </svg>

          {grid.map((item, idx) => {
            const isSelected = selectedIndices.includes(idx);
            const isLastSelected =
              selectedIndices[selectedIndices.length - 1] === idx;
            const isStartHint = selectedIndices.length === 0 && idx === startIdx;
            return (
              <div
                key={idx}
                data-cell-index={idx}
                onPointerDown={(e) => handlePointerDown(idx, e)}
                onPointerEnter={() => handlePointerEnter(idx)}
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-2xl font-black cursor-pointer select-none touch-none relative z-10 transition-all ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 scale-95"
                    : isStartHint 
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/50 animate-pulse hover:bg-amber-500/30"
                      : "bg-slate-800 text-slate-100 hover:bg-slate-700 hover:scale-105"
                } ${isLastSelected ? "ring-4 ring-amber-500/50" : ""}`}
              >
                {item.char}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {feedback === "correct" && (
        <div className="p-5 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl animate-in slide-in-from-bottom text-center mt-8">
          <p className="text-xl font-bold text-emerald-400">Correct!</p>
          {card.example && (
            <p className="mt-2 text-emerald-400/80 text-sm italic">
              "{card.example}"
            </p>
          )}
        </div>
      )}

      {feedback === "wrong" && (
        <div className="p-5 bg-red-950/30 border border-red-900/50 rounded-2xl animate-in slide-in-from-bottom text-center mt-8">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">
            Correct Answer
          </p>
          <p className="text-xl font-bold text-slate-100">{card.front}</p>
          {card.example && (
            <p className="mt-2 text-slate-400 text-sm italic">
              "{card.example}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

