import React, { useState, useEffect, useMemo } from 'react';
import { DataStore } from '../store';
import { SetSummary } from '../types';
import { Search, Star, Clock, BookOpen, Trash2, Edit2, Tag } from 'lucide-react';

interface LibraryProps {
  onSelectSet: (id: string) => void;
  onEditSet: (id: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ onSelectSet, onEditSet }) => {
  const [sets, setSets] = useState<SetSummary[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    setSets(DataStore.getSetSummaries());
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    sets.forEach(s => s.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [sets]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this set forever?')) {
      DataStore.deleteSet(id);
      setSets(DataStore.getSetSummaries());
    }
  };

  const toggleFav = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    DataStore.toggleFavorite(id);
    setSets(DataStore.getSetSummaries());
  };

  const filteredSets = sets
    .filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    .filter(s => (filter === 'favorites' ? s.isFavorite : true))
    .filter(s => (selectedTag ? s.tags?.includes(selectedTag) : true))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-8rem)]">
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
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all placeholder:text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-slate-900 rounded-lg w-fit border border-slate-800">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-accent text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All Sets
          </button>
          <button 
            onClick={() => setFilter('favorites')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'favorites' ? 'bg-accent text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Favorites
          </button>
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${!selectedTag ? 'bg-accent-light border-accent/50 text-accent' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
            >
              All Tags
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${selectedTag === tag ? 'bg-accent-light border-accent text-accent shadow-[0_0_15px_rgba(251,198,4,0.1)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
              >
                <Tag size={12} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredSets.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-2xl border-2 border-dashed border-slate-800">
          <div className="flex justify-center mb-4">
            <BookOpen size={48} className="text-slate-700" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">No sets found</h3>
          <p className="text-slate-500">
            {search || selectedTag ? 'Try clearing your search or tag filters.' : 'Create your first flashcard set to start learning!'}
          </p>
          {(search || selectedTag) && (
            <button 
                onClick={() => { setSearch(''); setSelectedTag(null); }}
                className="mt-4 text-accent font-bold hover:underline"
            >
                Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map(set => (
            <div 
              key={set.id}
              onClick={() => onSelectSet(set.id)}
              className="group bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 hover:border-accent hover:shadow-accent/10 hover:shadow-md transition-all cursor-pointer relative flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
                  <Clock size={12} />
                  <span>{new Date(set.updatedAt).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={(e) => toggleFav(e, set.id)}
                  className={`p-1.5 rounded-full transition-colors ${set.isFavorite ? 'text-accent' : 'text-slate-600 hover:text-accent'}`}
                >
                  <Star size={20} fill={set.isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-accent transition-colors">{set.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2 mb-4">{set.description || 'No description provided.'}</p>

              {set.tags && set.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                    {set.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400 rounded-md">
                            {tag}
                        </span>
                    ))}
                    {set.tags.length > 3 && (
                        <span className="text-[10px] text-slate-700 font-black">+ {set.tags.length - 3}</span>
                    )}
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="font-bold text-slate-200">{set.cardCount}</span> cards
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditSet(set.id); }}
                    className="p-2 text-slate-500 hover:text-accent transition-colors"
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
                    className="h-full bg-accent transition-all duration-1000" 
                    style={{ width: `${(set.learnedCount / set.cardCount) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Attribution Footer */}
      <div className="mt-auto pt-12 pb-4 text-center">
        <p className="text-[11px] text-slate-600 font-medium tracking-wide">
          demo AI app by <a href="https://www.starksoft.online/ai-powered-prototyping-service-starksoft" target="_blank" rel="noopener noreferrer" className="text-slate-500 underline decoration-slate-700 hover:text-accent hover:decoration-accent transition-all">StarkSoft</a>
        </p>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};