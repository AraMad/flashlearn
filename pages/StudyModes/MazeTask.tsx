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
  const mazeWord = fullTargetWord.replace(/\s+/g, "");
  const [grid, setGrid] = useState<{ char: string; id: number }[]>([]);
  const [startIdx, setStartIdx] = useState<number>(-1);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    for (let i = 0; i < size; i++) {
      if (newGrid[i] === null) {
        newGrid[i] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }

    setGrid(newGrid.map((char, id) => ({ char, id })));
    setStartIdx(path[0]);
    setSelectedIndices([]);
    setMistakes(0);
  }, [card]);

  const handleInteract = (index: number) => {
    if (feedback) return;
    if (selectedIndices.includes(index)) return;

    const nextExpectedChar = mazeWord[selectedIndices.length];
    
    let isAdjacent = true;
    if (selectedIndices.length > 0) {
      const lastIdx = selectedIndices[selectedIndices.length - 1];
      const cols = Math.sqrt(grid.length);
      const r1 = Math.floor(lastIdx / cols), c1 = lastIdx % cols;
      const r2 = Math.floor(index / cols), c2 = index % cols;
      if (Math.abs(r1 - r2) > 1 || Math.abs(c1 - c2) > 1) {
        isAdjacent = false;
      }
    } else {
      if (index !== startIdx) {
        isAdjacent = false;
      }
    }

    if (isAdjacent && grid[index].char === nextExpectedChar) {
      const newSelected = [...selectedIndices, index];
      setSelectedIndices(newSelected);
      if (newSelected.length === mazeWord.length) {
        onResult(true);
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      
      // Reset connections (implied by "rezetted to the latest correct position")
      // We already do this by just NOT adding the wrong letter. The continuous line remains at the last correct node.

      if (newMistakes >= 3) {
        onResult(false);
      }
    }
  };

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setIsDragging(true);
    handleInteract(index);
  };

  const handlePointerEnter = (index: number) => {
    if (isDragging) {
      handleInteract(index);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const cols = Math.sqrt(grid.length);

  // We need to map `mazeWord` index to `fullTargetWord` index for displaying the revealed letters.
  // We can just iterate `fullTargetWord` and keep a running counter of non-space chars.
  let revealedCount = selectedIndices.length;
  const wordDisplay = fullTargetWord.split("").map((char, idx) => {
    if (char === " ") {
      return (
        <div key={idx} className="w-4 sm:w-6 h-12 sm:h-14"></div>
      );
    }
    const isRevealed = revealedCount > 0 || feedback === "wrong";
    if (revealedCount > 0) revealedCount--;
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
      className={`flex flex-col items-center justify-center space-y-6 touch-none ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
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
        <div
          className="relative grid gap-3 p-4 bg-slate-900/50 rounded-3xl"
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
                onPointerDown={(e) => handlePointerDown(idx, e)}
                onPointerEnter={() => handlePointerEnter(idx)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-black cursor-pointer select-none relative z-10 transition-all ${
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

