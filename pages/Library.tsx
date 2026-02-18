import React, { useState, useEffect, useMemo } from 'react';
import { DataStore } from '../store';
import { SetSummary } from '../types';
import { Search, Star, Clock, BookOpen, Trash2, Edit2, Tag, Database, AlertCircle, ArrowRight, Shuffle, X, Check, HelpCircle } from 'lucide-react';

interface LibraryProps {
  onSelectSet: (id: string) => void;
  onEditSet: (id: string) => void;
  onNavigateSettings: () => void;
}

export const Library: React.FC<LibraryProps> = ({ onSelectSet, onEditSet, onNavigateSettings }) => {
  const [sets, setSets] = useState<SetSummary[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTagsForMagic, setSelectedTagsForMagic] = useState<string[]>([]);
  const [randomWordCount, setRandomWordCount] = useState(20);

  useEffect(() => {
    setSets(DataStore.getSetSummaries());
    setShowBackupReminder(DataStore.shouldShowBackupReminder());
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    // Tags from normal sets only
    sets.filter(s => !s.isRandomSet).forEach(s => s.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [sets]);

  const allTagsForMagic = useMemo(() => {
    const list = [...allTags];
    const hasSetsWithoutTags = sets.some(s => !s.isRandomSet && (!s.tags || s.tags.length === 0));
    if (hasSetsWithoutTags) {
      list.push('no-tag');
    }
    return list;
  }, [allTags, sets]);

  const existingRandomSet = useMemo(() => sets.find(s => s.isRandomSet), [sets]);

  // Calculate available cards based on selection
  const availableCardsCount = useMemo(() => {
    const sourceSets = sets.filter(s => {
      if (s.isRandomSet) return false;
      if (selectedTagsForMagic.length === 0) return true;
      const hasNoTags = !s.tags || s.tags.length === 0;
      if (hasNoTags && selectedTagsForMagic.includes('no-tag')) return true;
      return s.tags.some(t => selectedTagsForMagic.includes(t));
    });
    return sourceSets.reduce((sum, s) => sum + s.cardCount, 0);
  }, [sets, selectedTagsForMagic]);

  const sliderMax = useMemo(() => Math.min(50, availableCardsCount), [availableCardsCount]);
  const sliderMin = useMemo(() => Math.min(5, availableCardsCount), [availableCardsCount]);

  // Adjust count if it exceeds available max
  useEffect(() => {
    if (randomWordCount > sliderMax) {
      setRandomWordCount(sliderMax);
    } else if (randomWordCount < sliderMin && availableCardsCount > 0) {
      setRandomWordCount(sliderMin);
    }
  }, [sliderMax, sliderMin, availableCardsCount]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this set forever?')) {
      DataStore.deleteSet(id);
      setSets(DataStore.getSetSummaries());
      setShowBackupReminder(DataStore.shouldShowBackupReminder());
    }
  };

  const toggleFav = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    DataStore.toggleFavorite(id);
    setSets(DataStore.getSetSummaries());
    setShowBackupReminder(DataStore.shouldShowBackupReminder());
  };

  const handleMagicButtonClick = () => {
    if (existingRandomSet) {
      onSelectSet(existingRandomSet.id);
    } else {
      if (sets.filter(s => !s.isRandomSet).length === 0) {
        alert("Create some sets first to use the Random Set feature!");
        return;
      }
      setSelectedTagsForMagic(allTagsForMagic); // Default select all
      setIsTagModalOpen(true);
    }
  };

  const handleCreateMagicSet = () => {
    const newId = DataStore.createRandomSet(selectedTagsForMagic, randomWordCount);
    if (newId) {
      setSets(DataStore.getSetSummaries());
      setIsTagModalOpen(false);
      onSelectSet(newId);
    } else {
      alert("No cards found for the current selection.");
    }
  };

  const toggleTagSelection = (tag: string) => {
    setSelectedTagsForMagic(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredSets = sets
    .filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    .filter(s => (filter === 'favorites' ? s.isFavorite : true))
    .filter(s => (selectedTag ? s.tags?.includes(selectedTag) : true))
    .sort((a, b) => {
        if (a.isRandomSet) return -1;
        if (b.isRandomSet) return 1;
        return b.updatedAt - a.updatedAt;
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Your Library</h2>
          <p className="text-slate-400 mt-1">Manage and track your learning progress.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={handleMagicButtonClick}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
                existingRandomSet 
                ? 'bg-slate-900 text-amber-500 border border-amber-500/30' 
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:shadow-amber-500/20'
            }`}
          >
            <Shuffle size={20} />
            {existingRandomSet ? 'Open Random Set' : 'Generate Random Set'}
          </button>
          
          <div className="relative flex-1 md:w-80">
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

      {showBackupReminder && (
        <div 
          onClick={onNavigateSettings}
          className="group bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-accent/40 transition-all animate-in slide-in-from-top-4 duration-500"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-accent/20 rounded-xl text-accent">
              <Database size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Time to back up your progress!
                <AlertCircle size={14} className="text-accent animate-pulse" />
              </p>
              <p className="text-xs text-slate-500 mt-0.5">You have unsaved changes since your last backup (7+ days ago).</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            Secure now <ArrowRight size={14} />
          </div>
        </div>
      )}

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
              className={`group bg-slate-900 p-6 rounded-2xl shadow-sm border transition-all cursor-pointer relative flex flex-col ${
                  set.isRandomSet 
                  ? 'border-amber-500/50 shadow-amber-500/5 hover:border-amber-500 hover:shadow-amber-500/20' 
                  : 'border-slate-800 hover:border-accent hover:shadow-accent/10 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
                  {set.isRandomSet ? <Shuffle size={12} /> : <Clock size={12} />}
                  <span>{set.isRandomSet ? 'Random Session' : new Date(set.updatedAt).toLocaleDateString()}</span>
                </div>
                {!set.isRandomSet && (
                    <button 
                    onClick={(e) => toggleFav(e, set.id)}
                    className={`p-1.5 rounded-full transition-colors ${set.isFavorite ? 'text-accent' : 'text-slate-600 hover:text-accent'}`}
                    >
                    <Star size={20} fill={set.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                )}
                {set.isRandomSet && (
                    <div className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded uppercase tracking-widest">
                        Random
                    </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-accent transition-colors">{set.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2 mb-4">{set.description || 'No description provided.'}</p>

              {set.tags && set.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                    {set.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={`px-2 py-0.5 border text-[10px] font-bold rounded-md ${set.isRandomSet ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
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
                   {!set.isRandomSet && (
                       <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditSet(set.id); }}
                        className="p-2 text-slate-500 hover:text-accent transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                   )}
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
                    className={`h-full transition-all duration-1000 ${set.isRandomSet ? 'bg-amber-500' : 'bg-accent'}`}
                    style={{ width: `${(set.learnedCount / set.cardCount) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tag Selection Modal */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <h4 className="text-xl font-bold text-slate-100">Configure Random Set</h4>
              </div>
              <button onClick={() => setIsTagModalOpen(false)} className="text-slate-500 hover:text-slate-100">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-400 leading-relaxed">
                Select categories to include in your shuffle.
              </p>
              
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                {allTagsForMagic.map(tag => {
                  const isSelected = selectedTagsForMagic.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTagSelection(tag)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                        isSelected 
                        ? 'bg-amber-500 border-amber-500 text-slate-950' 
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? <Check size={14} /> : (tag === 'no-tag' ? <HelpCircle size={14} /> : <Tag size={14} />)}
                      {tag === 'no-tag' ? 'No Tags' : tag}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-200">Words count</label>
                  <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-amber-500 font-bold text-sm">{randomWordCount}</span>
                </div>
                <input 
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step="1"
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-30"
                  value={randomWordCount}
                  disabled={availableCardsCount === 0}
                  onChange={(e) => setRandomWordCount(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  <span>Min: {sliderMin}</span>
                  <span>Max: {sliderMax}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                    <AlertCircle size={16} />
                </div>
                <p className="text-xs text-slate-500 italic leading-relaxed">
                  {availableCardsCount === 0 
                    ? "No cards available in this selection."
                    : `Total ${availableCardsCount} cards available in this selection.`}
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-950 flex justify-end gap-3">
              <button onClick={() => setIsTagModalOpen(false)} className="px-6 py-2 font-bold text-slate-400 hover:text-slate-200">Cancel</button>
              <button 
                onClick={handleCreateMagicSet}
                disabled={availableCardsCount === 0}
                className="px-8 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-900/20 disabled:opacity-30 disabled:grayscale"
              >
                {selectedTagsForMagic.length === 0 ? 'Shuffle All Sets' : 'Create Random Set'}
              </button>
            </div>
          </div>
        </div>
      )}

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