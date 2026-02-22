import React, { useState, useEffect } from 'react';
import { DataStore } from '../../store';
import { CardEntity, LearnMode, StudyStatus } from '../../types';
import { ChevronLeft, Check, X, ArrowRight, Sparkles } from 'lucide-react';

type TaskType = 'TF' | 'MCQ' | 'TYPE';

interface Task {
  card: CardEntity;
  type: TaskType;
  question: any;
  validBacks: string[];
}

export const UnifiedLearnMode: React.FC<{ setId: string, mode?: LearnMode, onExit: () => void }> = ({ setId, mode, onExit }) => {
  const [blocks, setBlocks] = useState<Task[][]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [input, setInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isBlockFinished, setIsBlockFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    const allCardsInSet = DataStore.getCards().filter(c => c.setId === setId);
    const studyStates = DataStore.getStudyStates().filter(s => s.setId === setId);
    
    // Identify cards that are not yet learned
    const unlearnedCardIds = studyStates
      .filter(s => s.status === StudyStatus.NOT_LEARNED)
      .map(s => s.cardId);
      
    let targetCards = allCardsInSet.filter(c => unlearnedCardIds.includes(c.id));
    
    // If all cards are learned, or none are found in unlearned list, use the full set
    const isReviewingAll = targetCards.length === 0;
    if (isReviewingAll) {
      targetCards = [...allCardsInSet];
    }
    
    // Shuffle the cards we are going to study
    targetCards.sort(() => Math.random() - 0.5);
    
    // Determine which task types are allowed for this session
    const allowedTypes: TaskType[] = [];
    if (mode === 'TF') allowedTypes.push('TF');
    else if (mode === 'MCQ') allowedTypes.push('MCQ');
    else if (mode === 'TYPE') allowedTypes.push('TYPE');
    else allowedTypes.push('TF', 'MCQ', 'TYPE');

    const allGeneratedTasks: Task[] = [];
    
    targetCards.forEach(card => {
      const validBacks = allCardsInSet
        .filter(c => c.front === card.front)
        .map(c => c.back);

      allowedTypes.forEach(type => {
        let question: any = {};
        if (type === 'TF') {
          const isTrue = Math.random() > 0.5;
          let displayedBack = card.back;
          
          if (!isTrue && allCardsInSet.length > 1) {
            const potentialDistractors = allCardsInSet.filter(c => !validBacks.includes(c.back));
            if (potentialDistractors.length > 0) {
               const other = potentialDistractors[Math.floor(Math.random() * potentialDistractors.length)];
               displayedBack = other.back;
            } else {
               displayedBack = card.back;
            }
          }
          question = { back: displayedBack, isTrue: validBacks.includes(displayedBack) };
        } else if (type === 'MCQ') {
          const potentialDistractors = allCardsInSet.filter(c => !validBacks.includes(c.back));
          const distractors = potentialDistractors.sort(() => Math.random() - 0.5).slice(0, 3);
          const options = [
            { id: card.id, back: card.back, isCorrect: true },
            ...distractors.map(d => ({ id: d.id, back: d.back, isCorrect: false }))
          ].sort(() => Math.random() - 0.5);
          
          const uniqueOptions = [];
          const seenBacks = new Set();
          for (const opt of options) {
              if (!seenBacks.has(opt.back)) {
                  seenBacks.add(opt.back);
                  uniqueOptions.push(opt);
              }
          }
          question = { options: uniqueOptions };
        }
        
        allGeneratedTasks.push({ card, type, question, validBacks });
      });
    });

    // --- Block Generation Logic ---
    const BLOCK_SIZE = 5;
    let finalBlocks: Task[][] = [];

    const typeTasks = allGeneratedTasks.filter(t => t.type === 'TYPE');
    const otherTasks = allGeneratedTasks.filter(t => t.type !== 'TYPE');

    // Shuffle pools to ensure random distribution across blocks
    typeTasks.sort(() => Math.random() - 0.5);
    otherTasks.sort(() => Math.random() - 0.5);

    if (typeTasks.length > 0 && otherTasks.length > 0) {
        // We want to form blocks of ~5 for the late phase, containing TYPE tasks.
        // Each block should have at least 1 non-TYPE task.
        // Capacity for TYPE per block is 4.
        const numLateBlocks = Math.ceil(typeTasks.length / 4);
        
        // Reserve non-type tasks (1 per late block)
        const reservedOtherTasks = otherTasks.splice(0, Math.min(otherTasks.length, numLateBlocks));
        
        // Create Late Blocks
        const lateBlocks: Task[][] = [];
        let typeIdx = 0;
        
        for (let i = 0; i < numLateBlocks; i++) {
            const block: Task[] = [];
            // Add 1 reserved non-type task if available
            if (i < reservedOtherTasks.length) {
                block.push(reservedOtherTasks[i]);
            }
            // Fill with type tasks (up to 4, or until full/empty)
            let addedType = 0;
            while (addedType < 4 && typeIdx < typeTasks.length) {
                block.push(typeTasks[typeIdx++]);
                addedType++;
            }
            lateBlocks.push(block);
        }

        // Create Early Blocks from remaining otherTasks
        const earlyBlocks: Task[][] = [];
        while (otherTasks.length > 0) {
            earlyBlocks.push(otherTasks.splice(0, BLOCK_SIZE));
        }

        // Handle transition: if last early block is small, merge into first late block
        if (earlyBlocks.length > 0 && earlyBlocks[earlyBlocks.length - 1].length < BLOCK_SIZE) {
            const smallBlock = earlyBlocks.pop()!;
            if (lateBlocks.length > 0) {
                lateBlocks[0] = [...smallBlock, ...lateBlocks[0]];
            } else {
                earlyBlocks.push(smallBlock);
            }
        }

        finalBlocks = [...earlyBlocks, ...lateBlocks];
    } else {
        // Just shuffle everything and chunk
        allGeneratedTasks.sort(() => Math.random() - 0.5);
        const tasksCopy = [...allGeneratedTasks];
        while (tasksCopy.length > 0) {
            finalBlocks.push(tasksCopy.splice(0, BLOCK_SIZE));
        }
    }

    // Merge last block if it's too small (and not the only block)
    if (finalBlocks.length > 1) {
        const lastBlock = finalBlocks[finalBlocks.length - 1];
        if (lastBlock.length < BLOCK_SIZE) {
            const secondLast = finalBlocks[finalBlocks.length - 2];
            finalBlocks[finalBlocks.length - 2] = [...secondLast, ...lastBlock];
            finalBlocks.pop();
        }
    }

    // Shuffle and fix consecutive duplicates for ALL blocks
    finalBlocks.forEach(b => {
        b.sort(() => Math.random() - 0.5);
        
        // Attempt to fix consecutive duplicates
        for (let i = 1; i < b.length; i++) {
            if (b[i].card.id === b[i-1].card.id) {
                // Find a swap candidate
                let swapIdx = -1;
                for (let j = 0; j < b.length; j++) {
                    if (j !== i && j !== i-1 && 
                        b[j].card.id !== b[i].card.id && 
                        (j === 0 || b[j-1].card.id !== b[i].card.id) &&
                        (j === b.length - 1 || b[j+1].card.id !== b[i].card.id)) {
                        swapIdx = j;
                        break;
                    }
                }
                if (swapIdx !== -1) {
                    const temp = b[i];
                    b[i] = b[swapIdx];
                    b[swapIdx] = temp;
                }
            }
        }
    });

    setBlocks(finalBlocks);
    setTotalTasks(finalBlocks.reduce((acc, b) => acc + b.length, 0));

  }, [setId, mode]);

  const handleAnswer = (isCorrect: boolean, id?: string) => {
    if (feedback) return;
    
    if (id) setSelectedId(id);
    
    const currentBlock = blocks[currentBlockIndex];
    const currentTask = currentBlock[currentTaskIndex];

    DataStore.updateStudyState(currentTask.card.id, isCorrect);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      setFeedback(null);
      setInput('');
      setSelectedId(null);

      if (currentTaskIndex < currentBlock.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
      } else {
        // Block finished
        setIsBlockFinished(true);
      }
    }, isCorrect ? 800 : 2000);
  };

  const handleContinueBlock = () => {
      setIsBlockFinished(false);
      if (currentBlockIndex < blocks.length - 1) {
          setCurrentBlockIndex(currentBlockIndex + 1);
          setCurrentTaskIndex(0);
      } else {
          setIsFinished(true);
      }
  };

  const handleTypeSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedInput = normalize(input);
    const currentTask = blocks[currentBlockIndex][currentTaskIndex];
    const isCorrect = currentTask.validBacks.some(vb => normalize(vb) === normalizedInput);
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
          <h2 className="text-4xl font-black text-slate-100">Session Complete!</h2>
          <p className="text-slate-400 mt-2">You've mastered this session.</p>
        </div>
        <div className="text-7xl font-black text-amber-500 drop-shadow-[0_0_15px_rgba(251,198,4,0.3)]">
            {totalTasks > 0 ? Math.round((score / totalTasks) * 100) : 0}%
        </div>
        <div className="text-slate-500 font-bold uppercase tracking-widest">
            {score} / {totalTasks} correctly answered
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

  if (isBlockFinished) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in zoom-in">
            <div className="bg-emerald-500/20 p-6 rounded-full border border-emerald-500/30 mb-4">
                <Check size={48} className="text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-100">Block Complete!</h2>
            <p className="text-slate-400 max-w-xs">Take a breath, then continue to the next set of cards.</p>
            
            <button 
                onClick={handleContinueBlock}
                className="mt-8 px-12 py-4 bg-slate-100 text-slate-950 font-bold rounded-2xl hover:bg-white transition-all shadow-xl active:scale-95 flex items-center gap-2"
            >
                Continue <ArrowRight size={20} />
            </button>
        </div>
      );
  }

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
        <p className="font-medium">No cards available for this session.</p>
        <button onClick={onExit} className="px-6 py-2 bg-slate-900 rounded-xl text-accent font-bold">Go Back</button>
      </div>
    );
  }

  const currentBlock = blocks[currentBlockIndex];
  const current = currentBlock[currentTaskIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="p-2 text-slate-500 hover:text-slate-100"><ChevronLeft size={24} /></button>
        <div className="flex flex-col items-center">
            <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">
                {current.type === 'TF' ? 'True or False' : current.type === 'MCQ' ? 'Multiple Choice' : 'Write the answer'}
            </div>
            <div className="text-xs font-bold text-slate-500">Block {currentBlockIndex + 1} of {blocks.length}</div>
        </div>
        <div className="w-8" />
      </div>

      {/* Instagram-style Progress Bar */}
      <div className="flex gap-1.5 w-full">
          {currentBlock.map((_, idx) => (
              <div key={idx} className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                        idx < currentTaskIndex ? 'bg-amber-500' : 
                        idx === currentTaskIndex ? 'bg-amber-500/50' : 'bg-transparent'
                    }`} 
                  />
              </div>
          ))}
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
            className="py-6 bg-slate-900 border-2 border-slate-800 text-slate-200 rounded-2xl text-2xl font-black hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-95 shadow-lg"
          >
            FALSE
          </button>
          <button 
            onClick={() => handleAnswer(current.question.isTrue)}
            className="py-6 bg-slate-900 border-2 border-slate-800 text-slate-200 rounded-2xl text-2xl font-black hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-95 shadow-lg"
          >
            TRUE
          </button>
        </div>
      )}

      {current.type === 'TF' && feedback === 'wrong' && (
        <div className="p-5 bg-red-950/30 border border-red-900/50 rounded-2xl animate-in slide-in-from-top-4">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Correct Answer</p>
            <p className="text-xl font-bold text-slate-100">{current.card.back}</p>
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
