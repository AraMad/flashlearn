import React from 'react';
import { LearnMode } from '../types';
import { ReviewMode } from '../pages/StudyModes/ReviewMode';
import { UnifiedLearnMode } from '../pages/StudyModes/UnifiedLearnMode';
import { MatchMode } from '../pages/StudyModes/MatchMode';
import { TestMode } from '../pages/StudyModes/TestMode';

interface StudyContainerProps {
  setId: string;
  mode: LearnMode;
  onExit: () => void;
}

export const StudyContainer: React.FC<StudyContainerProps> = ({ setId, mode, onExit }) => {
  switch (mode) {
    case 'REVIEW': return <ReviewMode setId={setId} onExit={onExit} />;
    case 'LEARN': return <UnifiedLearnMode setId={setId} onExit={onExit} />;
    case 'MATCH': return <MatchMode setId={setId} onExit={onExit} />;
    case 'TEST': return <TestMode setId={setId} onExit={onExit} />;
    case 'TF':
    case 'MCQ':
    case 'TYPE': return <UnifiedLearnMode setId={setId} mode={mode} onExit={onExit} />;
    default: return <div className="text-center p-10 text-slate-400">Invalid Mode</div>;
  }
};
