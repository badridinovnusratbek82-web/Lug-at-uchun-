export interface Word {
  id: string;
  english: string;
  uzbek: string;
  transcription?: string;
  example?: string;
  exampleUz?: string;
  partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  bookId: string;
  folderId: string;
  timesStudied: number;
  timesCorrect: number;
  timesIncorrect: number;
  consecutiveCorrect: number;
  masteryLevel: number; // 0: Yangi, 1-2: O'rganilmoqda, 3-4: Yaxshi, 5: O'zlashtirilgan
  lastReviewedAt?: string;
  isStarred?: boolean;
  notes?: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  bookId: string;
  title: string;
  description?: string;
  createdAt: string;
}

export type QuizMode = 
  | 'mcq_en_to_uz'    // 4 ta variant (Inglizcha -> O'zbekcha)
  | 'mcq_uz_to_en'    // 4 ta variant (O'zbekcha -> Inglizcha)
  | 'spelling'        // Imlo / Yozma test
  | 'flashcards'      // Flesh-kartalar
  | 'listening'       // Eshitib topish
  | 'mistakes';       // Faqat xatolar ustida ishlash

export interface QuizQuestion {
  id: string;
  word: Word;
  questionText: string;
  audioText?: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  hasAnswered: boolean;
  explanation?: string;
}

export interface QuizSessionSummary {
  id: string;
  date: string;
  mode: QuizMode;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  wordsPracticedCount: number;
  mistakeWordIds: string[];
}

export interface AppSettings {
  autoAdvance: boolean;
  autoAdvanceDelayMs: number;
  soundEffects: boolean;
  speechRate: number;
  theme: 'light' | 'dark' | 'system';
  shuffleQuestions: boolean;
}

export interface ParseResult {
  validWords: Array<{
    english: string;
    uzbek: string;
    transcription?: string;
    example?: string;
    partOfSpeech?: string;
  }>;
  errors: string[];
  totalParsed: number;
  duplicateCount: number;
}
