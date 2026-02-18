import React, { useState, useEffect, useMemo } from 'react';
import { DataStore } from '../store';
import { SetSummary, LearnMode } from '../types';
import { ChevronLeft, Play, LayoutGrid, Gamepad2, Edit3, BookOpen, ClipboardCheck, Tag as TagIcon, Plus, X, RotateCcw, Check, HelpCircle, AlertCircle } from 'lucide-react';

interface SetDetailsProps {
  setId: string;
  onBack: () => void;
  onStartStudy: (id: string, mode: LearnMode) => void;
  onEdit: () => void;
}

export const SetDetails: React.FC<SetDetailsProps> = ({ setId, onBack, onStartStudy, onEdit }) => {
  const [set, setSet] = useState<SetSummary | null>(null);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [allExistingTags, setAllExistingTags] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Modal state for Random Set config
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedTagsForRandom, setSelectedTagsForRandom] = useState<string[]>([]);
  const [randomWordCount, setRandomWordCount] = useState(20);

  useEffect(() => {
    refreshSet();
    setAllExistingTags(DataStore.getAllTags());
  }, [setId]);

  const refreshSet = () => {
    const summary = DataStore.getSetSummaries().find(s => s.id === setId);
    if (summary) {
      setSet(summary);
      if (summary.isRandomSet) {
        setSelectedTagsForRandom(summary.sourceTags || []);
        setRandomWordCount(summary.sourceCount || 20);
      }
    }
  };

  const handleOpenConfig = () => {
    setIsConfigModalOpen(true);
  };

  // Calculate available cards for regeneration
  const availableCardsCount = useMemo(() => {
    const allSets = DataStore.getSets();
    const sourceSets = allSets.filter(s => {
      if (s.isRandomSet) return false;
      if (selectedTagsForRandom.length === 0) return true;
      const hasNoTags = !s.tags || s.tags.length === 0;
      if (hasNoTags && selectedTagsForRandom.includes('no-tag')) return true;
      return s.tags.some(t => selectedTagsForRandom.includes(t));
    });
    return sourceSets.reduce((sum, s) => sum + (s as any).cardCount || 0, 0); 
    // Note: DataStore.getSets returns SetEntity[], which doesn't have cardCount. 
    // We need to fetch count specifically or use summaries.
  }, [selectedTagsForRandom]);

  // Refined available count using summaries
  const availableCountFromSummaries = useMemo(() => {
    const summaries = DataStore.getSetSummaries();
    const sourceSets = summaries.filter(s => {
      if (s.isRandomSet) return false;
      if (selectedTagsForRandom.length === 0) return true;
      const hasNoTags = !s.tags || s.tags.length === 0;
      if (hasNoTags && selectedTagsForRandom.includes('no-tag')) return true;
      return s.tags.some(t => selectedTagsForRandom.includes(t));
    });
    return sourceSets.reduce((sum, s) => sum + s.cardCount, 0);
  }, [selectedTagsForRandom]);

  const sliderMax = useMemo(() => Math.min(50, availableCountFromSummaries), [availableCountFromSummaries]);
  const sliderMin = useMemo(() => Math.min(5, availableCountFromSummaries), [availableCountFromSummaries]);

  useEffect(() => {
    if (randomWordCount > sliderMax) {
      setRandomWordCount(sliderMax);
    } else if (randomWordCount < sliderMin && availableCountFromSummaries > 0) {
      setRandomWordCount(sliderMin);
    }
  }, [sliderMax, sliderMin, availableCountFromSummaries]);

  const handleRegenerate = () => {
    if (!set || !set.isRandomSet) return;
    setIsRegenerating(true);
    setIsConfigModalOpen(false);
    
    setTimeout(() => {
      DataStore.regenerateRandomSet(setId, selectedTagsForRandom, randomWordCount);
      refreshSet();
      setIsRegenerating(false);
    }, 600);
  };

  const handleAddTag = (tagToAdd: string) => {
    if (!tagToAdd.trim() || !set) return;
    
    const tag = tagToAdd.trim();
    if (set.tags.includes(tag)) {
        setNewTag('');
        setIsAddingTag(false);
        return;
    }

    const updatedTags = [...set.tags, tag];
    DataStore.updateSetTags(setId, updatedTags);
    setNewTag('');
    setIsAddingTag(false);
    refreshSet();
    setAllExistingTags(DataStore.getAllTags());
  };

  const removeTag = (tag: string) => {
    if (!set) return;
    const updatedTags = set.tags.filter(t => t !== tag);
    DataStore.updateSetTags(setId, updatedTags);
    refreshSet();
  };

  const tagSuggestions = useMemo(() => {
    if (!newTag.trim()) return [];
    return allExistingTags.filter(t => 
      t.toLowerCase().includes(newTag.toLowerCase()) && 
      !set?.tags.includes(t)
    ).slice(0, 5);
  }, [newTag, allExistingTags, set]);

  const allTagsForRandom = useMemo(() => {
    const sets = DataStore.getSets();
    const tags = new Set<string>();
    sets.filter(s => !s.isRandomSet).forEach(s => s.tags?.forEach(t => tags.add(t)));
    const list = Array.from(tags).sort();
    
    const hasSetsWithoutTags = sets.some(s => !s.isRandomSet && (!s.tags || s.tags.length === 0));
    if (hasSetsWithoutTags) {
      list.push('no-tag');
    }
    return list;
  }, []);

  const toggleTagSelection = (tag: string) => {
    setSelectedTagsForRandom(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (!set) return null;

  const modes: { id: LearnMode, label: string, icon: React.ReactNode, desc: string, minCards: number, color: string }[] = [
    { id: 'REVIEW', label: 'Flashcards', icon: <LayoutGrid size={24} />, desc: 'Swipe to review terms.', minCards: 1, color: 'bg-emerald-500 hover:bg-emerald-600' },
    { id: 'LEARN', label: 'Learn', icon: <BookOpen size={24} />, desc: 'Master cards with mixed tasks.', minCards: 4, color: 'bg-indigo-500 hover:bg-indigo-600' },
    { id: 'MATCH', label: 'Match', icon: <Gamepad2 size={24} />, desc: 'Competitive matching game.', minCards: 3, color: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'TEST', label: 'Test', icon: <ClipboardCheck size={24} />, desc: 'Check your knowledge officially.', minCards: 4, color: 'bg-blue-500 hover:bg-blue-600' },
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
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
              {set.title}
          </h2>
          {set.isRandomSet && <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-0.5">Automated Shuffle</p>}
        </div>
        
        <div className="ml-auto flex gap-2">
            {set.isRandomSet ? (
                <button 
                    onClick={handleOpenConfig}
                    disabled={isRegenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-900/20 active:scale-95 disabled:opacity-50"
                >
                    <RotateCcw size={20} className={isRegenerating ? "animate-spin" : ""} />
                    <span className="hidden sm:inline">Regenerate</span>
                </button>
            ) : (
                <button 
                    onClick={onEdit}
                    className="flex items-center gap-2 px-4 py-2 text-accent font-semibold hover:bg-accent-light rounded-xl transition-all border border-transparent hover:border-accent/40"
                >
                    <Edit3 size={20} />
                    <span className="hidden sm:inline">Edit Set</span>
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Study Progress</h3>
            <div className="flex items-end justify-between mb-2">
               <span className="text-4xl font-black text-slate-100">{set.learnedCount} <span className="text-slate-500 text-lg font-normal">/ {set.cardCount} learned</span></span>
               <span className="text-accent font-bold">{set.cardCount ? Math.round((set.learnedCount / set.cardCount) * 100) : 0}%</span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 shadow-[0_0_8px_rgba(251,198,4,0.3)] ${set.isRandomSet ? 'bg-amber-500' : 'bg-accent'}`} 
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
                    : `bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-xl active:scale-[0.98]`
                  }`}
                >
                  <div className={`p-4 rounded-2xl transition-all flex items-center justify-center text-white ${disabled ? 'bg-slate-700' : mode.color}`}>
                    {mode.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-100 text-xl">{mode.label}</h4>
                    <p className="text-sm text-slate-400">{disabled ? `Need ${mode.minCards} cards` : mode.desc}</p>
                  </div>
                  {!disabled && <Play size={24} className="text-slate-700 group-hover:text-slate-400 transition-colors" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Tags</h3>
             <div className="flex flex-wrap gap-2 mb-4">
                {set.tags?.map(tag => (
                  <span key={tag} className={`group/tag flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-bold transition-all ${set.isRandomSet ? 'text-amber-500 border-amber-500/20' : 'text-slate-300 hover:border-accent/50'}`}>
                    <TagIcon size={12} className={set.isRandomSet ? 'text-amber-500' : 'text-accent'} />
                    {tag}
                    {!set.isRandomSet && (
                        <button 
                        onClick={() => removeTag(tag)}
                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover/tag:opacity-100 transition-all"
                        >
                        <X size={12} />
                        </button>
                    )}
                  </span>
                ))}
                
                {!set.isRandomSet && (
                    <div className="relative flex-1 min-w-[120px]">
                    {isAddingTag ? (
                        <div className="relative">
                        <form onSubmit={(e) => { e.preventDefault(); handleAddTag(newTag); }}>
                            <input 
                            autoFocus
                            type="text"
                            className="w-full bg-slate-950 border border-accent rounded-full px-3 py-1 text-xs font-bold text-slate-100 outline-none"
                            placeholder="Tag name..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onBlur={() => {
                                setTimeout(() => {
                                    if (!newTag) setIsAddingTag(false);
                                }, 200);
                            }}
                            />
                        </form>
                        {tagSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                            {tagSuggestions.map(suggestion => (
                                <button
                                key={suggestion}
                                onClick={() => handleAddTag(suggestion)}
                                className="w-full px-3 py-2 text-left text-xs font-bold text-slate-400 hover:bg-accent hover:text-slate-950 transition-colors border-b border-slate-800 last:border-0"
                                >
                                {suggestion}
                                </button>
                            ))}
                            </div>
                        )}
                        </div>
                    ) : (
                        <button 
                        onClick={() => setIsAddingTag(true)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-bold hover:bg-slate-700 hover:text-slate-200 transition-all"
                        >
                        <Plus size={12} />
                        Add Tag
                        </button>
                    )}
                    </div>
                )}
             </div>

             <div className="h-px bg-slate-800 my-6" />

             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">About this set</h3>
             <p className="text-slate-400 leading-relaxed italic">
               {set.description || 'No description provided.'}
             </p>
             <div className="mt-6 pt-6 border-t border-slate-800 text-xs text-slate-500 space-y-2">
               <p>Created: {new Date(set.createdAt).toLocaleDateString()}</p>
               <p>Last Modified: {new Date(set.updatedAt).toLocaleDateString()}</p>
               {set.isRandomSet && (
                   <p className="text-amber-500/60 font-black uppercase tracking-tighter">🔒 Not included in backups</p>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Random Set Configuration Modal (Regeneration) */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <h4 className="text-xl font-bold text-slate-100">Configure Random Set</h4>
              </div>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-slate-500 hover:text-slate-100">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-400 leading-relaxed">
                Select categories to include in your shuffle.
              </p>
              
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                {allTagsForRandom.map(tag => {
                  const isSelected = selectedTagsForRandom.includes(tag);
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
                      {isSelected ? <Check size={14} /> : (tag === 'no-tag' ? <HelpCircle size={14} /> : <TagIcon size={14} />)}
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
                  disabled={availableCountFromSummaries === 0}
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
                  {availableCountFromSummaries === 0 
                    ? "No cards available in this selection."
                    : `Total ${availableCountFromSummaries} cards available in this selection.`}
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-950 flex justify-end gap-3">
              <button onClick={() => setIsConfigModalOpen(false)} className="px-6 py-2 font-bold text-slate-400 hover:text-slate-200">Cancel</button>
              <button 
                onClick={handleRegenerate}
                disabled={availableCountFromSummaries === 0}
                className="px-8 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-900/20 disabled:opacity-30 disabled:grayscale"
              >
                Update & Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};