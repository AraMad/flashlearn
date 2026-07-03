import React, { useState, useEffect, useMemo } from 'react';
import { DataStore } from '../store';
import { Plus, Trash2, X, FileText, LayoutList, Tag, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { trackEvent } from '../analytics';

interface SetEditorProps {
  setId?: string;
  onCancel: () => void;
  onSave: (id: string) => void;
}

const MAX_CARDS = 50;

export const SetEditor: React.FC<SetEditorProps> = ({ setId, onCancel, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<{ front: string, back: string, example?: string }[]>([{ front: '', back: '', example: '' }]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allExistingTags, setAllExistingTags] = useState<string[]>([]);
  const [isBulkImport, setIsBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isBulkExpanded, setIsBulkExpanded] = useState(false);

  useEffect(() => {
    setAllExistingTags(DataStore.getAllTags());
    if (setId) {
      const allSets = DataStore.getSets();
      const set = allSets.find(s => s.id === setId);
      if (set) {
        setTitle(set.title);
        setDescription(set.description || '');
        setTags(set.tags || []);
        const existingCards = DataStore.getCards().filter(c => c.setId === setId).sort((a, b) => a.orderIndex - b.orderIndex);
        const mapped = existingCards.map(c => ({ front: c.front, back: c.back, example: c.example || '' }));
        setCards(mapped.length > 0 ? mapped : [{ front: '', back: '', example: '' }]);
      }
    }
  }, [setId]);

  const addCard = () => {
    if (cards.length < MAX_CARDS) {
      setCards([...cards, { front: '', back: '', example: '' }]);
    }
  };

  const updateCard = (index: number, field: 'front' | 'back' | 'example', value: string) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    setCards(newCards);
  };

  const removeCard = (index: number) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, i) => i !== index));
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const tag = tagToAdd.trim();
    if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
        setTagInput('');
        trackEvent('tag_added');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    return allExistingTags.filter(t => 
      t.toLowerCase().includes(tagInput.toLowerCase()) && 
      !tags.includes(t)
    ).slice(0, 5);
  }, [tagInput, allExistingTags, tags]);

  const handleSave = () => {
    if (!title.trim()) return;
    const validCards = cards.filter(c => c.front.trim() && c.back.trim());
    if (validCards.length === 0) return;

    let finalId = setId;
    if (setId) {
        const oldSet = DataStore.getSetSummaries().find(s => s.id === setId);
        const wordCountChange = oldSet ? validCards.length - oldSet.cardCount : 0;
        finalId = DataStore.updateSet(setId, title, description, validCards, tags);
        trackEvent('set_updated', { set_id: finalId, word_count_change: wordCountChange });
    } else {
        finalId = DataStore.addSet(title, description, validCards, tags);
        trackEvent('set_created', { set_id: finalId, word_count: validCards.length, source_type: 'manual' });
    }
    onSave(finalId!);
  };

  const handleBulkImport = () => {
    const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
    const newParsedCards: {front: string, back: string, example?: string}[] = [];
    
    lines.forEach(line => {
      let delimiter = '-';
      if (line.includes(';')) delimiter = ';';
      else if (line.includes(',')) delimiter = ',';
      
      const parts = line.split(delimiter);
      if (parts.length >= 2) {
        newParsedCards.push({
          front: parts[0].trim(),
          back: parts[1].trim(),
          example: parts.length > 2 ? parts.slice(2).join(delimiter).trim() : ''
        });
      }
    });

    if (newParsedCards.length > 0) {
      const existingCardsWithContent = cards.filter(c => c.front.trim() || c.back.trim());
      const remainingSlots = MAX_CARDS - existingCardsWithContent.length;
      
      if (remainingSlots <= 0) {
        alert(`Set limit of ${MAX_CARDS} cards reached. Cannot add more.`);
        setIsBulkImport(false);
        setBulkText('');
        return;
      }

      const cardsToAdd = newParsedCards.slice(0, remainingSlots);
      setCards([...existingCardsWithContent, ...cardsToAdd]);
      
      if (cardsToAdd.length < newParsedCards.length) {
        alert(`Limit reached. Added ${cardsToAdd.length} cards out of ${newParsedCards.length} provided.`);
      }

      trackEvent('bulk_import_used', { word_count: cardsToAdd.length, file_format: 'text' });
      setIsBulkImport(false);
      setBulkText('');
    }
  };

  const isSaveDisabled = !title.trim() || cards.filter(c => c.front.trim() && c.back.trim()).length === 0;
  const isLimitReached = cards.length >= MAX_CARDS;

  return (
    <div className="space-y-8 pb-20 animate-in slide-in-from-bottom duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-slate-100">{setId ? 'Edit Set' : 'Create a New Set'}</h2>
        <div className="flex gap-2">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-900 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`px-8 py-2 rounded-xl font-bold transition-all shadow-lg ${
              isSaveDisabled 
              ? 'bg-slate-900 text-slate-600 cursor-not-allowed shadow-none border border-slate-800' 
              : 'bg-accent text-slate-950 hover:bg-accent-hover active:scale-95 shadow-accent/20'
            }`}
          >
            Save
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-800 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-400">Set Title</label>
          <input 
            type="text" 
            placeholder='e.g., "Intro to Spanish", "Chem 101 Finals"'
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all text-slate-100 placeholder:text-slate-700"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-400">Description (Optional)</label>
          <textarea 
            rows={2}
            placeholder="Add a brief description..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all text-slate-100 placeholder:text-slate-700"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-400">Tags (Optional)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 text-accent rounded-full text-xs font-bold">
                <Tag size={12} />
                {tag}
                <button onClick={() => removeTag(tag)} className="text-slate-600 hover:text-red-400"><X size={12} /></button>
              </span>
            ))}
          </div>
          <div className="relative">
            <form onSubmit={(e) => { e.preventDefault(); handleAddTag(tagInput); }} className="flex gap-2">
              <input 
                type="text"
                placeholder="Add a tag..."
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all text-slate-100 placeholder:text-slate-700"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
              >
                Add
              </button>
            </form>
            {tagSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {tagSuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleAddTag(suggestion)}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-slate-400 hover:bg-accent hover:text-slate-950 transition-colors border-b border-slate-800 last:border-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 xl:grid-cols-[3fr_2fr] gap-8">
        <div className="order-2 lg:order-1">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <LayoutList size={24} className="text-accent" />
              Flashcards ({cards.length}/{MAX_CARDS})
            </h3>
            {isLimitReached && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/20 border border-red-900/50 rounded-full text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                <AlertCircle size={12} />
                Limit Reached
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {cards.map((card, index) => (
              <div key={index} className="group relative bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm hover:border-accent/60 transition-all flex flex-col md:flex-row gap-6">
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 bg-slate-800 text-slate-400 font-bold w-8 h-8 flex items-center justify-center rounded-full text-xs border border-slate-700">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Front</label>
                  <input 
                    type="text" 
                    placeholder="Term"
                    className="w-full bg-transparent border-b border-slate-800 focus:border-accent outline-none py-1 transition-all text-slate-100"
                    value={card.front}
                    onChange={(e) => updateCard(index, 'front', e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Back</label>
                  <input 
                    type="text" 
                    placeholder="Definition"
                    className="w-full bg-transparent border-b border-slate-800 focus:border-accent outline-none py-1 transition-all text-slate-100"
                    value={card.back}
                    onChange={(e) => updateCard(index, 'back', e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Example (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Example sentence"
                    className="w-full bg-transparent border-b border-slate-800 focus:border-accent outline-none py-1 transition-all text-slate-100"
                    value={card.example || ''}
                    onChange={(e) => updateCard(index, 'example', e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => removeCard(index)}
                  className="md:self-end p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={addCard}
            disabled={isLimitReached}
            className={`w-full py-10 mt-4 rounded-2xl font-bold transition-all flex flex-col items-center justify-center gap-2 ${
              isLimitReached 
              ? 'bg-slate-900/30 border-slate-900 text-slate-700 cursor-not-allowed border-2 border-dashed' 
              : 'bg-slate-900/50 border-2 border-dashed border-slate-800 text-slate-500 hover:border-accent/40 hover:text-accent'
            }`}
          >
            <Plus size={32} />
            {isLimitReached ? `Set limit reached (${MAX_CARDS} cards)` : 'Add another card'}
          </button>
        </div>

        <div className="order-1 lg:order-2">
          <div 
            className="flex items-center justify-between gap-4 mb-4 cursor-pointer lg:cursor-default"
            onClick={() => setIsBulkExpanded(!isBulkExpanded)}
          >
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileText size={24} className="text-accent" />
              Bulk Import
            </h3>
            <button className="lg:hidden text-slate-400">
              {isBulkExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
          </div>
          <div className={`bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 space-y-4 lg:sticky lg:top-6 ${isBulkExpanded ? 'block' : 'hidden lg:block'}`}>
            <p className="text-sm text-slate-300 bg-accent-light p-4 rounded-xl border border-accent-border">
              Paste your data below. Use <strong>-</strong>, <strong>;</strong>, or <strong>,</strong> to separate front, back, and example. Each new card should be on a new line. 
              <br /><span className="text-accent font-bold mt-1 block">Maximum {MAX_CARDS} cards per set.</span>
            </p>
            <textarea 
              rows={15}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm focus:ring-2 focus:ring-accent outline-none text-slate-100 placeholder:text-slate-700 transition-all"
              placeholder="Word 1 - Definition 1 - Example 1&#10;Word 2 - Definition 2"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <button 
              onClick={handleBulkImport}
              disabled={!bulkText.trim()}
              className="w-full px-8 py-3 bg-accent text-slate-950 font-bold rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              Parse & Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
