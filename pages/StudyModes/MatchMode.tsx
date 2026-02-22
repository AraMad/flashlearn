import React, { useState, useEffect, useCallback } from 'react';
import { DataStore } from '../../store';
import { CardEntity } from '../../types';
import { ChevronLeft, Timer, Trophy, RotateCcw } from 'lucide-react';

interface Tile {
  id: string;
  cardId: string;
  text: string;
  type: 'front' | 'back';
  isMatched: boolean;
}

export const MatchMode: React.FC<{ setId: string, onExit: () => void }> = ({ setId, onExit }) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [mismatchedIds, setMismatchedIds] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);

  // Load best time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`match_best_${setId}`);
    if (stored) {
      setBestTime(parseInt(stored, 10));
    }
  }, [setId]);

  const initGame = useCallback(() => {
    const all = DataStore.getCards().filter(c => c.setId === setId);
    // Use 6 pairs (12 tiles total)
    const pool = all.sort(() => Math.random() - 0.5).slice(0, 6);
    
    const gameTiles: Tile[] = [];
    pool.forEach(c => {
      gameTiles.push({ id: crypto.randomUUID(), cardId: c.id, text: c.front, type: 'front', isMatched: false });
      gameTiles.push({ id: crypto.randomUUID(), cardId: c.id, text: c.back, type: 'back', isMatched: false });
    });

    setTiles(gameTiles.sort(() => Math.random() - 0.5));
    setSeconds(0);
    setMistakes(0);
    setIsFinished(false);
    setSelected(null);
    setMismatchedIds([]);
  }, [setId]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer logic that stops when finished
  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished]);

  // Handle high score
  useEffect(() => {
    if (isFinished) {
      const currentBest = localStorage.getItem(`match_best_${setId}`);
      const currentSeconds = seconds;
      
      if (!currentBest || currentSeconds < parseInt(currentBest, 10)) {
        localStorage.setItem(`match_best_${setId}`, currentSeconds.toString());
        setBestTime(currentSeconds);
      }
    }
  }, [isFinished, setId, seconds]);

  const handleTileClick = (tile: Tile) => {
    if (tile.isMatched || mismatchedIds.length > 0) return;
    if (selected?.id === tile.id) {
        setSelected(null);
        return;
    }

    if (!selected) {
      setSelected(tile);
    } else {
      if (selected.cardId === tile.cardId && selected.type !== tile.type) {
        const newTiles = tiles.map(t => 
          (t.cardId === tile.cardId) ? { ...t, isMatched: true } : t
        );
        setTiles(newTiles);
        setSelected(null);
        DataStore.updateStudyState(tile.cardId, true);

        if (newTiles.every(t => t.isMatched)) {
          setIsFinished(true);
        }
      } else {
        setMismatchedIds([selected.id, tile.id]);
        setMistakes(m => m + 1);
        setTimeout(() => {
          setMismatchedIds([]);
          setSelected(null);
        }, 800);
      }
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in zoom-in">
        <div className="relative">
          <div className="bg-amber-500/20 p-8 rounded-full text-amber-500 border border-amber-500/30 mb-4 animate-bounce">
             <Trophy size={64} />
          </div>
          {bestTime === seconds && (
            <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-1 rounded-md rotate-12 shadow-lg">NEW BEST!</div>
          )}
        </div>
        
        <h2 className="text-4xl font-black text-slate-100">Game Over!</h2>
        
        <div className="flex gap-8 md:gap-12">
           <div className="text-center">
             <div className="text-4xl md:text-5xl font-black text-amber-500">{seconds}s</div>
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Time</div>
           </div>
           <div className="text-center">
             <div className="text-4xl md:text-5xl font-black text-amber-300">{bestTime}s</div>
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Best</div>
           </div>
           <div className="text-center">
             <div className="text-4xl md:text-5xl font-black text-red-500">{mistakes}</div>
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Mistakes</div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
          <button 
            onClick={onExit} 
            className="flex-1 py-4 bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-95 transition-all"
          >
            Finish
          </button>
          <button 
            onClick={initGame}
            className="flex-1 py-4 bg-amber-500 text-slate-950 font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-xl shadow-amber-900/20 active:scale-95 flex items-center justify-center gap-3"
          >
            <RotateCcw size={20} /> Retake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 md:relative md:inset-auto h-screen md:h-[80vh] bg-slate-950 flex flex-col p-2 sm:p-4 md:p-0 animate-in slide-in-from-bottom duration-300 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-2 sm:mb-4">
        <button onClick={onExit} className="p-2 text-slate-500 hover:text-slate-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800 text-slate-300 font-bold text-sm sm:text-base">
             <Timer size={16} className="text-amber-500" />
             {seconds}s
           </div>
           {bestTime && (
             <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800 text-amber-500 font-bold">
                <Trophy size={14} />
                {bestTime}s
             </div>
           )}
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 justify-items-center auto-rows-min overflow-y-auto pb-10 px-1">
        {tiles.map(tile => {
          const isSelected = selected?.id === tile.id;
          const isMismatched = mismatchedIds.includes(tile.id);
          
          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              className={`relative aspect-square w-full p-1 sm:p-2 rounded-xl sm:rounded-2xl transition-all transform flex items-center justify-center text-center shadow-sm border-2 overflow-hidden ${
                tile.isMatched ? 'opacity-0 scale-75 pointer-events-none' :
                isMismatched ? 'bg-red-500 border-red-500 text-white animate-shake' :
                isSelected ? 'bg-amber-500 border-amber-500 text-slate-950 scale-105 shadow-[0_0_20px_rgba(251,198,4,0.3)] z-10' :
                'bg-slate-900 border-slate-800 text-white hover:border-amber-500 hover:bg-slate-800 active:scale-95'
              }`}
            >
              <span className="text-xs xs:text-sm sm:text-base md:text-xl font-bold leading-tight line-clamp-4 break-words hyphens-auto w-full">
                {tile.text}
              </span>
            </button>
          );
        })}
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
        @media (max-height: 500px) {
          .line-clamp-4 { -webkit-line-clamp: 2; }
        }
      `}</style>
    </div>
  );
};
