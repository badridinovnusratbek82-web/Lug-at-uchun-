/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppSettings, Book, Folder, QuizSessionSummary, Word } from './types';
import {
  loadBooks,
  saveBooks,
  loadFolders,
  saveFolders,
  loadWords,
  saveWords,
  loadSettings,
  saveSettings,
  loadSessions,
  saveSession,
  getDailyStreak,
  recordStreakActivity,
} from './utils/storage';
import { DEFAULT_BOOKS, DEFAULT_FOLDERS, DEFAULT_WORDS } from './data/defaultVocabulary';
import { soundManager } from './utils/audio';

import { Header } from './components/Header';
import { FolderSidebar } from './components/FolderSidebar';
import { WordList } from './components/WordList';
import { BulkImportModal } from './components/BulkImportModal';
import { SingleWordModal } from './components/SingleWordModal';
import { QuizEngine } from './components/QuizEngine';
import { StatisticsModal } from './components/StatisticsModal';
import { OfflineExportModal } from './components/OfflineExportModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  // Core Data
  const [books, setBooks] = useState<Book[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [sessions, setSessions] = useState<QuizSessionSummary[]>([]);
  const [streak, setStreak] = useState<number>(1);

  // Selection & Filters
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'starred' | 'mistakes' | 'mastered' | 'new'>('all');

  // Modals
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isSingleWordOpen, setIsSingleWordOpen] = useState(false);
  const [wordToEdit, setWordToEdit] = useState<Word | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizWordsPool, setQuizWordsPool] = useState<Word[]>([]);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedB = loadBooks();
    const loadedF = loadFolders();
    const loadedW = loadWords();
    const loadedS = loadSettings();
    const loadedSess = loadSessions();
    const sData = getDailyStreak();

    setBooks(loadedB);
    setFolders(loadedF);
    setWords(loadedW);
    setSettings(loadedS);
    setSessions(loadedSess);
    setStreak(sData.streak);

    soundManager.setSoundEnabled(loadedS.soundEffects);
    soundManager.setSpeechRate(loadedS.speechRate);

    // Apply dark mode if setting says so
    if (loadedS.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sync state to storage
  const handleUpdateBooks = (newBooks: Book[]) => {
    setBooks(newBooks);
    saveBooks(newBooks);
  };

  const handleUpdateFolders = (newFolders: Folder[]) => {
    setFolders(newFolders);
    saveFolders(newFolders);
  };

  const handleUpdateWords = (newWords: Word[]) => {
    setWords(newWords);
    saveWords(newWords);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    soundManager.setSoundEnabled(newSettings.soundEffects);
    soundManager.setSpeechRate(newSettings.speechRate);
  };

  // Create Book
  const handleCreateBook = (title: string, description?: string) => {
    const newBook: Book = {
      id: 'book-' + Date.now(),
      title,
      description: description || '',
      createdAt: new Date().toISOString(),
    };
    handleUpdateBooks([...books, newBook]);
  };

  const handleEditBook = (bookId: string, title: string) => {
    handleUpdateBooks(books.map(b => (b.id === bookId ? { ...b, title } : b)));
  };

  const handleDeleteBook = (bookId: string) => {
    handleUpdateBooks(books.filter(b => b.id !== bookId));
    handleUpdateFolders(folders.filter(f => f.bookId !== bookId));
    handleUpdateWords(words.filter(w => w.bookId !== bookId));
    if (selectedBookId === bookId) setSelectedBookId(null);
  };

  // Create Folder
  const handleCreateFolder = (bookId: string, title: string): Folder => {
    const newFolder: Folder = {
      id: 'folder-' + Date.now(),
      bookId,
      title,
      createdAt: new Date().toISOString(),
    };
    handleUpdateFolders([...folders, newFolder]);
    return newFolder;
  };

  const handleEditFolder = (folderId: string, title: string) => {
    handleUpdateFolders(folders.map(f => (f.id === folderId ? { ...f, title } : f)));
  };

  const handleDeleteFolder = (folderId: string) => {
    handleUpdateFolders(folders.filter(f => f.id !== folderId));
    handleUpdateWords(words.filter(w => w.folderId !== folderId));
    if (selectedFolderId === folderId) setSelectedFolderId(null);
  };

  // Single word save (add or edit)
  const handleSaveSingleWord = (data: {
    id?: string;
    english: string;
    uzbek: string;
    transcription?: string;
    example?: string;
    exampleUz?: string;
    partOfSpeech?: Word['partOfSpeech'];
    bookId: string;
    folderId: string;
  }) => {
    if (data.id) {
      // Edit
      handleUpdateWords(
        words.map(w =>
          w.id === data.id
            ? {
                ...w,
                english: data.english,
                uzbek: data.uzbek,
                transcription: data.transcription,
                example: data.example,
                exampleUz: data.exampleUz,
                partOfSpeech: data.partOfSpeech,
                bookId: data.bookId,
                folderId: data.folderId,
              }
            : w
        )
      );
    } else {
      // Create
      const newWord: Word = {
        id: 'word-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        english: data.english,
        uzbek: data.uzbek,
        transcription: data.transcription,
        example: data.example,
        exampleUz: data.exampleUz,
        partOfSpeech: data.partOfSpeech,
        bookId: data.bookId,
        folderId: data.folderId,
        timesStudied: 0,
        timesCorrect: 0,
        timesIncorrect: 0,
        consecutiveCorrect: 0,
        masteryLevel: 0,
        createdAt: new Date().toISOString(),
      };
      handleUpdateWords([newWord, ...words]);
    }
  };

  // Bulk import 1000 - 2000+ words
  const handleBulkImport = (
    newItems: Array<Omit<Word, 'id' | 'createdAt' | 'timesStudied' | 'timesCorrect' | 'timesIncorrect' | 'consecutiveCorrect' | 'masteryLevel'>>
  ) => {
    const timestamp = new Date().toISOString();
    const createdWords: Word[] = newItems.map((item, idx) => ({
      ...item,
      id: `w-${Date.now()}-${idx}`,
      timesStudied: 0,
      timesCorrect: 0,
      timesIncorrect: 0,
      consecutiveCorrect: 0,
      masteryLevel: 0,
      createdAt: timestamp,
    }));

    handleUpdateWords([...createdWords, ...words]);
  };

  // Word interactions
  const handleToggleStar = (wordId: string) => {
    handleUpdateWords(
      words.map(w => (w.id === wordId ? { ...w, isStarred: !w.isStarred } : w))
    );
  };

  const handleDeleteWord = (wordId: string) => {
    handleUpdateWords(words.filter(w => w.id !== wordId));
  };

  // Update words after test session
  const handleUpdateWordStats = (results: Array<{ wordId: string; isCorrect: boolean }>) => {
    const wordResultMap = new Map<string, { correct: number; incorrect: number }>();

    results.forEach(r => {
      const prev = wordResultMap.get(r.wordId) || { correct: 0, incorrect: 0 };
      if (r.isCorrect) {
        prev.correct += 1;
      } else {
        prev.incorrect += 1;
      }
      wordResultMap.set(r.wordId, prev);
    });

    const nowIso = new Date().toISOString();
    const updated = words.map(w => {
      const res = wordResultMap.get(w.id);
      if (!res) return w;

      const newCorrect = w.timesCorrect + res.correct;
      const newIncorrect = w.timesIncorrect + res.incorrect;
      const newStudied = w.timesStudied + res.correct + res.incorrect;

      let consecutive = res.incorrect > 0 ? 0 : w.consecutiveCorrect + res.correct;
      let mastery = w.masteryLevel;

      if (res.correct > res.incorrect) {
        if (consecutive >= 3 && mastery < 5) {
          mastery += 1;
        } else if (consecutive >= 1 && mastery < 3) {
          mastery += 1;
        }
      } else {
        // Drop mastery slightly if incorrect
        mastery = Math.max(0, mastery - 1);
      }

      return {
        ...w,
        timesStudied: newStudied,
        timesCorrect: newCorrect,
        timesIncorrect: newIncorrect,
        consecutiveCorrect: consecutive,
        masteryLevel: mastery,
        lastReviewedAt: nowIso,
      };
    });

    handleUpdateWords(updated);

    // Record streak activity
    const newStreak = recordStreakActivity();
    setStreak(newStreak);
  };

  // Save session record
  const handleSaveSession = (session: QuizSessionSummary) => {
    saveSession(session);
    setSessions(prev => [session, ...prev]);
  };

  // Reset to default dictionary
  const handleResetToDefaults = () => {
    handleUpdateBooks(DEFAULT_BOOKS);
    handleUpdateFolders(DEFAULT_FOLDERS);
    handleUpdateWords(DEFAULT_WORDS);
    setSelectedBookId(null);
    setSelectedFolderId(null);
    setActiveFilter('all');
  };

  // Restore backup
  const handleRestoreBackup = (backup: { books: Book[]; folders: Folder[]; words: Word[] }) => {
    handleUpdateBooks(backup.books);
    handleUpdateFolders(backup.folders);
    handleUpdateWords(backup.words);
  };

  // Start quiz with current view or custom words
  const startQuiz = (customWords?: Word[]) => {
    const pool = customWords && customWords.length > 0 ? customWords : words;
    setQuizWordsPool(pool);
    setIsQuizOpen(true);
  };

  // Selected entities for breadcrumb and list title
  const currentBook = useMemo(() => books.find(b => b.id === selectedBookId) || null, [books, selectedBookId]);
  const currentFolder = useMemo(() => folders.find(f => f.id === selectedFolderId) || null, [folders, selectedFolderId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-150">
      {/* Top Header */}
      <Header
        words={words}
        books={books}
        folders={folders}
        streak={streak}
        settings={settings}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
        onOpenAddWord={() => {
          setWordToEdit(null);
          setIsSingleWordOpen(true);
        }}
        onOpenQuiz={() => startQuiz()}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Left Tree Sidebar: Books & Folders */}
        <FolderSidebar
          books={books}
          folders={folders}
          words={words}
          selectedBookId={selectedBookId}
          selectedFolderId={selectedFolderId}
          activeFilter={activeFilter}
          onSelectAll={() => {
            setSelectedBookId(null);
            setSelectedFolderId(null);
            setActiveFilter('all');
          }}
          onSelectBook={bookId => {
            setSelectedBookId(bookId);
            setSelectedFolderId(null);
            setActiveFilter('all');
          }}
          onSelectFolder={folderId => {
            const f = folders.find(item => item.id === folderId);
            if (f) setSelectedBookId(f.bookId);
            setSelectedFolderId(folderId);
            setActiveFilter('all');
          }}
          onSelectFilter={filter => {
            setSelectedBookId(null);
            setSelectedFolderId(null);
            setActiveFilter(filter);
          }}
          onCreateBook={handleCreateBook}
          onEditBook={handleEditBook}
          onDeleteBook={handleDeleteBook}
          onCreateFolder={handleCreateFolder}
          onEditFolder={handleEditFolder}
          onDeleteFolder={handleDeleteFolder}
        />

        {/* Center Content: Word List & Details */}
        <WordList
          words={words}
          books={books}
          folders={folders}
          currentBook={currentBook}
          currentFolder={currentFolder}
          activeFilter={activeFilter}
          onToggleStar={handleToggleStar}
          onEditWord={word => {
            setWordToEdit(word);
            setIsSingleWordOpen(true);
          }}
          onDeleteWord={handleDeleteWord}
          onOpenAddWord={() => {
            setWordToEdit(null);
            setIsSingleWordOpen(true);
          }}
          onOpenBulkImport={() => setIsBulkImportOpen(true)}
          onStartQuiz={filteredWords => startQuiz(filteredWords)}
        />
      </div>

      {/* MODALS */}

      {/* 1. Bulk Import (1000-2000+ words) */}
      {isBulkImportOpen && (
        <BulkImportModal
          books={books}
          folders={folders}
          existingWords={words}
          selectedBookId={selectedBookId}
          selectedFolderId={selectedFolderId}
          onClose={() => setIsBulkImportOpen(false)}
          onImport={handleBulkImport}
          onCreateFolder={handleCreateFolder}
        />
      )}

      {/* 2. Single Word Add / Edit */}
      {isSingleWordOpen && (
        <SingleWordModal
          wordToEdit={wordToEdit}
          books={books}
          folders={folders}
          defaultBookId={selectedBookId}
          defaultFolderId={selectedFolderId}
          onClose={() => {
            setIsSingleWordOpen(false);
            setWordToEdit(null);
          }}
          onSave={handleSaveSingleWord}
        />
      )}

      {/* 3. Quiz & Test Engine */}
      {isQuizOpen && (
        <QuizEngine
          wordsPool={quizWordsPool}
          allWords={words}
          settings={settings}
          onClose={() => setIsQuizOpen(false)}
          onUpdateWordStats={handleUpdateWordStats}
          onSaveSession={handleSaveSession}
        />
      )}

      {/* 4. Statistics & Analytics */}
      {isStatsOpen && (
        <StatisticsModal
          words={words}
          books={books}
          folders={folders}
          sessions={sessions}
          streak={streak}
          onClose={() => setIsStatsOpen(false)}
        />
      )}

      {/* 5. Standalone Offline HTML Export & Backup */}
      {isExportOpen && (
        <OfflineExportModal
          books={books}
          folders={folders}
          words={words}
          onClose={() => setIsExportOpen(false)}
          onRestoreBackup={handleRestoreBackup}
        />
      )}

      {/* 6. Settings */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetToDefaults={handleResetToDefaults}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
