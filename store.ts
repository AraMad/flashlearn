
import { SetEntity, CardEntity, StudyStateEntity, StudyStatus, SetSummary } from './types';

const STORAGE_KEYS = {
  SETS: 'flashlearn_sets',
  CARDS: 'flashlearn_cards',
  STUDY_STATES: 'flashlearn_study_states',
  BACKUP_INFO: 'flashlearn_backup_info'
};

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
  static getSets(): SetEntity[] {
    const data = localStorage.getItem(STORAGE_KEYS.SETS);
    return data ? JSON.parse(data) : [];
  }

  static getCards(): CardEntity[] {
    const data = localStorage.getItem(STORAGE_KEYS.CARDS);
    return data ? JSON.parse(data) : [];
  }

  static getStudyStates(): StudyStateEntity[] {
    const data = localStorage.getItem(STORAGE_KEYS.STUDY_STATES);
    return data ? JSON.parse(data) : [];
  }

  static saveSets(sets: SetEntity[]) {
    localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(sets));
  }

  static saveCards(cards: CardEntity[]) {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }

  static saveStudyStates(states: StudyStateEntity[]) {
    localStorage.setItem(STORAGE_KEYS.STUDY_STATES, JSON.stringify(states));
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

  static addSet(title: string, description: string, cards: { front: string, back: string }[]) {
    const setId = crypto.randomUUID();
    const now = Date.now();
    
    const newSet: SetEntity = {
      id: setId,
      title,
      description,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      isDownloaded: false
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
    return setId;
  }

  static updateSet(setId: string, title: string, description: string, cards: { front: string, back: string }[]) {
    const sets = this.getSets();
    const setIndex = sets.findIndex(s => s.id === setId);
    if (setIndex === -1) return setId;

    const now = Date.now();
    sets[setIndex] = {
      ...sets[setIndex],
      title,
      description,
      updatedAt: now
    };

    // Replace cards and states for this set
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
    return setId;
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
  }

  static toggleFavorite(setId: string) {
    const sets = this.getSets();
    const index = sets.findIndex(s => s.id === setId);
    if (index !== -1) {
      sets[index].isFavorite = !sets[index].isFavorite;
      this.saveSets(sets);
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
  }

  // Backup Methods
  static getBackupInfo(): { timestamp: number, filename: string } | null {
    const data = localStorage.getItem(STORAGE_KEYS.BACKUP_INFO);
    return data ? JSON.parse(data) : null;
  }

  static exportData() {
    const payload: BackupPayload = {
      signature: BACKUP_SIGNATURE,
      version: 1,
      data: {
        sets: this.getSets(),
        cards: this.getCards(),
        states: this.getStudyStates()
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

    localStorage.setItem(STORAGE_KEYS.BACKUP_INFO, JSON.stringify({
      timestamp: Date.now(),
      filename: filename
    }));
  }

  static async importData(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const payload: BackupPayload = JSON.parse(text);

      if (payload.signature !== BACKUP_SIGNATURE) {
        throw new Error("Invalid backup file signature.");
      }

      if (!payload.data || !Array.isArray(payload.data.sets)) {
        throw new Error("Corrupted backup data.");
      }

      this.saveSets(payload.data.sets);
      this.saveCards(payload.data.cards);
      this.saveStudyStates(payload.data.states);
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  }
}
