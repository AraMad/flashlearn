import React from 'react';
import { ChevronLeft, HelpCircle, AlertTriangle } from 'lucide-react';

interface GuideProps {
  onBack: () => void;
}

export const Guide: React.FC<GuideProps> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 text-slate-500 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-bold text-slate-100">
          Guide & Instructions
        </h2>
      </div>

      <div className="space-y-6">
        <section className="bg-amber-500/10 p-6 md:p-8 rounded-3xl border-2 border-amber-500/50 shadow-lg shadow-amber-500/5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2">
            <AlertTriangle size={24} />
            Data Backup & Safety
          </h3>
          <p className="text-slate-200 font-medium">Your flashcards are stored locally in your browser. It is highly recommended to regularly back up your data to prevent accidental loss.</p>
          <div className="bg-slate-950/50 p-4 rounded-xl border border-amber-500/20 text-sm text-slate-300">
            <p>Click "Settings" in the menu &gt; scroll to "Data Management" &gt; click "Export Data" to save a backup file to your device.</p>
          </div>
        </section>

        <section className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Tags for Sets</h3>
          <p className="text-slate-400">Use the tag system to organize your sets and view each group separately.</p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300">
            <p>Go to a set &gt; scroll down &gt; enter a tag &gt; press Enter to save.</p>
          </div>
        </section>

        <section className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Bulk Import</h3>
          <p className="text-slate-400">Quickly add multiple cards to a set by pasting text instead of typing them one by one.</p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300">
            <p>Create/Edit a set &gt; click "Bulk Import" &gt; paste your terms separated by hyphens, commas, or semicolons &gt; click "Import".</p>
          </div>
        </section>

        <section className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-slate-100">My Terms</h3>
          <p className="text-slate-400">A central place to view all the terms you've learned or need to study across all your sets.</p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300">
            <p>Click "My Terms" in the menu &gt; use the tabs to switch between "Learned" and "Not Learned" terms.</p>
          </div>
        </section>

        <section className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Study Modes</h3>
          <p className="text-slate-400">Different ways to practice and memorize your flashcards.</p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 space-y-2">
            <p><strong>Review:</strong> Swipe left/right to review cards like traditional flashcards.</p>
            <p><strong>Learn:</strong> A mix of multiple choice, true/false, spelling, and typing questions.</p>
            <p><strong>Test:</strong> A formal test with a score at the end.</p>
            <p><strong>Match:</strong> A timed game where you match terms to their definitions.</p>
          </div>
        </section>

        <section className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Examples</h3>
          <p className="text-slate-400">Add context to your flashcards with example sentences.</p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300">
            <p>Create/Edit a set &gt; fill in the "Example (Optional)" field for a card. Examples are shown during review and when checking answers in Learn mode.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
