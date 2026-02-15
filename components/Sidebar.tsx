
import React from 'react';
import { Library, PlusSquare, Settings, Sparkles } from 'lucide-react';

interface SidebarProps {
  onNavigate: () => void;
  onAddSet: () => void;
  onNavigateSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, onAddSet, onNavigateSettings }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 p-6">
      <div className="flex items-center gap-2 mb-10">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <Sparkles size={24} />
        </div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">FlashLearn</h1>
      </div>

      <nav className="flex-1 space-y-1">
        <button 
          onClick={onNavigate}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-lg transition-colors group"
        >
          <Library size={20} className="text-slate-500 group-hover:text-indigo-400" />
          <span className="font-medium">Library</span>
        </button>
        <button 
          onClick={onAddSet}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-lg transition-colors group"
        >
          <PlusSquare size={20} className="text-slate-500 group-hover:text-indigo-400" />
          <span className="font-medium">Create Set</span>
        </button>
      </nav>

      <div className="pt-6 border-t border-slate-800">
        <button 
          onClick={onNavigateSettings}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-800 hover:text-slate-300 rounded-lg transition-colors group"
        >
          <Settings size={20} className="text-slate-600 group-hover:text-slate-400" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
};
