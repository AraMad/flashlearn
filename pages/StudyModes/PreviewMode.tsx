import React, { useState, useEffect } from 'react';
import { DataStore } from '../../store';
import { CardEntity, SetSummary } from '../../types';
import { ChevronLeft } from 'lucide-react';
import { trackEvent } from '../../analytics';

interface PreviewModeProps {
  setId: string;
  onExit: () => void;
}

export const PreviewMode: React.FC<PreviewModeProps> = ({ setId, onExit }) => {
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [setSummary, setSetSummary] = useState<SetSummary | null>(null);

  useEffect(() => {
    const fetchedCards = DataStore.getCards().filter(c => c.setId === setId);
    const summary = DataStore.getSetSummaries().find(s => s.id === setId);
    setCards(fetchedCards.sort((a, b) => a.orderIndex - b.orderIndex));
    setSetSummary(summary || null);
    trackEvent('preview_mode_opened', { set_id: setId });
  }, [setId]);

  if (!setSummary || cards.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in slide-in-from-bottom-8 duration-500">
      <div className="sticky top-0 z-10 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800 pb-4 mb-8 pt-4 -mt-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="p-3 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
              Set Content
            </h2>
            <p className="text-sm text-slate-400">{setSummary.title} • {cards.length} terms</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {cards.map((card, index) => (
          <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm hover:border-slate-700 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-1">Term • {index + 1}</span>
                <p className="text-lg font-bold text-slate-100">{card.front}</p>
              </div>
              <div className="relative">
                <div className="hidden md:block absolute -left-3 top-0 bottom-0 w-px bg-slate-800" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-1">Definition</span>
                <p className="text-lg font-bold text-slate-100">{card.back}</p>
                {card.example && (
                  <p className="text-sm text-slate-400 italic mt-2">"{card.example}"</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
