import React from 'react';
import { Library, PlusSquare, Settings, BookOpen } from 'lucide-react';

interface SidebarProps {
  onNavigate: () => void;
  onNavigateMyTerms: () => void;
  onAddSet: () => void;
  onNavigateSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, onNavigateMyTerms, onAddSet, onNavigateSettings }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <img 
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I0U4NEUyRTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGN0I2NDQ7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMTMwIiBjeT0iMTQwIiByPSI0NSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ1cmwoI2dyYWQpIiBzdHJva2Utd2lkdGg9IjM1Ii8+PHBhdGggZD0iTTIyMCA0MjAgTDIyMCAxMjAgUTIyMCAxMDAgMjQwIDEwMCBMMzgwIDEwMCBNMjIwIDI2MCBMMzQwIDI2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ1cmwoI2dyYWQpIiBzdHJva2Utd2lkdGg9IjM1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=" 
            alt="FlashLearn Logo" 
            className="w-10 h-10 object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">FlashLearn</h1>
      </div>

      <nav className="flex-1 space-y-1">
        <button 
          onClick={onNavigate}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-lg transition-colors group"
        >
          <Library size={20} className="text-slate-500 group-hover:text-accent" />
          <span className="font-medium">Library</span>
        </button>
        <button 
          onClick={onNavigateMyTerms}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-lg transition-colors group"
        >
          <BookOpen size={20} className="text-slate-500 group-hover:text-accent" />
          <span className="font-medium">My Terms</span>
        </button>
        <button 
          onClick={onAddSet}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-lg transition-colors group"
        >
          <PlusSquare size={20} className="text-slate-500 group-hover:text-accent" />
          <span className="font-medium">Create Set</span>
        </button>
      </nav>

      <div className="pt-6 border-t border-slate-800">
        <button 
          onClick={onNavigateSettings}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-800 hover:text-slate-300 rounded-lg transition-colors group"
        >
          <Settings size={20} className="text-slate-600 group-hover:text-accent" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
};