
import React, { useState, useEffect } from 'react';
import { Library } from './pages/Library';
import { SetDetails } from './pages/SetDetails';
import { SetEditor } from './pages/SetEditor';
import { Settings } from './pages/Settings';
import { MyTerms } from './pages/MyTerms';
import { StudyContainer } from './components/StudyContainer';
import { Sidebar } from './components/Sidebar';
import { MobileMenu } from './components/MobileMenu';
import { Footer } from './components/Footer';
import { LearnMode } from './types';
import { DataStore } from './store';
import { Plus, Menu, Download, X } from 'lucide-react';
import LZString from 'lz-string';

type Screen = 'library' | 'details' | 'editor' | 'study' | 'settings' | 'my-terms';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('library');
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [activeStudyMode, setActiveStudyMode] = useState<LearnMode | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [importData, setImportData] = useState<any>(null);

  // Initialize data persistence on mount
  useEffect(() => {
    DataStore.initialize();
    
    // Check for shared set in URL
    const params = new URLSearchParams(window.location.search);
    const importSetData = params.get('importSet');
    if (importSetData) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(importSetData);
        if (decompressed) {
          const parsed = JSON.parse(decompressed);
          if (parsed && parsed.title && Array.isArray(parsed.cards)) {
            setImportData(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to parse imported set", e);
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleImportConfirm = () => {
    if (!importData) return;
    const newId = DataStore.addSet(
      importData.title,
      importData.description || '',
      importData.cards,
      importData.tags || []
    );
    setImportData(null);
    navigateToDetails(newId);
  };

  const handleImportCancel = () => {
    setImportData(null);
  };

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

  const navigateToMyTerms = () => {
    setCurrentScreen('my-terms');
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
        onNavigateMyTerms={navigateToMyTerms}
        onAddSet={() => navigateToEditor()} 
        onNavigateSettings={navigateToSettings}
      />
      
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigateLibrary={navigateToLibrary}
        onNavigateMyTerms={navigateToMyTerms}
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
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 active:bg-slate-800"
            >
              <Menu size={20} />
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

          {currentScreen === 'my-terms' && (
            <MyTerms />
          )}

          {!(currentScreen === 'study' && (activeStudyMode === 'REVIEW' || activeStudyMode === 'LEARN' || activeStudyMode === 'TEST')) && (
            <Footer />
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

        {/* Import Modal */}
        {importData && (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 text-accent rounded-xl">
                    <Download size={24} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-100">Import Set</h4>
                </div>
                <button onClick={handleImportCancel} className="text-slate-500 hover:text-slate-100">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-slate-300">
                  You've received a shared flashcard set. Would you like to add it to your library?
                </p>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <h5 className="font-bold text-slate-100 text-lg mb-1">{importData.title}</h5>
                  {importData.description && (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{importData.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="px-2 py-1 bg-slate-800 rounded-md">{importData.cards.length} cards</span>
                    {importData.tags && importData.tags.length > 0 && (
                      <span className="px-2 py-1 bg-slate-800 rounded-md">{importData.tags.length} tags</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-950 flex justify-end gap-3">
                <button onClick={handleImportCancel} className="px-6 py-2 font-bold text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                <button 
                  onClick={handleImportConfirm}
                  className="px-8 py-2 bg-accent text-slate-950 font-bold rounded-xl hover:bg-accent-light transition-all shadow-lg shadow-accent/20"
                >
                  Import Set
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
