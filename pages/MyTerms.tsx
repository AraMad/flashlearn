import React, { useState, useEffect } from 'react';
import { DataStore } from '../store';
import { CardEntity } from '../types';
import { Search, BookOpen } from 'lucide-react';

export const MyTerms: React.FC = () => {
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load all cards from all sets
    const allCards = DataStore.getCards();
    setCards(allCards);
  }, []);

  const filteredCards = cards.filter(card => 
    card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.back.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h2 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
          <BookOpen className="text-amber-500" size={32} />
          My Terms
        </h2>
        <p className="text-slate-400 font-medium">
          Dictionary of all your terms and definitions across all sets.
        </p>
      </header>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-slate-500 group-focus-within:text-amber-500 transition-colors" size={20} />
        </div>
        <input
          type="text"
          placeholder="Search terms or definitions..."
          className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredCards.length > 0 ? (
          filteredCards.map(card => (
            <div key={card.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all group">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Term</p>
                  <p className="text-lg font-bold text-slate-200 group-hover:text-amber-500 transition-colors">{card.front}</p>
                </div>
                <div className="hidden md:block w-px bg-slate-800 self-stretch mx-4"></div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Definition</p>
                  <p className="text-lg text-slate-400">{card.back}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800/50 border-dashed">
            <p className="text-slate-500 font-medium">No terms found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
