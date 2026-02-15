
import React, { useState, useEffect } from 'react';
import { Library } from './pages/Library';
import { SetDetails } from './pages/SetDetails';
import { SetEditor } from './pages/SetEditor';
import { Settings } from './pages/Settings';
import { ReviewMode } from './pages/StudyModes/ReviewMode';
import { UnifiedLearnMode } from './pages/StudyModes/UnifiedLearnMode';
import { MatchMode } from './pages/StudyModes/MatchMode';
import { TestMode } from './pages/StudyModes/TestMode';
import { Sidebar } from './components/Sidebar';
import { LearnMode } from './types';
import { DataStore } from './store';
import { Plus, Settings as SettingsIcon } from 'lucide-react';

type Screen = 'library' | 'details' | 'editor' | 'study' | 'settings';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('library');
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [activeStudyMode, setActiveStudyMode] = useState<LearnMode | null>(null);

  // Initialize data persistence on mount
  useEffect(() => {
    DataStore.initialize();
  }, []);

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

  const navigateToSettings = () => {
    setCurrentScreen('settings');
    setActiveSetId(null);
  };

  const startStudy = (id: string, mode: LearnMode) => {
    setActiveSetId(id);
    setActiveStudyMode(mode);
    setCurrentScreen('study');
  };

  const isStudyMode = currentScreen === 'study';

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar 
        onNavigate={navigateToLibrary} 
        onAddSet={() => navigateToEditor()} 
        onNavigateSettings={navigateToSettings}
      />
      
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {/* Mobile Header - Hidden in Study Mode */}
        {!isStudyMode && (
          <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-2" onClick={navigateToLibrary}>
              <div className="bg-slate-900 p-1 rounded-lg border border-slate-800">
                <img 
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I0U4NEUyRTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGN0I2NDQ7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMTMwIiBjeT0iMTQwIiByPSI0NSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ1cmwoI2dyYWQpIiBzdHJva2Utd2lkdGg9IjM1Ii8+PHBhdGggZD0iTTIyMCA0MjAgTDIyMCAxMjAgUTIyMCAxMDAgMjQwIDEwMCBMMzgwIDEwMCBNMjIwIDI2MCBMMzQwIDI2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ1cmwoI2dyYWQpIiBzdHJva2Utd2lkdGg9IjM1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=" 
                  alt="FlashLearn Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">FlashLearn</h1>
            </div>
            
            <button 
              onClick={navigateToSettings}
              className={`p-2 rounded-xl border transition-all ${
                currentScreen === 'settings' 
                ? 'bg-accent text-slate-950 border-accent shadow-lg shadow-accent/40' 
                : 'bg-slate-900 text-slate-400 border-slate-800 active:bg-slate-800'
              }`}
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        )}

        <div className={`max-w-5xl mx-auto p-4 md:p-8 ${isStudyMode ? 'pt-4' : ''}`}>
          {currentScreen === 'library' && (
            <Library 
              onSelectSet={navigateToDetails} 
              onEditSet={navigateToEditor} 
              onNavigateSettings={navigateToSettings}
            />
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

          {currentScreen === 'settings' && (
            <Settings onBack={navigateToLibrary} />
          )}
        </div>

        {/* Mobile FAB */}
        {currentScreen === 'library' && (
          <button
            onClick={() => navigateToEditor()}
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-accent text-slate-950 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-50 border border-accent/30"
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
    case 'TEST': return <TestMode setId={setId} onExit={onExit} />;
    case 'TF':
    case 'MCQ':
    case 'TYPE': return <UnifiedLearnMode setId={setId} onExit={onExit} />;
    default: return <div className="text-center p-10 text-slate-400">Invalid Mode</div>;
  }
};

export default App;
