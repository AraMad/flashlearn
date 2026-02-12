
import React, { useState } from 'react';
import { Library } from './pages/Library';
import { SetDetails } from './pages/SetDetails';
import { SetEditor } from './pages/SetEditor';
import { ReviewMode } from './pages/StudyModes/ReviewMode';
import { UnifiedLearnMode } from './pages/StudyModes/UnifiedLearnMode';
import { MatchMode } from './pages/StudyModes/MatchMode';
import { Sidebar } from './components/Sidebar';
import { LearnMode } from './types';

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
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
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
      </main>
    </div>
  );
};

const StudyContainer: React.FC<{ setId: string, mode: LearnMode, onExit: () => void }> = ({ setId, mode, onExit }) => {
  switch (mode) {
    case 'REVIEW': return <ReviewMode setId={setId} onExit={onExit} />;
    case 'LEARN': return <UnifiedLearnMode setId={setId} onExit={onExit} />;
    case 'MATCH': return <MatchMode setId={setId} onExit={onExit} />;
    // Deprecated standalone modes redirected to Unified flow if triggered
    case 'TF':
    case 'MCQ':
    case 'TYPE': return <UnifiedLearnMode setId={setId} onExit={onExit} />;
    default: return <div className="text-center p-10 text-slate-400">Invalid Mode</div>;
  }
};

export default App;
