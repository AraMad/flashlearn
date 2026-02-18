export enum StudyStatus {
  LEARNED = 'learned',
  NOT_LEARNED = 'not_learned'
}

export interface SetEntity {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  isDownloaded: boolean;
  tags: string[];
  isRandomSet?: boolean;
  sourceTags?: string[];
  sourceCount?: number;
}

export interface CardEntity {
  id: string;
  setId: string;
  front: string;
  back: string;
  orderIndex: number;
}

export interface StudyStateEntity {
  cardId: string;
  setId: string;
  status: StudyStatus;
  lastSeenAt?: number;
  correctCount: number;
  wrongCount: number;
}

export interface SetSummary extends SetEntity {
  cardCount: number;
  learnedCount: number;
}

export type LearnMode = 'TF' | 'MCQ' | 'TYPE' | 'REVIEW' | 'MATCH' | 'LEARN' | 'TEST';

export interface LearnOptions {
  mode: LearnMode;
  pool: 'all' | 'not_learned';
  shuffle: boolean;
}