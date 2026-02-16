
import React, { useState, useEffect, useRef } from 'react';
import { DataStore } from '../../store';
import { CardEntity } from '../../types';
import { ChevronLeft, RotateCw, Check, X, RotateCcw, ArrowLeftRight } from 'lucide-react';

export const ReviewMode: React.FC<{ setId: string, onExit: () => void }> = ({ setId, onExit }) => {
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false); // Controls which side starts on front
  const [sessionResults, setSessionResults] = useState({ learned: 0, reviewNeeded: 0 });
  const [isFinished, setIsFinished] = useState(false);

  // Swipe interaction state
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const foundCards = DataStore.getCards().filter(c => c.setId === setId);
    // Standard practice to shuffle for a better learning experience, but keep order if preferred
    const shuffled = [...foundCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, [setId]);

  const handleAnswer = (correct: boolean) => {
    if (cards.length === 0) return;
    
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
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!dragStart) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const onTouchEnd = () => {
    if (!dragStart) return;
    const swipeThreshold = 100;
    if (dragOffset.x > swipeThreshold) {
      handleAnswer(true); 
    } else if (dragOffset.x < -swipeThreshold) {
      handleAnswer(false);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    setDragStart(null);
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-in zoom-in duration-300">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-100 uppercase tracking-tight">Set Complete!</h2>
          <p className="text-slate-400 font-medium">You've finished reviewing these cards.</p>
        </div>
        <div className="flex gap-6">
          <div className="p-8 bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/30 min-w-[140px]">
             <div className="text-5xl font-black text-emerald-400">{sessionResults.learned}</div>
             <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mt-3">Known</div>
          </div>
          <div className="p-8 bg-red-500/10 rounded-[2.5rem] border border-red-500/30 min-w-[140px]">
             <div className="text-5xl font-black text-red-400">{sessionResults.reviewNeeded}</div>
             <div className="text-[10px] font-black text-red-500/60 uppercase tracking-[0.2em] mt-3">Study</div>
          </div>
        </div>
        <button 
          onClick={onExit}
          className="px-12 py-4 bg-accent text-slate-950 font-black rounded-2xl hover:bg-accent-hover transition-all shadow-xl shadow-accent/20 active:scale-95 uppercase tracking-widest text-sm"
        >
          Back to Set
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  if (!currentCard) return null;

  // Swap logic: if isSwapped, start with definition on front
  const frontContent = isSwapped ? currentCard.back : currentCard.front;
  const backContent = isSwapped ? currentCard.front : currentCard.back;
  const frontLabel = isSwapped ? "DEFINITION" : "TERM";
  const backLabel = isSwapped ? "TERM" : "DEFINITION";

  const rotation = dragOffset.x * 0.08;
  const opacity = Math.min(Math.abs(dragOffset.x) / 300 + 0.5, 1);
  const swipeColor = dragOffset.x > 0 ? 'rgba(52, 211, 153, ' + opacity + ')' : 'rgba(248, 113, 113, ' + opacity + ')';

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom duration-300 select-none py-4 px-2 sm:px-0">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="p-2 text-slate-500 hover:text-slate-100 transition-colors bg-slate-900/50 rounded-xl border border-slate-800">
            <ChevronLeft size={20} />
        </button>
        <div className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
            {currentIndex + 1} / {cards.length}
        </div>
        <button 
            onClick={() => { setIsSwapped(!isSwapped); setIsFlipped(false); }}
            className={`p-2 rounded-xl transition-all border ${isSwapped ? 'bg-accent border-accent text-slate-950 shadow-lg shadow-accent/20' : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:text-slate-200'}`}
            title="Swap Sides (Term vs Definition)"
        >
            <ArrowLeftRight size={20} />
        </button>
      </div>

      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div 
          className="h-full bg-accent transition-all duration-500 shadow-[0_0_8px_rgba(247,182,68,0.5)]" 
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      <div 
        ref={cardRef}
        className="perspective-1000 relative w-full aspect-[4/5] sm:aspect-[5/3] cursor-pointer"
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
        {/* Swipe Feedback */}
        {Math.abs(dragOffset.x) > 40 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 z-50 px-8 py-4 rounded-3xl border-4 font-black text-3xl uppercase pointer-events-none whitespace-nowrap"
            style={{ 
              left: dragOffset.x > 0 ? '40px' : 'auto', 
              right: dragOffset.x < -40 ? '40px' : 'auto',
              borderColor: swipeColor,
              color: swipeColor,
              transform: `rotate(${dragOffset.x > 0 ? -12 : 12}deg)`,
              opacity: Math.min(Math.abs(dragOffset.x) / 100, 1)
            }}
          >
            {dragOffset.x > 0 ? 'Know' : 'Study'}
          </div>
        )}

        <div 
          className="relative w-full h-full preserve-3d transition-transform duration-700 shadow-2xl rounded-[3rem]"
          style={{ 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            WebkitTransformStyle: 'preserve-3d'
          }}
          onClick={(e) => {
            if (Math.abs(dragOffset.x) < 5 && Math.abs(dragOffset.y) < 5) {
                setIsFlipped(!isFlipped);
            }
          }}
        >
          {/* Front Side */}
          <div 
            className="absolute inset-0 bg-slate-900 rounded-[3rem] border-2 border-slate-800 flex flex-col items-center justify-center p-10 text-center shadow-2xl"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)'
            }}
          >
             <div className="absolute top-10 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{frontLabel}</div>
             <h3 className="text-3xl md:text-5xl font-bold text-slate-100 leading-tight">{frontContent}</h3>
             <div className="absolute bottom-10 flex items-center gap-2 text-accent/30 text-[10px] font-black uppercase tracking-widest">
                <RotateCw size={14} /> TAP TO FLIP
             </div>
          </div>

          {/* Back Side */}
          <div 
            className="absolute inset-0 bg-slate-800 rounded-[3rem] border-2 border-accent flex flex-col items-center justify-center p-10 text-center shadow-2xl"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
             <div className="absolute top-10 text-[10px] font-black text-accent/60 uppercase tracking-[0.3em]">{backLabel}</div>
             <h3 className="text-3xl md:text-5xl font-bold text-slate-100 leading-tight">{backContent}</h3>
             <div className="absolute bottom-10 flex items-center gap-2 text-accent/30 text-[10px] font-black uppercase tracking-widest">
                <RotateCw size={14} /> TAP TO FLIP
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 pt-4">
        <div className="grid grid-cols-2 gap-4 w-full">
            <button 
                onClick={() => handleAnswer(false)}
                className="flex items-center justify-center gap-3 py-5 bg-slate-900 border-2 border-slate-800 text-slate-400 rounded-3xl font-bold hover:border-red-900 hover:bg-red-950/20 hover:text-red-400 transition-all active:scale-95 group shadow-lg"
            >
                <X size={24} className="group-hover:scale-110 transition-transform" />
                <span className="uppercase tracking-widest text-xs">Still Studying</span>
            </button>
            <button 
                onClick={() => handleAnswer(true)}
                className="flex items-center justify-center gap-3 py-5 bg-slate-900 border-2 border-slate-800 text-slate-400 rounded-3xl font-bold hover:border-emerald-900 hover:bg-emerald-950/20 hover:text-emerald-400 transition-all active:scale-95 group shadow-lg"
            >
                <Check size={24} className="group-hover:scale-110 transition-transform" />
                <span className="uppercase tracking-widest text-xs">I Know This</span>
            </button>
        </div>

        <div className="flex items-center gap-8">
            <button 
                onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false); setDragOffset({x:0, y:0}); }}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-300 disabled:opacity-0 transition-all text-[10px] font-black uppercase tracking-widest"
            >
                <RotateCcw size={14} />
                Undo
            </button>
            <p className="text-[9px] text-slate-700 font-bold uppercase tracking-[0.2em] text-center">
                Swipe right to learn • Swipe left to study
            </p>
        </div>
      </div>
    </div>
  );
};
