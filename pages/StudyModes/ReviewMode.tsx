
import React, { useState, useEffect, useRef } from 'react';
import { DataStore } from '../../store';
import { CardEntity } from '../../types';
import { ChevronLeft, RotateCw, Check, X, RotateCcw } from 'lucide-react';

export const ReviewMode: React.FC<{ setId: string, onExit: () => void }> = ({ setId, onExit }) => {
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState({ learned: 0, reviewNeeded: 0 });
  const [isFinished, setIsFinished] = useState(false);

  // Swipe state
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shuffledCards = DataStore.getCards()
        .filter(c => c.setId === setId)
        .sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
  }, [setId]);

  const handleAnswer = (correct: boolean) => {
    DataStore.updateStudyState(cards[currentIndex].id, correct);
    if (correct) setSessionResults(prev => ({ ...prev, learned: prev.learned + 1 }));
    else setSessionResults(prev => ({ ...prev, reviewNeeded: prev.reviewNeeded + 1 }));

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setDragOffset({ x: 0, y: 0 });
    } else {
      setIsFinished(true);
    }
  };

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!dragStart) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const onTouchEnd = () => {
    if (!dragStart) return;
    const swipeThreshold = 120;
    if (dragOffset.x > swipeThreshold) {
      handleAnswer(true); // Swipe Right = Learned
    } else if (dragOffset.x < -swipeThreshold) {
      handleAnswer(false); // Swipe Left = Still Learning
    } else {
      // Return to center if threshold not met
      setDragOffset({ x: 0, y: 0 });
    }
    setDragStart(null);
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in zoom-in duration-300">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-100">Session Complete!</h2>
          <p className="text-slate-400">You've reached the end of the cards.</p>
        </div>
        <div className="flex gap-8">
          <div className="p-8 bg-emerald-950/30 rounded-3xl border border-emerald-900/50 min-w-32 shadow-lg shadow-emerald-900/10">
             <div className="text-4xl font-black text-emerald-400">{sessionResults.learned}</div>
             <div className="text-xs font-bold text-emerald-500/60 uppercase tracking-widest mt-1">Learned</div>
          </div>
          <div className="p-8 bg-red-950/30 rounded-3xl border border-red-900/50 min-w-32 shadow-lg shadow-red-900/10">
             <div className="text-4xl font-black text-red-400">{sessionResults.reviewNeeded}</div>
             <div className="text-xs font-bold text-red-500/60 uppercase tracking-widest mt-1">Still Learning</div>
          </div>
        </div>
        <button 
          onClick={onExit}
          className="px-12 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 active:scale-95"
        >
          Back to Set
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  if (!currentCard) return null;

  const rotation = dragOffset.x * 0.1;
  const opacity = Math.min(Math.abs(dragOffset.x) / 400 + 0.5, 1);
  const swipeColor = dragOffset.x > 0 ? 'rgba(52, 211, 153, ' + opacity + ')' : 'rgba(248, 113, 113, ' + opacity + ')';

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-300 select-none">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="p-2 text-slate-500 hover:text-slate-100 transition-colors"><ChevronLeft size={24} /></button>
        <div className="text-sm font-black text-slate-500 uppercase tracking-widest">
           Card {currentIndex + 1} / {cards.length}
        </div>
        <div className="w-8" />
      </div>

      <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div 
          className="h-full bg-indigo-500 transition-all duration-500" 
          style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
        />
      </div>

      <div 
        ref={cardRef}
        className="perspective-1000 relative w-full aspect-[4/5] md:aspect-[5/3] cursor-grab active:cursor-grabbing"
        onMouseDown={onTouchStart}
        onMouseMove={onTouchMove}
        onMouseUp={onTouchEnd}
        onMouseLeave={onTouchEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
          transition: dragStart ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {/* Swipe Indicators */}
        {Math.abs(dragOffset.x) > 40 && (
          <div 
            className="absolute top-8 z-50 px-6 py-2 rounded-xl border-4 font-black text-2xl uppercase pointer-events-none"
            style={{ 
              left: dragOffset.x > 0 ? '20px' : 'auto', 
              right: dragOffset.x < 0 ? '20px' : 'auto',
              borderColor: swipeColor,
              color: swipeColor,
              transform: `rotate(${dragOffset.x > 0 ? -15 : 15}deg)`,
              opacity: Math.min(Math.abs(dragOffset.x) / 100, 1)
            }}
          >
            {dragOffset.x > 0 ? 'Learned' : 'Study'}
          </div>
        )}

        <div 
          className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={(e) => {
            if (Math.abs(dragOffset.x) < 5 && Math.abs(dragOffset.y) < 5) {
                setIsFlipped(!isFlipped);
            }
          }}
        >
          {/* Front */}
          <div className="absolute inset-0 bg-slate-900 rounded-3xl border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center p-12 text-center backface-hidden">
            <p className="text-slate-600 text-xs font-black uppercase tracking-widest mb-4">Front</p>
            <h3 className="text-2xl md:text-4xl font-bold text-slate-100 leading-tight">{currentCard.front}</h3>
            <div className="mt-auto flex items-center gap-2 text-indigo-400 text-sm font-bold opacity-60">
               <RotateCw size={16} /> Tap to flip
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 bg-slate-800 rounded-3xl border-2 border-indigo-900 flex flex-col items-center justify-center p-12 text-center backface-hidden rotate-y-180 shadow-2xl">
            <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">Back</p>
            <h3 className="text-2xl md:text-4xl font-bold text-slate-100 leading-tight">{currentCard.back}</h3>
            <div className="mt-auto flex items-center gap-2 text-indigo-400 text-sm font-bold opacity-60">
               <RotateCw size={16} /> Tap to flip back
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="grid grid-cols-2 gap-4 w-full">
            <button 
            onClick={() => handleAnswer(false)}
            className="flex items-center justify-center gap-3 py-4 bg-slate-900 border-2 border-slate-800 text-slate-400 rounded-2xl font-bold hover:border-red-900 hover:bg-red-950/20 hover:text-red-400 transition-all active:scale-95 group"
            >
            <X size={24} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Still Learning</span>
            </button>
            <button 
            onClick={() => handleAnswer(true)}
            className="flex items-center justify-center gap-3 py-4 bg-slate-900 border-2 border-slate-800 text-slate-400 rounded-2xl font-bold hover:border-emerald-900 hover:bg-emerald-950/20 hover:text-emerald-400 transition-all active:scale-95 group"
            >
            <Check size={24} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">I Know This</span>
            </button>
        </div>

        <div className="flex items-center gap-8">
            <button 
            onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false); setDragOffset({x:0, y:0}); }}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-300 disabled:opacity-0 transition-all text-xs font-black uppercase tracking-widest"
            >
            <RotateCcw size={14} />
            Undo
            </button>
            <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest text-center">
                Swipe right to learn • Swipe left to study
            </p>
        </div>
      </div>
    </div>
  );
};
