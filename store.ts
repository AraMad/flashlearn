
import { SetEntity, CardEntity, StudyStateEntity, StudyStatus, SetSummary } from './types';

const STORAGE_KEYS = {
  SETS: 'flashlearn_sets_v1',
  CARDS: 'flashlearn_cards_v1',
  STUDY_STATES: 'flashlearn_study_states_v1',
  BACKUP_INFO: 'flashlearn_backup_info_v1',
  LAST_MUTATION: 'flashlearn_last_mutation_v1',
  STORAGE_VERSION: 'flashlearn_version'
};

const CURRENT_VERSION = 1;
const BACKUP_SIGNATURE = "FLASHLEARN_BACKUP_V1";

export interface BackupPayload {
  signature: string;
  version: number;
  data: {
    sets: SetEntity[];
    cards: CardEntity[];
    states: StudyStateEntity[];
  };
  exportedAt: number;
}

export class DataStore {
  static initialize() {
    const existingSets = this.getSets();
    const storedVersion = localStorage.getItem(STORAGE_KEYS.STORAGE_VERSION);

    // Initialize tags for existing sets if they don't have them
    const setsWithTags = existingSets.map(s => ({ ...s, tags: s.tags || [] }));
    if (JSON.stringify(existingSets) !== JSON.stringify(setsWithTags)) {
      this.saveSets(setsWithTags);
    }

    if (!storedVersion && existingSets.length === 0) {
      localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_VERSION.toString());
      this.addSet(
        "Welcome to FlashLearn! 👋", 
        "A sample set to get you started. Try the different study modes like Match or Learn!",
        [
          { front: "Flashcard", back: "A card bearing information on both sides, intended to be used as an aid in memorization." },
          { front: "Persistence", back: "The quality of continuing in a course of action in spite of difficulty or opposition." },
          { front: "Spaced Repetition", back: "An evidence-based learning technique that is usually performed with flashcards." },
          { front: "PWA", back: "Progressive Web App - an app that works offline and can be installed on your home screen." }
        ],
        ["Tutorial"]
      );
    }
  }

  private static safeParse<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      return defaultValue;
    }
  }

  private static safeSave(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      alert("Warning: Your browser storage is full.");
    }
  }

  private static recordMutation() {
    this.safeSave(STORAGE_KEYS.LAST_MUTATION, Date.now());
  }

  static shouldShowBackupReminder(): boolean {
    const lastBackup = this.getBackupInfo()?.timestamp || 0;
    const lastMutation = this.safeParse<number>(STORAGE_KEYS.LAST_MUTATION, 0);
    
    if (lastMutation <= lastBackup) return false;
    
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - lastBackup) > sevenDaysInMs;
  }

  static getSets(): SetEntity[] {
    return this.safeParse<SetEntity[]>(STORAGE_KEYS.SETS, []).map(s => ({ ...s, tags: s.tags || [] }));
  }

  static getAllTags(): string[] {
    const sets = this.getSets().filter(s => !s.isRandomSet);
    const tags = new Set<string>();
    sets.forEach(s => s.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }

  static getCards(): CardEntity[] {
    return this.safeParse<CardEntity[]>(STORAGE_KEYS.CARDS, []);
  }

  static getStudyStates(): StudyStateEntity[] {
    return this.safeParse<StudyStateEntity[]>(STORAGE_KEYS.STUDY_STATES, []);
  }

  static saveSets(sets: SetEntity[]) {
    this.safeSave(STORAGE_KEYS.SETS, sets);
  }

  static saveCards(cards: CardEntity[]) {
    this.safeSave(STORAGE_KEYS.CARDS, cards);
  }

  static saveStudyStates(states: StudyStateEntity[]) {
    this.safeSave(STORAGE_KEYS.STUDY_STATES, states);
  }

  static getSetSummaries(): SetSummary[] {
    const sets = this.getSets();
    const cards = this.getCards();
    const states = this.getStudyStates();

    return sets.map(set => {
      const setCards = cards.filter(c => c.setId === set.id);
      const learnedCount = states.filter(s => s.setId === set.id && s.status === StudyStatus.LEARNED).length;
      return {
        ...set,
        cardCount: setCards.length,
        learnedCount,
      };
    });
  }

  static addSet(title: string, description: string, cards: { front: string, back: string }[], tags: string[] = []) {
    const setId = crypto.randomUUID();
    const now = Date.now();
    
    const newSet: SetEntity = {
      id: setId,
      title,
      description,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      isDownloaded: false,
      tags: tags
    };

    const newCards: CardEntity[] = cards.map((c, i) => ({
      id: crypto.randomUUID(),
      setId,
      front: c.front,
      back: c.back,
      orderIndex: i
    }));

    const newStates: StudyStateEntity[] = newCards.map(c => ({
      cardId: c.id,
      setId,
      status: StudyStatus.NOT_LEARNED,
      correctCount: 0,
      wrongCount: 0
    }));

    this.saveSets([...this.getSets(), newSet]);
    this.saveCards([...this.getCards(), ...newCards]);
    this.saveStudyStates([...this.getStudyStates(), ...newStates]);
    this.recordMutation();
    return setId;
  }

  static updateSet(setId: string, title: string, description: string, cards: { front: string, back: string }[], tags?: string[]) {
    const sets = this.getSets();
    const setIndex = sets.findIndex(s => s.id === setId);
    if (setIndex === -1) return setId;

    const now = Date.now();
    sets[setIndex] = {
      ...sets[setIndex],
      title,
      description,
      updatedAt: now,
      tags: tags !== undefined ? tags : sets[setIndex].tags
    };

    const otherCards = this.getCards().filter(c => c.setId !== setId);
    const otherStates = this.getStudyStates().filter(s => s.setId !== setId);

    const newCards: CardEntity[] = cards.map((c, i) => ({
      id: crypto.randomUUID(),
      setId,
      front: c.front,
      back: c.back,
      orderIndex: i
    }));

    const newStates: StudyStateEntity[] = newCards.map(c => ({
      cardId: c.id,
      setId,
      status: StudyStatus.NOT_LEARNED,
      correctCount: 0,
      wrongCount: 0
    }));

    this.saveSets(sets);
    this.saveCards([...otherCards, ...newCards]);
    this.saveStudyStates([...otherStates, ...newStates]);
    this.recordMutation();
    return setId;
  }

  static createRandomSet(tags: string[], count: number = 50) {
    const allSets = this.getSets();
    const sourceSets = allSets.filter(s => {
      if (s.isRandomSet) return false;
      // If no tags selected, use all available sets
      if (tags.length === 0) return true;
      
      const hasNoTags = !s.tags || s.tags.length === 0;
      if (hasNoTags && tags.includes('no-tag')) return true;
      return s.tags.some(t => tags.includes(t));
    });
    
    const sourceSetIds = sourceSets.map(s => s.id);
    const allCards = this.getCards();
    const matchingCards = allCards.filter(c => sourceSetIds.includes(c.setId));
    
    // Pick requested number of random cards
    const randomCards = matchingCards
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(c => ({ front: c.front, back: c.back }));

    if (randomCards.length === 0) return null;

    const setId = crypto.randomUUID();
    const now = Date.now();
    
    const newSet: SetEntity = {
      id: setId,
      title: "Random Set",
      description: tags.length === 0 ? "Generated from all your cards" : `Generated from: ${tags.join(', ')}`,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      isDownloaded: false,
      tags: ["Random"],
      isRandomSet: true,
      sourceTags: tags,
      sourceCount: count
    };

    const newCards: CardEntity[] = randomCards.map((c, i) => ({
      id: crypto.randomUUID(),
      setId,
      front: c.front,
      back: c.back,
      orderIndex: i
    }));

    const newStates: StudyStateEntity[] = newCards.map(c => ({
      cardId: c.id,
      setId,
      status: StudyStatus.NOT_LEARNED,
      correctCount: 0,
      wrongCount: 0
    }));

    this.saveSets([...this.getSets(), newSet]);
    this.saveCards([...this.getCards(), ...newCards]);
    this.saveStudyStates([...this.getStudyStates(), ...newStates]);
    this.recordMutation();
    return setId;
  }

  static regenerateRandomSet(setId: string, newTags?: string[], newCount?: number) {
    const sets = this.getSets();
    const setIndex = sets.findIndex(s => s.id === setId);
    if (setIndex === -1) return;
    
    const set = sets[setIndex];
    if (!set || !set.isRandomSet || set.sourceTags === undefined) return;

    if (newTags !== undefined) set.sourceTags = newTags;
    if (newCount !== undefined) set.sourceCount = newCount;
    
    const tags = set.sourceTags;
    const count = set.sourceCount || 50;
    
    const sourceSets = sets.filter(s => {
      if (s.isRandomSet) return false;
      if (tags.length === 0) return true;
      const hasNoTags = !s.tags || s.tags.length === 0;
      if (hasNoTags && tags.includes('no-tag')) return true;
      return s.tags.some(t => tags.includes(t));
    });

    const sourceSetIds = sourceSets.map(s => s.id);
    const allCards = this.getCards();
    const matchingCards = allCards.filter(c => sourceSetIds.includes(c.setId));
    
    const randomCards = matchingCards
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(c => ({ front: c.front, back: c.back }));

    if (randomCards.length === 0) return;

    // Remove existing cards and states for this set
    const otherCards = allCards.filter(c => c.setId !== setId);
    const otherStates = this.getStudyStates().filter(s => s.setId !== setId);

    const newCards: CardEntity[] = randomCards.map((c, i) => ({
      id: crypto.randomUUID(),
      setId,
      front: c.front,
      back: c.back,
      orderIndex: i
    }));

    const newStates: StudyStateEntity[] = newCards.map(c => ({
      cardId: c.id,
      setId,
      status: StudyStatus.NOT_LEARNED,
      correctCount: 0,
      wrongCount: 0
    }));

    set.updatedAt = Date.now();
    set.description = tags.length === 0 ? "Generated from all your cards" : `Generated from: ${tags.join(', ')}`;
    
    this.saveSets(sets);
    this.saveCards([...otherCards, ...newCards]);
    this.saveStudyStates([...otherStates, ...newStates]);
    this.recordMutation();
  }

  static updateSetTags(setId: string, tags: string[]) {
    const sets = this.getSets();
    const idx = sets.findIndex(s => s.id === setId);
    if (idx !== -1) {
      sets[idx].tags = tags;
      sets[idx].updatedAt = Date.now();
      this.saveSets(sets);
      this.recordMutation();
    }
  }

  static updateStudyState(cardId: string, isCorrect: boolean) {
    const states = this.getStudyStates();
    const stateIndex = states.findIndex(s => s.cardId === cardId);
    if (stateIndex === -1) return;

    const state = states[stateIndex];
    state.lastSeenAt = Date.now();
    if (isCorrect) {
      state.correctCount++;
      state.status = StudyStatus.LEARNED;
    } else {
      state.wrongCount++;
      state.status = StudyStatus.NOT_LEARNED;
    }

    states[stateIndex] = state;
    this.saveStudyStates(states);
    this.recordMutation();
  }

  static toggleFavorite(setId: string) {
    const sets = this.getSets();
    const index = sets.findIndex(s => s.id === setId);
    if (index !== -1) {
      sets[index].isFavorite = !sets[index].isFavorite;
      this.saveSets(sets);
      this.recordMutation();
    }
  }

  static deleteSet(setId: string) {
    if (!setId) return;
    const sets = this.getSets().filter(s => s.id !== setId);
    const cards = this.getCards().filter(c => c.setId !== setId);
    const states = this.getStudyStates().filter(s => s.setId !== setId);
    
    this.saveSets(sets);
    this.saveCards(cards);
    this.saveStudyStates(states);
    this.recordMutation();
  }

  static getBackupInfo(): { timestamp: number, filename: string } | null {
    return this.safeParse<{ timestamp: number, filename: string } | null>(STORAGE_KEYS.BACKUP_INFO, null);
  }

  static exportData() {
    const payload: BackupPayload = {
      signature: BACKUP_SIGNATURE,
      version: 1,
      data: {
        // EXCLUDE RANDOM SETS FROM BACKUP
        sets: this.getSets().filter(s => !s.isRandomSet),
        cards: this.getCards().filter(c => {
          const sets = this.getSets();
          const parentSet = sets.find(s => s.id === c.setId);
          return parentSet && !parentSet.isRandomSet;
        }),
        states: this.getStudyStates().filter(s => {
           const sets = this.getSets();
           const parentSet = sets.find(set => set.id === s.setId);
           return parentSet && !parentSet.isRandomSet;
        })
      },
      exportedAt: Date.now()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `flashlearn_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    this.safeSave(STORAGE_KEYS.BACKUP_INFO, {
      timestamp: Date.now(),
      filename: filename
    });
  }

  static async importData(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const payload: BackupPayload = JSON.parse(text);

      if (payload.signature !== BACKUP_SIGNATURE) {
        throw new Error("Invalid backup file signature.");
      }

      this.saveSets(payload.data.sets);
      this.saveCards(payload.data.cards);
      this.saveStudyStates(payload.data.states);
      this.safeSave(STORAGE_KEYS.BACKUP_INFO, {
        timestamp: Date.now(),
        filename: 'Imported from file'
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}
