
import { SetEntity, CardEntity, StudyStateEntity, StudyStatus, SetSummary } from './types';

const STORAGE_KEYS = {
  SETS: 'flashlearn_sets_v1',
  CARDS: 'flashlearn_cards_v1',
  STUDY_STATES: 'flashlearn_study_states_v1',
  BACKUP_INFO: 'flashlearn_backup_info_v1',
  STORAGE_VERSION: 'flashlearn_version'
};

// Legacy keys from potential previous versions to ensure no data is lost during redeploys
const LEGACY_KEYS = {
  SETS: 'flashlearn_sets',
  CARDS: 'flashlearn_cards',
  STUDY_STATES: 'flashlearn_study_states'
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
  /**
   * Initializes the store, handles migrations and ensures 
   * data is persistent across app redeploys.
   */
  static initialize() {
    console.log("Initializing FlashLearn DataStore...");
    
    // 1. Check if we have current version data
    const existingSets = this.getSets();
    const storedVersion = localStorage.getItem(STORAGE_KEYS.STORAGE_VERSION);

    // 2. If current version is empty, check for legacy data to migrate
    if (existingSets.length === 0) {
      const legacySetsStr = localStorage.getItem(LEGACY_KEYS.SETS);
      if (legacySetsStr) {
        console.log("Found legacy data. Migrating to v1...");
        try {
          const legacySets = JSON.parse(legacySetsStr);
          const legacyCards = JSON.parse(localStorage.getItem(LEGACY_KEYS.CARDS) || '[]');
          const legacyStates = JSON.parse(localStorage.getItem(LEGACY_KEYS.STUDY_STATES) || '[]');
          
          this.saveSets(legacySets);
          this.saveCards(legacyCards);
          this.saveStudyStates(legacyStates);
          
          localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_VERSION.toString());
          console.log("Migration successful.");
          return; // Skip seeding
        } catch (e) {
          console.error("Migration failed:", e);
        }
      }
    }

    // 3. If still empty, seed only if it's truly the first time
    if (!storedVersion && existingSets.length === 0) {
      console.log("No data found. Seeding sample data for new user.");
      localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_VERSION.toString());
      this.addSet(
        "Welcome to FlashLearn! 👋", 
        "A sample set to get you started. Try the different study modes like Match or Learn!",
        [
          { front: "Flashcard", back: "A card bearing information on both sides, intended to be used as an aid in memorization." },
          { front: "Persistence", back: "The quality of continuing in a course of action in spite of difficulty or opposition." },
          { front: "Spaced Repetition", back: "An evidence-based learning technique that is usually performed with flashcards." },
          { front: "PWA", back: "Progressive Web App - an app that works offline and can be installed on your home screen." }
        ]
      );
    } else if (storedVersion) {
      const version = parseInt(storedVersion, 10);
      if (version < CURRENT_VERSION) {
        this.migrate(version, CURRENT_VERSION);
      }
    }
  }

  private static migrate(from: number, to: number) {
    console.log(`Migrating storage from v${from} to v${to}...`);
    localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, to.toString());
  }

  private static safeParse<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Failed to parse storage key [${key}]:`, e);
      return defaultValue;
    }
  }

  private static safeSave(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Storage failed for key [${key}]. LocalStorage might be full:`, e);
      alert("Warning: Your browser storage is full. Some data might not be saved.");
    }
  }

  static getSets(): SetEntity[] {
    return this.safeParse<SetEntity[]>(STORAGE_KEYS.SETS, []);
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

  static getBackupInfo(): { timestamp: number, filename: string } | null {
    return this.safeParse<{ timestamp: number, filename: string } | null>(STORAGE_KEYS.BACKUP_INFO, null);
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
