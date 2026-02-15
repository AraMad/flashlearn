
import React, { useState, useEffect } from 'react';
import { DataStore } from '../store';
import { SetSummary, LearnMode } from '../types';
import { ChevronLeft, Play, LayoutGrid, Gamepad2, Edit3, BookOpen, ClipboardCheck } from 'lucide-react';

interface SetDetailsProps {
  setId: string;
  onBack: () => void;
  onStartStudy: (id: string, mode: LearnMode) => void;
  onEdit: () => void;
}

export const SetDetails: React.FC<SetDetailsProps> = ({ setId, onBack, onStartStudy, onEdit }) => {
  const [set, setSet] = useState<SetSummary | null>(null);

  useEffect(() => {
    const summary = DataStore.getSetSummaries().find(s => s.id === setId);
    if (summary) setSet(summary);
  }, [setId]);

  if (!set) return null;

  const modes: { id: LearnMode, label: string, icon: React.ReactNode, desc: string, minCards: number, color: string }[] = [
    { id: 'LEARN', label: 'Learn', icon: <BookOpen size={24} />, desc: 'Master cards with mixed tasks.', minCards: 4, color: 'bg-indigo-600 hover:bg-indigo-700' },
    { id: 'REVIEW', label: 'Flashcards', icon: <LayoutGrid size={24} />, desc: 'Swipe to review terms.', minCards: 1, color: 'bg-emerald-600 hover:bg-emerald-700' },
    { id: 'MATCH', label: 'Match', icon: <Gamepad2 size={24} />, desc: 'Competitive matching game.', minCards: 3, color: 'bg-amber-600 hover:bg-amber-700' },
    { id: 'TEST', label: 'Test', icon: <ClipboardCheck size={24} />, desc: 'Check your knowledge officially.', minCards: 4, color: 'bg-blue-600 hover:bg-blue-700' },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-900 rounded-full transition-colors text-slate-400"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-bold text-slate-100">{set.title}</h2>
        <button 
          onClick={onEdit}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-indigo-400 font-semibold hover:bg-indigo-950/30 rounded-xl transition-all border border-transparent hover:border-indigo-800"
        >
          <Edit3 size={20} />
          <span>Edit Set</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Study Progress</h3>
            <div className="flex items-end justify-between mb-2">
               <span className="text-4xl font-black text-slate-100">{set.learnedCount} <span className="text-slate-500 text-lg font-normal">/ {set.cardCount} learned</span></span>
               <span className="text-indigo-400 font-bold">{set.cardCount ? Math.round((set.learnedCount / set.cardCount) * 100) : 0}%</span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                 style={{ width: `${(set.learnedCount / set.cardCount) * 100}%` }}
               />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4">
            {modes.map(mode => {
              const disabled = set.cardCount < mode.minCards;
              return (
                <button
                  key={mode.id}
                  disabled={disabled}
                  onClick={() => onStartStudy(setId, mode.id)}
                  className={`group flex items-center gap-6 p-6 rounded-2xl border transition-all text-left ${
                    disabled 
                    ? 'opacity-40 grayscale cursor-not-allowed border-slate-800 bg-slate-900/50' 
                    : `bg-slate-900 border-slate-800 hover:border-indigo-500 hover:shadow-xl active:scale-[0.98]`
                  }`}
                >
                  <div className={`p-4 rounded-2xl text-white transition-all ${disabled ? 'bg-slate-700' : mode.color}`}>
                    {mode.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-100 text-xl">{mode.label}</h4>
                    <p className="text-sm text-slate-400">{disabled ? `Need ${mode.minCards} cards` : mode.desc}</p>
                  </div>
                  {!disabled && <Play size={24} className="text-slate-700 group-hover:text-indigo-500 transition-colors" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">About this set</h3>
             <p className="text-slate-400 leading-relaxed italic">
               {set.description || 'No description provided.'}
             </p>
             <div className="mt-6 pt-6 border-t border-slate-800 text-xs text-slate-500 space-y-2">
               <p>Created: {new Date(set.createdAt).toLocaleDateString()}</p>
               <p>Last Modified: {new Date(set.updatedAt).toLocaleDateString()}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
