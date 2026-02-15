
import React, { useState, useEffect, useMemo } from 'react';
import { DataStore } from '../../store';
import { CardEntity } from '../../types';
import { ChevronLeft, Check, X, ArrowRight, Sparkles } from 'lucide-react';

type TaskType = 'TF' | 'MCQ' | 'TYPE';

interface Task {
  card: CardEntity;
  type: TaskType;
  question: any;
}

export const UnifiedLearnMode: React.FC<{ setId: string, onExit: () => void }> = ({ setId, onExit }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [input, setInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const allCards = DataStore.getCards().filter(c => c.setId === setId).sort(() => Math.random() - 0.5);
    
    // Generate a sequence of tasks
    const generatedTasks: Task[] = allCards.map((card, idx) => {
      // Rotate through types
      const type: TaskType = idx % 3 === 0 ? 'TF' : idx % 3 === 1 ? 'MCQ' : 'TYPE';
      
      let question: any = {};
      if (type === 'TF') {
        const isTrue = Math.random() > 0.5;
        let displayedBack = card.back;
        if (!isTrue && allCards.length > 1) {
          let other;
          do { other = allCards[Math.floor(Math.random() * allCards.length)]; } while (other.id === card.id);
          displayedBack = other.back;
        }
        question = { back: displayedBack, isTrue: displayedBack === card.back };
      } else if (type === 'MCQ') {
        const distractors = allCards.filter(c => c.id !== card.id).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [
          { id: card.id, back: card.back, isCorrect: true },
          ...distractors.map(d => ({ id: d.id, back: d.back, isCorrect: false }))
        ].sort(() => Math.random() - 0.5);
        question = { options };
      }
      
      return { card, type, question };
    });

    setTasks(generatedTasks);
  }, [setId]);

  const handleAnswer = (isCorrect: boolean, id?: string) => {
    if (feedback) return;
    
    if (id) setSelectedId(id);
    
    DataStore.updateStudyState(tasks[currentIndex].card.id, isCorrect);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      setFeedback(null);
      setInput('');
      setSelectedId(null);
      if (currentIndex < tasks.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsFinished(true);
      }
    }, isCorrect ? 800 : 2000);
  };

  const handleTypeSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const isCorrect = input.trim().toLowerCase() === tasks[currentIndex].card.back.trim().toLowerCase();
    handleAnswer(isCorrect);
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-in zoom-in">
        <div className="relative">
            <div className="bg-amber-500/20 p-8 rounded-full border border-amber-500/30 animate-pulse">
                <Sparkles size={64} className="text-amber-500" />
            </div>
        </div>
        <div>
          <h2 className="text-4xl font-black text-slate-100">Round Complete!</h2>
          <p className="text-slate-400 mt-2">You're making great progress.</p>
        </div>
        <div className="text-7xl font-black text-amber-500 drop-shadow-[0_0_15px_rgba(251,198,4,0.3)]">
            {Math.round((score / tasks.length) * 100)}%
        </div>
        <div className="text-slate-500 font-bold uppercase tracking-widest">
            {score} / {tasks.length} correctly answered
        </div>
        <button 
          onClick={onExit} 
          className="px-16 py-4 bg-amber-500 text-slate-950 font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-xl shadow-amber-900/30 active:scale-95"
        >
          Finish
        </button>
      </div>
    );
  }

  const current = tasks[currentIndex];
  if (!current) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="p-2 text-slate-500 hover:text-slate-100"><ChevronLeft size={24} /></button>
        <div className="flex flex-col items-center">
            <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">
                {current.type === 'TF' ? 'True or False' : current.type === 'MCQ' ? 'Multiple Choice' : 'Write the answer'}
            </div>
            <div className="text-xs font-bold text-slate-500">Step {currentIndex + 1} of {tasks.length}</div>
        </div>
        <div className="w-8" />
      </div>

      <div className="w-full h-1 bg-slate-900 rounded-full border border-slate-800">
          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(currentIndex / tasks.length) * 100}%` }} />
      </div>

      <div className="bg-slate-900 p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center text-center">
        {feedback === 'correct' && <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center text-white animate-in fade-in duration-200 z-10"><Check size={80} strokeWidth={4} /></div>}
        {feedback === 'wrong' && <div className="absolute inset-0 bg-red-500 flex items-center justify-center text-white animate-in fade-in duration-200 z-10"><X size={80} strokeWidth={4} /></div>}

        <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-6">Term</p>
        <h3 className="text-3xl md:text-5xl font-bold text-slate-100 leading-tight">{current.card.front}</h3>
        
        {current.type === 'TF' && (
          <div className="mt-12 space-y-2">
            <div className="h-0.5 w-12 bg-slate-800 mx-auto" />
            <p className="text-xl md:text-2xl text-slate-400 italic">"{current.question.back}"</p>
          </div>
        )}
      </div>

      {current.type === 'TF' && !feedback && (
        <div className="grid grid-cols-2 gap-6">
          <button 
            onClick={() => handleAnswer(!current.question.isTrue)}
            className="py-6 bg-slate-900 border-2 border-slate-800 text-red-500 rounded-2xl text-2xl font-black hover:bg-red-950/20 hover:border-red-900 transition-all active:scale-95 shadow-lg"
          >
            FALSE
          </button>
          <button 
            onClick={() => handleAnswer(current.question.isTrue)}
            className="py-6 bg-slate-900 border-2 border-slate-800 text-emerald-500 rounded-2xl text-2xl font-black hover:bg-emerald-950/20 hover:border-emerald-900 transition-all active:scale-95 shadow-lg"
          >
            TRUE
          </button>
        </div>
      )}

      {current.type === 'MCQ' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {current.question.options.map((opt: any) => {
            let style = "bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500";
            if (selectedId) {
                if (opt.isCorrect) style = "bg-emerald-600 border-emerald-600 text-white";
                else if (selectedId === opt.id) style = "bg-red-600 border-red-600 text-white";
                else style = "bg-slate-950 border-slate-900 text-slate-700 opacity-50";
            }
            return (
              <button
                key={opt.id}
                disabled={!!selectedId}
                onClick={() => handleAnswer(opt.isCorrect, opt.id)}
                className={`p-6 rounded-2xl text-lg font-bold border-2 transition-all text-left flex items-center gap-4 ${style}`}
              >
                <span className="flex-1">{opt.back}</span>
                {selectedId && opt.isCorrect && <Check size={20} />}
              </button>
            );
          })}
        </div>
      )}

      {current.type === 'TYPE' && (
        <div className="space-y-6">
          <form onSubmit={handleTypeSubmit} className="relative">
            <input 
              type="text"
              autoFocus
              disabled={!!feedback}
              className={`w-full text-xl p-6 bg-slate-900 border-2 rounded-2xl outline-none transition-all placeholder:text-slate-700 ${
                feedback === 'correct' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' :
                feedback === 'wrong' ? 'border-red-500 text-red-400 bg-red-950/20' :
                'border-slate-800 focus:border-amber-500 text-slate-100'
              }`}
              placeholder="Type the definition..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {!feedback && (
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600 transition-all">
                <ArrowRight size={20} />
              </button>
            )}
          </form>
          {feedback === 'wrong' && (
            <div className="p-5 bg-red-950/30 border border-red-900/50 rounded-2xl animate-in slide-in-from-top-4">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Correct Answer</p>
                <p className="text-xl font-bold text-slate-100">{current.card.back}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
