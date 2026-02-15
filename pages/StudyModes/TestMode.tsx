
import React, { useState, useEffect } from 'react';
import { DataStore } from '../../store';
import { CardEntity, SetSummary } from '../../types';
import { ChevronLeft, FileText, ChevronDown, Check, X, ArrowRight, RotateCcw, Award, Layers } from 'lucide-react';

type TestState = 'setup' | 'running' | 'results';
type QuestionType = 'TF' | 'MCQ' | 'WRITTEN';
type AnswerWith = 'Term' | 'Meaning' | 'Both';

interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  options?: string[]; // For MCQ
  tfTarget?: string; // For TF
  tfIsCorrect?: boolean;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export const TestMode: React.FC<{ setId: string, onExit: () => void }> = ({ setId, onExit }) => {
  const [state, setState] = useState<TestState>('setup');
  const [setSummary, setSetSummary] = useState<SetSummary | null>(null);
  const [allCards, setAllCards] = useState<CardEntity[]>([]);
  
  // Setup config
  const [questionCount, setQuestionCount] = useState(0);
  const [answerWith, setAnswerWith] = useState<AnswerWith>('Both');
  const [groupQuestionTypes, setGroupQuestionTypes] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState<Record<QuestionType, boolean>>({
    TF: true,
    MCQ: true,
    WRITTEN: true,
  });

  // Running state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentInput, setCurrentInput] = useState('');

  useEffect(() => {
    const summary = DataStore.getSetSummaries().find(s => s.id === setId);
    const cards = DataStore.getCards().filter(c => c.setId === setId);
    if (summary) {
      setSetSummary(summary);
      setAllCards(cards);
      // Set the default question count to the total number of cards in the set
      setQuestionCount(cards.length);
    }
  }, [setId]);

  const handleStartTest = () => {
    // Generate questions
    const shuffledCards = [...allCards].sort(() => Math.random() - 0.5);
    const selectedCards = shuffledCards.slice(0, questionCount);
    const activeTypes = (Object.keys(enabledTypes) as QuestionType[]).filter(k => enabledTypes[k]);
    
    if (activeTypes.length === 0) return;

    let generated: Question[] = selectedCards.map((card, i) => {
      const type = activeTypes[i % activeTypes.length];
      
      // Determine what to use as prompt/answer based on "AnswerWith"
      let promptSide: 'front' | 'back';
      if (answerWith === 'Term') promptSide = 'back';
      else if (answerWith === 'Meaning') promptSide = 'front';
      else promptSide = Math.random() > 0.5 ? 'front' : 'back';

      const prompt = promptSide === 'front' ? card.front : card.back;
      const correctAnswer = promptSide === 'front' ? card.back : card.front;

      const q: Question = {
        id: crypto.randomUUID(),
        type,
        prompt,
        correctAnswer,
      };

      if (type === 'TF') {
        const isTrue = Math.random() > 0.5;
        let tfTarget = correctAnswer;
        if (!isTrue && allCards.length > 1) {
          let other;
          do { other = allCards[Math.floor(Math.random() * allCards.length)]; } while (other.id === card.id);
          tfTarget = promptSide === 'front' ? other.back : other.front;
        }
        q.tfTarget = tfTarget;
        q.tfIsCorrect = tfTarget === correctAnswer;
      } else if (type === 'MCQ') {
        const others = allCards.filter(c => c.id !== card.id).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [
          correctAnswer,
          ...others.map(o => promptSide === 'front' ? o.back : o.front)
        ].sort(() => Math.random() - 0.5);
        q.options = options;
      }

      return q;
    });

    if (groupQuestionTypes) {
      // Order: TF -> MCQ -> WRITTEN
      const typeOrder: Record<QuestionType, number> = { 'TF': 0, 'MCQ': 1, 'WRITTEN': 2 };
      generated.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
    } else {
      // Full shuffle
      generated.sort(() => Math.random() - 0.5);
    }

    setQuestions(generated);
    setState('running');
    setCurrentIdx(0);
    setUserAnswers([]);
  };

  const handleNext = (answer: string) => {
    const q = questions[currentIdx];
    let isCorrect = false;

    if (q.type === 'TF') {
        isCorrect = (answer === 'true' && q.tfIsCorrect) || (answer === 'false' && !q.tfIsCorrect);
    } else if (q.type === 'MCQ' || q.type === 'WRITTEN') {
        isCorrect = answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    }

    const newUserAnswers = [...userAnswers, { questionId: q.id, answer, isCorrect }];
    setUserAnswers(newUserAnswers);
    setCurrentInput('');

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setState('results');
    }
  };

  if (!setSummary) return null;

  // -- SETUP VIEW --
  if (state === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in duration-300">
        <div className="flex flex-col gap-1">
          <p className="text-slate-500 text-sm font-medium">{setSummary.title}</p>
          <h2 className="text-4xl font-bold text-slate-100 tracking-tight">Set up your test</h2>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                 <span className="text-lg font-bold text-slate-100">Questions</span>
                 <span className="text-slate-500 text-sm">(max {allCards.length})</span>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center">
                <input 
                  type="number" 
                  min={1} 
                  max={allCards.length}
                  className="bg-transparent px-4 py-3 w-20 text-center font-bold outline-none text-slate-100"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.min(allCards.length, Math.max(1, parseInt(e.target.value) || 1)))}
                />
             </div>
          </div>

          <div className="flex items-center justify-between">
             <span className="text-lg font-bold text-slate-100">Answer with</span>
             <div className="relative">
                <select 
                   className="appearance-none bg-slate-900 border border-slate-800 px-6 py-3 pr-12 rounded-2xl font-bold text-slate-100 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                   value={answerWith}
                   onChange={(e) => setAnswerWith(e.target.value as AnswerWith)}
                >
                    <option value="Term">Term</option>
                    <option value="Meaning">Meaning</option>
                    <option value="Both">Both</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
             </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
               <Layers size={20} className="text-indigo-400" />
               <span className="text-lg font-bold text-slate-100">Group question types</span>
            </div>
            <button 
              onClick={() => setGroupQuestionTypes(!groupQuestionTypes)}
              className={`relative w-14 h-8 rounded-full transition-colors ${groupQuestionTypes ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-800'}`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${groupQuestionTypes ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="h-px bg-slate-900" />

          <div className="space-y-6">
            {(Object.keys(enabledTypes) as QuestionType[]).map((type) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-lg font-medium text-slate-300">
                    {type === 'TF' ? 'True/False' : 
                     type === 'MCQ' ? 'Multiple choice' : 'Written'}
                </span>
                <button 
                  onClick={() => setEnabledTypes(prev => ({ ...prev, [type]: !prev[type] }))}
                  className={`relative w-14 h-8 rounded-full transition-colors ${enabledTypes[type] ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${enabledTypes[type] ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-8">
             <button 
                onClick={handleStartTest}
                disabled={!Object.values(enabledTypes).some(v => v)}
                className="px-10 py-4 bg-indigo-600 text-white font-black text-lg rounded-full hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-900/20 disabled:opacity-50 disabled:grayscale"
             >
                Start test
             </button>
          </div>
        </div>
      </div>
    );
  }

  // -- RUNNING VIEW --
  if (state === 'running') {
    const q = questions[currentIdx];
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between">
           <button onClick={onExit} className="text-slate-500 hover:text-slate-100"><ChevronLeft size={24} /></button>
           <div className="text-sm font-black text-slate-600 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</div>
           <div className="w-6" />
        </div>

        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
           <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-slate-900/40 p-10 md:p-16 rounded-[40px] border border-slate-800 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]">
           <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">
               {q.type === 'TF' ? 'True/False' : q.type === 'MCQ' ? 'Multiple Choice' : 'Written'}
           </p>
           <h3 className="text-4xl md:text-5xl font-bold text-slate-100 leading-tight">{q.prompt}</h3>
           
           {q.type === 'TF' && (
              <div className="pt-4 animate-in fade-in slide-in-from-top-2">
                 <p className="text-xl md:text-2xl text-slate-400 italic">"{q.tfTarget}"</p>
              </div>
           )}

           {q.type === 'WRITTEN' && (
             <div className="w-full pt-8">
               <input 
                  type="text"
                  autoFocus
                  placeholder="Type your answer..."
                  className="w-full bg-transparent border-b-2 border-slate-800 focus:border-indigo-500 text-center text-2xl py-2 outline-none transition-all placeholder:text-slate-800"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && currentInput.trim() && handleNext(currentInput)}
               />
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 gap-4">
           {q.type === 'TF' && (
             <div className="grid grid-cols-2 gap-4 h-24">
                <button 
                  onClick={() => handleNext('false')}
                  className="bg-slate-900 border-2 border-slate-800 text-slate-100 rounded-3xl font-bold text-xl hover:bg-red-950/20 hover:border-red-900 transition-all"
                >
                  False
                </button>
                <button 
                  onClick={() => handleNext('true')}
                  className="bg-slate-900 border-2 border-slate-800 text-slate-100 rounded-3xl font-bold text-xl hover:bg-emerald-950/20 hover:border-emerald-900 transition-all"
                >
                  True
                </button>
             </div>
           )}

           {q.type === 'MCQ' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options?.map(opt => (
                  <button 
                    key={opt}
                    onClick={() => handleNext(opt)}
                    className="p-6 bg-slate-900 border-2 border-slate-800 rounded-3xl text-lg font-bold text-slate-200 text-left hover:border-indigo-500 transition-all"
                  >
                    {opt}
                  </button>
                ))}
             </div>
           )}

           {q.type === 'WRITTEN' && (
              <button 
                disabled={!currentInput.trim()}
                onClick={() => handleNext(currentInput)}
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-bold text-xl shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                 Next <ArrowRight size={24} />
              </button>
           )}
        </div>
      </div>
    );
  }

  // -- RESULTS VIEW --
  const score = userAnswers.filter(a => a.isCorrect).length;
  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-20 animate-in zoom-in duration-500">
      <div className="text-center space-y-6 pt-10">
         <div className="inline-flex p-6 bg-indigo-600/10 rounded-full border border-indigo-500/30 text-indigo-400 mb-4 animate-bounce">
            <Award size={64} />
         </div>
         <h2 className="text-5xl font-black text-slate-100">Test Complete!</h2>
         <p className="text-slate-400 text-xl font-medium">You scored <span className="text-indigo-400 font-black">{percentage}%</span></p>
         
         <div className="flex items-center justify-center gap-12 pt-4">
            <div className="text-center">
               <div className="text-4xl font-black text-emerald-400">{score}</div>
               <div className="text-xs font-black text-slate-600 uppercase tracking-widest mt-1">Correct</div>
            </div>
            <div className="text-center">
               <div className="text-4xl font-black text-red-400">{questions.length - score}</div>
               <div className="text-xs font-black text-slate-600 uppercase tracking-widest mt-1">Incorrect</div>
            </div>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
         <button 
           onClick={() => setState('setup')}
           className="flex-1 py-4 bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-95 transition-all"
         >
           <RotateCcw size={20} /> Retake Test
         </button>
         <button 
           onClick={onExit}
           className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 active:scale-95 transition-all"
         >
           Finish Study
         </button>
      </div>

      {(questions.length - score > 0) && (
        <div className="space-y-6 pt-10">
           <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
              <FileText size={24} className="text-red-400" />
              Review Mistakes
           </h3>
           <div className="space-y-4">
              {questions.map((q, i) => {
                const answer = userAnswers.find(a => a.questionId === q.id);
                if (answer?.isCorrect) return null;
                return (
                  <div key={q.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                     <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Question {i + 1}</span>
                        <div className="p-1.5 bg-red-950/30 rounded-full text-red-500"><X size={16} /></div>
                     </div>
                     <p className="text-xl font-bold text-slate-100">{q.prompt}</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Answer</p>
                           <p className="text-red-400 font-bold">{answer?.answer || '(skipped)'}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Correct Answer</p>
                           <p className="text-emerald-400 font-bold">{q.correctAnswer}</p>
                        </div>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}
    </div>
  );
};
