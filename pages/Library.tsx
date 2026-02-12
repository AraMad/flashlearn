
import React, { useState, useEffect } from 'react';
import { DataStore } from '../store';
import { SetSummary } from '../types';
import { Search, Star, Clock, BookOpen, Trash2, Edit2 } from 'lucide-react';

interface LibraryProps {
  onSelectSet: (id: string) => void;
  onEditSet: (id: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ onSelectSet, onEditSet }) => {
  const [sets, setSets] = useState<SetSummary[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    setSets(DataStore.getSetSummaries());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this set forever?')) {
      DataStore.deleteSet(id);
      setSets(DataStore.getSetSummaries());
    }
  };

  const toggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    DataStore.toggleFavorite(id);
    setSets(DataStore.getSetSummaries());
  };

  const filteredSets = sets
    .filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    .filter(s => (filter === 'favorites' ? s.isFavorite : true))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Your Library</h2>
          <p className="text-slate-400 mt-1">Manage and track your learning progress.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search your sets..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-900 rounded-lg w-fit border border-slate-800">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
        >
          All Sets
        </button>
        <button 
          onClick={() => setFilter('favorites')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'favorites' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Favorites
        </button>
      </div>

      {filteredSets.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-2xl border-2 border-dashed border-slate-800">
          <div className="flex justify-center mb-4">
            <BookOpen size={48} className="text-slate-700" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">No sets found</h3>
          <p className="text-slate-500">Create your first flashcard set to start learning!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map(set => (
            <div 
              key={set.id}
              onClick={() => onSelectSet(set.id)}
              className="group bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 hover:border-indigo-500 hover:shadow-indigo-900/10 hover:shadow-md transition-all cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  <Clock size={12} />
                  <span>{new Date(set.updatedAt).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={(e) => toggleFav(e, set.id)}
                  className={`p-1.5 rounded-full transition-colors ${set.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}
                >
                  <Star size={20} fill={set.isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors">{set.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2 mb-6">{set.description || 'No description provided.'}</p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="font-bold text-slate-200">{set.cardCount}</span> cards
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); onEditSet(set.id); }}
                    className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, set.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {set.cardCount > 0 && (
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 rounded-t-2xl overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ width: `${(set.learnedCount / set.cardCount) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
