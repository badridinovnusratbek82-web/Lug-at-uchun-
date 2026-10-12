import React, { useState, useMemo } from 'react';
import {
  Search,
  Volume2,
  Star,
  Trash2,
  Edit,
  ArrowUpDown,
  BookOpen,
  Plus,
  Upload,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Book, Folder, Word } from '../types';
import { soundManager } from '../utils/audio';

interface WordListProps {
  words: Word[];
  books: Book[];
  folders: Folder[];
  currentBook: Book | null;
  currentFolder: Folder | null;
  activeFilter: 'all' | 'starred' | 'mistakes' | 'mastered' | 'new';
  onToggleStar: (wordId: string) => void;
  onEditWord: (word: Word) => void;
  onDeleteWord: (wordId: string) => void;
  onOpenAddWord: () => void;
  onOpenBulkImport: () => void;
  onStartQuiz: (filteredWords: Word[]) => void;
}

export const WordList: React.FC<WordListProps> = ({
  words,
  books,
  folders,
  currentBook,
  currentFolder,
  activeFilter,
  onToggleStar,
  onEditWord,
  onDeleteWord,
  onOpenAddWord,
  onOpenBulkImport,
  onStartQuiz,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'az' | 'mistakes' | 'mastery'>('newest');

  // Filter and sort words
  const filteredWords = useMemo(() => {
    let result = words;

    // Filter by Folder or Book
    if (currentFolder) {
      result = result.filter(w => w.folderId === currentFolder.id);
    } else if (currentBook) {
      result = result.filter(w => w.bookId === currentBook.id);
    }

    // Filter by special category
    if (activeFilter === 'starred') {
      result = result.filter(w => w.isStarred);
    } else if (activeFilter === 'mistakes') {
      result = result.filter(w => w.timesIncorrect > w.timesCorrect || (w.timesIncorrect > 0 && w.masteryLevel < 2));
    } else if (activeFilter === 'mastered') {
      result = result.filter(w => w.masteryLevel >= 4);
    } else if (activeFilter === 'new') {
      result = result.filter(w => w.timesStudied === 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        w =>
          w.english.toLowerCase().includes(q) ||
          w.uzbek.toLowerCase().includes(q) ||
          (w.transcription && w.transcription.toLowerCase().includes(q)) ||
          (w.example && w.example.toLowerCase().includes(q))
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'az') {
        return a.english.localeCompare(b.english);
      }
      if (sortBy === 'mistakes') {
        return (b.timesIncorrect - b.timesCorrect) - (a.timesIncorrect - a.timesCorrect);
      }
      if (sortBy === 'mastery') {
        return b.masteryLevel - a.masteryLevel;
      }
      // 'newest' default
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [words, currentBook, currentFolder, activeFilter, searchQuery, sortBy]);

  const bookMap = useMemo(() => new Map(books.map(b => [b.id, b.title])), [books]);
  const folderMap = useMemo(() => new Map(folders.map(f => [f.id, f.title])), [folders]);

  // Title header text
  const sectionTitle = useMemo(() => {
    if (currentFolder) return currentFolder.title;
    if (currentBook) return currentBook.title;
    if (activeFilter === 'starred') return "Yulduzchali so'zlar";
    if (activeFilter === 'mistakes') return "Xato qilingan va murakkab so'zlar";
    if (activeFilter === 'mastered') return "O'zlashtirilgan so'zlar";
    if (activeFilter === 'new') return "Yangi o'rganilmagan so'zlar";
    return "Barcha Lug'at";
  }, [currentFolder, currentBook, activeFilter]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Top Bar with Context and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {sectionTitle}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredWords.length} ta
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {currentFolder?.description || currentBook?.description || "So'zlarni takrorlang, test topshiring va talaffuzini eshiting."}
          </p>
        </div>

        {/* Start Quiz CTA on this filtered set */}
        <div className="flex items-center gap-2.5">
          {filteredWords.length > 0 && (
            <button
              onClick={() => onStartQuiz(filteredWords)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              title="Shu bo'lim bo'yicha test boshlash"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Shu bo'limni sinash ({filteredWords.length})</span>
            </button>
          )}

          <button
            onClick={onOpenAddWord}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Qidiruv: inglizcha, o'zbekcha yoki transkripsiya..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Tozalash
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'newest' | 'az' | 'mistakes' | 'mastery')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="newest">Yangi qo'shilganlar</option>
            <option value="az">Alifbo bo'yicha (A &rarr; Z)</option>
            <option value="mistakes">Eng ko'p xato qilinganlar</option>
            <option value="mastery">O'zlashtirish darajasi</option>
          </select>
        </div>
      </div>

      {/* Word Cards Grid */}
      {filteredWords.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            {searchQuery ? "Hech qanday so'z topilmadi" : "Ushbu bo'limda so'zlar mavjud emas"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            {searchQuery
              ? `"${searchQuery}" so'rovi bo'yicha lug'atdan ma'lumot chiqmadi.`
              : "Yangi so'zlarni bittalab yoki 1000-2000 talab ommaviy matn orqali bir necha soniyada yuklashingiz mumkin."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenBulkImport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>1000+ so'zni ommaviy yuklash</span>
            </button>
            <button
              onClick={onOpenAddWord}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi so'z kiritish</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pb-8">
          {filteredWords.map(word => {
            const accuracy =
              word.timesStudied > 0
                ? Math.round((word.timesCorrect / word.timesStudied) * 100)
                : 0;

            return (
              <div
                key={word.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-800/80 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Word Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                          {word.english}
                        </span>
                        {/* Audio Pronunciation Button */}
                        <button
                          onClick={() => soundManager.speak(word.english)}
                          className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60 transition-colors"
                          title="Talaffuzni eshitish"
                          aria-label={`Talaffuz: ${word.english}`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {word.transcription && (
                        <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {word.transcription}
                        </div>
                      )}
                    </div>

                    {/* Star Favorite Button */}
                    <button
                      onClick={() => onToggleStar(word.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        word.isStarred
                          ? 'text-amber-500 fill-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                          : 'text-slate-300 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      title={word.isStarred ? "Yulduzchani olib tashlash" : "Muhimlarga qo'shish"}
                    >
                      <Star className={`w-4 h-4 ${word.isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Uzbek Translation */}
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-2">
                    {word.uzbek}
                  </div>

                  {/* Example sentence */}
                  {word.example && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 italic">
                      <p>"{word.example}"</p>
                      {word.exampleUz && (
                        <p className="text-slate-400 dark:text-slate-500 not-italic mt-0.5">
                          {word.exampleUz}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Metadata & Actions (Zero-pill discipline) */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{folderMap.get(word.folderId) || bookMap.get(word.bookId) || "Umumiy"}</span>
                    {word.timesStudied > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className={word.timesIncorrect > word.timesCorrect ? 'text-rose-500 font-medium' : ''}>
                          {accuracy}% to'g'ri ({word.timesCorrect}/{word.timesStudied})
                        </span>
                      </>
                    )}
                  </div>

                  {/* Edit and Delete Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {/* Mastery Level Stars (1-5) */}
                    <div className="flex items-center gap-0.5 mr-1.5" title={`O'zlashtirish darajasi: ${word.masteryLevel}/5`}>
                      {[1, 2, 3, 4, 5].map(lvl => (
                        <div
                          key={lvl}
                          className={`w-1.5 h-1.5 rounded-full ${
                            lvl <= word.masteryLevel
                              ? 'bg-emerald-500 dark:bg-emerald-400'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => onEditWord(word)}
                      className="p-1 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${word.english}" so'zini ro'yxatdan o'chirmoqchimisiz?`)) {
                          onDeleteWord(word.id);
                        }
                      }}
                      className="p-1 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
