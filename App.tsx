import React, { useState } from 'react';
import { Library } from './pages/Library';
import { SetDetails } from './pages/SetDetails';
import { SetEditor } from './pages/SetEditor';
import { ReviewMode } from './pages/StudyModes/ReviewMode';
import { UnifiedLearnMode } from './pages/StudyModes/UnifiedLearnMode';
import { MatchMode } from './pages/StudyModes/MatchMode';
import { Sidebar } from './components/Sidebar';
import { LearnMode } from './types';
import { Plus, Sparkles } from 'lucide-react';

type Screen = 'library' | 'details' | 'editor' | 'study';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('library');
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [activeStudyMode, setActiveStudyMode] = useState<LearnMode | null>(null);

  const navigateToLibrary = () => {
    setCurrentScreen('library');
    setActiveSetId(null);
    setActiveStudyMode(null);
  };

  const navigateToDetails = (id: string) => {
    setActiveSetId(id);
    setCurrentScreen('details');
  };

  const navigateToEditor = (id?: string) => {
    setActiveSetId(id || null);
    setCurrentScreen('editor');
  };

  const startStudy = (id: string, mode: LearnMode) => {
    setActiveSetId(id);
    setActiveStudyMode(mode);
    setCurrentScreen('study');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar onNavigate={navigateToLibrary} onAddSet={() => navigateToEditor()} />
      
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2" onClick={navigateToLibrary}>
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">FlashLearn</h1>
          </div>
          {currentScreen === 'library' && (
             <button 
               onClick={() => navigateToEditor()}
               className="p-2 bg-slate-900 text-indigo-400 rounded-xl border border-slate-800"
             >
               <Plus size={20} />
             </button>
          )}
        </div>

        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {currentScreen === 'library' && (
            <Library onSelectSet={navigateToDetails} onEditSet={navigateToEditor} />
          )}
          
          {currentScreen === 'details' && activeSetId && (
            <SetDetails 
              setId={activeSetId} 
              onBack={navigateToLibrary} 
              onStartStudy={startStudy}
              onEdit={() => navigateToEditor(activeSetId)}
            />
          )}

          {currentScreen === 'editor' && (
            <SetEditor 
              setId={activeSetId || undefined} 
              onCancel={activeSetId ? () => navigateToDetails(activeSetId) : navigateToLibrary}
              onSave={(id) => navigateToDetails(id)}
            />
          )}

          {currentScreen === 'study' && activeSetId && activeStudyMode && (
             <StudyContainer 
               setId={activeSetId} 
               mode={activeStudyMode} 
               onExit={() => navigateToDetails(activeSetId)} 
             />
          )}
        </div>

        {/* Mobile FAB */}
        {currentScreen === 'library' && (
          <button
            onClick={() => navigateToEditor()}
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-50 border border-indigo-400/30"
          >
            <Plus size={28} />
          </button>
        )}
      </main>
    </div>
  );
};

const StudyContainer: React.FC<{ setId: string, mode: LearnMode, onExit: () => void }> = ({ setId, mode, onExit }) => {
  switch (mode) {
    case 'REVIEW': return <ReviewMode setId={setId} onExit={onExit} />;
    case 'LEARN': return <UnifiedLearnMode setId={setId} onExit={onExit} />;
    case 'MATCH': return <MatchMode setId={setId} onExit={onExit} />;
    case 'TF':
    case 'MCQ':
    case 'TYPE': return <UnifiedLearnMode setId={setId} onExit={onExit} />;
    default: return <div className="text-center p-10 text-slate-400">Invalid Mode</div>;
  }
};

export default App;