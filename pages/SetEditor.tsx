
import React, { useState, useEffect, useMemo } from 'react';
import { DataStore } from '../store';
import { Plus, Trash2, Save, X, FileText, LayoutList, Tag } from 'lucide-react';

interface SetEditorProps {
  setId?: string;
  onCancel: () => void;
  onSave: (id: string) => void;
}

export const SetEditor: React.FC<SetEditorProps> = ({ setId, onCancel, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<{ front: string, back: string }[]>([{ front: '', back: '' }]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allExistingTags, setAllExistingTags] = useState<string[]>([]);
  const [isBulkImport, setIsBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');

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
        const mapped = existingCards.map(c => ({ front: c.front, back: c.back }));
        setCards(mapped.length > 0 ? mapped : [{ front: '', back: '' }]);
      }
    }
  }, [setId]);

  const addCard = () => setCards([...cards, { front: '', back: '' }]);

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
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
        finalId = DataStore.updateSet(setId, title, description, validCards, tags);
    } else {
        finalId = DataStore.addSet(title, description, validCards, tags);
    }
    onSave(finalId!);
  };

  const handleBulkImport = () => {
    const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
    const newParsedCards: {front: string, back: string}[] = [];
    
    lines.forEach(line => {
      let delimiter = '-';
      if (line.includes(';')) delimiter = ';';
      else if (line.includes(',')) delimiter = ',';
      
      const parts = line.split(delimiter);
      if (parts.length >= 2) {
        newParsedCards.push({
          front: parts[0].trim(),
          back: parts.slice(1).join(delimiter).trim()
        });
      }
    });

    if (newParsedCards.length > 0) {
      setCards([...cards.filter(c => c.front || c.back), ...newParsedCards]);
      setIsBulkImport(false);
      setBulkText('');
    }
  };

  const isSaveDisabled = !title.trim() || cards.filter(c => c.front.trim() && c.back.trim()).length === 0;

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
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-lg ${
              isSaveDisabled 
              ? 'bg-slate-900 text-slate-600 cursor-not-allowed shadow-none border border-slate-800' 
              : 'bg-accent text-slate-950 hover:bg-accent-hover active:scale-95 shadow-accent/20'
            }`}
          >
            <Save size={20} />
            Save Set
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-800 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-400">Set Title</label>
          <input 
            type="text" 
            placeholder='e.g., "Intro to Spanish", "Chem 101 Finals"'
            className="w-full bg-transparent px-4 py-3 text-lg border-b-2 border-slate-800 focus:border-accent outline-none transition-all placeholder:text-slate-700 text-slate-100"
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
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 outline-none focus:border-accent transition-all"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700"
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <LayoutList size={24} className="text-accent" />
          Flashcards ({cards.length})
        </h3>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsBulkImport(true)}
            className="flex items-center gap-2 text-sm text-slate-400 font-bold hover:text-slate-200 transition-colors"
          >
            <FileText size={18} />
            Bulk Import
          </button>
        </div>
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
        className="w-full py-10 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 font-bold hover:border-accent/40 hover:text-accent transition-all flex flex-col items-center justify-center gap-2"
      >
        <Plus size={32} />
        Add another card
      </button>

      {/* Bulk Import Modal */}
      {isBulkImport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xl font-bold text-slate-100">Bulk Import Cards</h4>
              <button onClick={() => setIsBulkImport(false)} className="text-slate-500 hover:text-slate-100">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-300 bg-accent-light p-4 rounded-xl border border-accent-border">
                Paste your data below. Use <strong>-</strong>, <strong>;</strong>, or <strong>,</strong> to separate front and back. Each new card should be on a new line.
              </p>
              <textarea 
                rows={10}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-accent outline-none text-slate-100"
                placeholder="Word 1 - Definition 1&#10;Word 2 - Definition 2"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
            </div>
            <div className="p-6 bg-slate-950 flex justify-end gap-3">
              <button onClick={() => setIsBulkImport(false)} className="px-6 py-2 font-bold text-slate-400 hover:text-slate-200">Cancel</button>
              <button 
                onClick={handleBulkImport}
                disabled={!bulkText.trim()}
                className="px-8 py-2 bg-accent text-slate-950 font-bold rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                Parse & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
