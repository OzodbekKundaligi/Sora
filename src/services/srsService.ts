import { type SRSData, getUserData, updateUserData } from '../lib/localData';
import { vocabularyBank } from '../lib/courseData';

const intervals = [0, 1, 2, 4, 7, 14, 30];

function normalizeWord(word: string) {
  return word.trim().toLowerCase();
}

function scheduleNextReview(level: number) {
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervals[Math.min(level, intervals.length - 1)]);
  return nextReview.toISOString();
}

function createRecord(word: string): SRSData {
  return {
    word: normalizeWord(word),
    level: 0,
    nextReview: new Date().toISOString(),
    correctCount: 0,
    wrongCount: 0,
    lastResult: null,
  };
}

export const srsService = {
  getSRSData(userId: number) {
    return getUserData(userId).srs;
  },

  saveSRSData(userId: number, data: SRSData[]) {
    updateUserData(userId, (current) => ({
      ...current,
      srs: data,
    }));
  },

  ensureWord(userId: number, word: string) {
    const normalized = normalizeWord(word);
    const data = this.getSRSData(userId);
    const existing = data.find((entry) => entry.word === normalized);

    if (existing) {
      return existing;
    }

    const record = createRecord(normalized);
    this.saveSRSData(userId, [...data, record]);
    return record;
  },

  updateWord(userId: number, word: string, isCorrect: boolean) {
    const normalized = normalizeWord(word);
    const data = this.getSRSData(userId);
    const index = data.findIndex((entry) => entry.word === normalized);
    const current = index >= 0 ? data[index] : createRecord(normalized);

    const next: SRSData = {
      ...current,
      level: isCorrect ? Math.min(current.level + 1, 6) : Math.max(current.level - 1, 0),
      correctCount: current.correctCount + (isCorrect ? 1 : 0),
      wrongCount: current.wrongCount + (isCorrect ? 0 : 1),
      lastResult: isCorrect ? 'correct' : 'wrong',
    };

    next.nextReview = scheduleNextReview(next.level);

    if (index >= 0) {
      data[index] = next;
      this.saveSRSData(userId, [...data]);
    } else {
      this.saveSRSData(userId, [...data, next]);
    }

    return next;
  },

  getWordsForReview(userId: number) {
    const now = new Date();
    const due = this.getSRSData(userId)
      .filter((entry) => new Date(entry.nextReview) <= now)
      .sort((left, right) => new Date(left.nextReview).getTime() - new Date(right.nextReview).getTime());

    if (due.length > 0) {
      return due;
    }

    return vocabularyBank.slice(0, 8).map((entry) => this.ensureWord(userId, entry.word));
  },

  getNextWord(userId: number) {
    return this.getWordsForReview(userId)[0] || null;
  },

  getStats(userId: number) {
    const data = this.getSRSData(userId);
    const due = this.getWordsForReview(userId);

    return {
      total: data.length,
      due: due.length,
      mastered: data.filter((entry) => entry.level >= 4).length,
      weak: data.filter((entry) => entry.wrongCount > entry.correctCount).length,
    };
  },
};
