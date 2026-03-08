import React from 'react';
import { Library, PlusSquare, Settings, BookOpen, X } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateLibrary: () => void;
  onNavigateMyTerms: () => void;
  onAddSet: () => void;
  onNavigateSettings: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onNavigateLibrary,
  onNavigateMyTerms,
  onAddSet,
  onNavigateSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu Content */}
      <div className="absolute right-0 top-0 bottom-0 w-64 bg-slate-900 border-l border-slate-800 p-6 shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-100">Menu</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => { onNavigateLibrary(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-colors"
          >
            <Library size={20} />
            <span className="font-medium">Library</span>
          </button>
          
          <button 
            onClick={() => { onNavigateMyTerms(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-colors"
          >
            <BookOpen size={20} />
            <span className="font-medium">My Terms</span>
          </button>

          <button 
            onClick={() => { onAddSet(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-colors"
          >
            <PlusSquare size={20} />
            <span className="font-medium">Create Set</span>
          </button>

          <button 
            onClick={() => { onNavigateSettings(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-colors"
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
