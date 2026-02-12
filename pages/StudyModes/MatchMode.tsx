
import React, { useState, useEffect } from 'react';
import { DataStore } from '../../store';
import { CardEntity } from '../../types';
import { ChevronLeft, Timer } from 'lucide-react';

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

  useEffect(() => {
    const all = DataStore.getCards().filter(c => c.setId === setId);
    const pool = all.sort(() => Math.random() - 0.5).slice(0, 6);
    
    const gameTiles: Tile[] = [];
    pool.forEach(c => {
      gameTiles.push({ id: crypto.randomUUID(), cardId: c.id, text: c.front, type: 'front', isMatched: false });
      gameTiles.push({ id: crypto.randomUUID(), cardId: c.id, text: c.back, type: 'back', isMatched: false });
    });

    setTiles(gameTiles.sort(() => Math.random() - 0.5));

    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [setId]);

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in zoom-in">
        <div className="bg-amber-600/20 p-8 rounded-full text-amber-500 border border-amber-500/30 mb-4">
           <Timer size={64} />
        </div>
        <h2 className="text-4xl font-black text-slate-100">Game Over!</h2>
        <div className="flex gap-12">
           <div className="text-center">
             <div className="text-5xl font-black text-indigo-400">{seconds}s</div>
             <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Time</div>
           </div>
           <div className="text-center">
             <div className="text-5xl font-black text-red-500">{mistakes}</div>
             <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Mistakes</div>
           </div>
        </div>
        <button onClick={onExit} className="px-12 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20">Return to Set</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="p-2 text-slate-500 hover:text-slate-100 transition-colors"><ChevronLeft size={24} /></button>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800 text-slate-300 font-bold">
             <Timer size={16} className="text-amber-500" />
             {seconds}s
           </div>
           <div className="hidden sm:block text-xs font-black text-slate-600 uppercase tracking-widest">Match all pairs</div>
        </div>
        <div className="w-8" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(tile => {
          const isSelected = selected?.id === tile.id;
          const isMismatched = mismatchedIds.includes(tile.id);
          
          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              className={`aspect-square p-4 rounded-2xl text-sm md:text-base font-bold transition-all transform flex items-center justify-center text-center shadow-sm border-2 ${
                tile.isMatched ? 'opacity-0 scale-75 pointer-events-none' :
                isMismatched ? 'bg-red-500 border-red-500 text-white animate-shake' :
                isSelected ? 'bg-indigo-600 border-indigo-600 text-white scale-105 shadow-[0_0_20px_rgba(79,70,229,0.4)] z-10' :
                'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500 hover:bg-slate-800'
              }`}
            >
              {tile.text}
            </button>
          );
        })}
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
