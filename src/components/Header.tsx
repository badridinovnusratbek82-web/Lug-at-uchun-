import React from 'react';
import { BookOpen, Flame, Plus, Upload, Download, BarChart3, Settings, Play } from 'lucide-react';
import { AppSettings, Book, Folder, Word } from '../types';

interface HeaderProps {
  words: Word[];
  books: Book[];
  folders: Folder[];
  streak: number;
  settings: AppSettings;
  onOpenBulkImport: () => void;
  onOpenAddWord: () => void;
  onOpenQuiz: () => void;
  onOpenStats: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  words,
  streak,
  onOpenBulkImport,
  onOpenAddWord,
  onOpenQuiz,
  onOpenStats,
  onOpenExport,
  onOpenSettings,
}) => {
  const masteredCount = words.filter(w => w.masteryLevel >= 4).length;
  const learningCount = words.filter(w => w.masteryLevel > 0 && w.masteryLevel < 4).length;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                Lug'atMaster
              </h1>
              {/* Clean unboxed metadata according to design principles */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>{words.length} ta so'z</span>
                <span aria-hidden="true">·</span>
                <span>{masteredCount} o'zlashtirilgan</span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{learningCount} jarayonda</span>
              </div>
            </div>
          </div>

          {/* Daily streak */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 rounded-lg text-amber-800 dark:text-amber-300 text-xs font-medium">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{streak} kunlik streak</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Main Quiz CTA button */}
          <button
            onClick={onOpenQuiz}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm hover:shadow"
            title="Test / Quiz boshlash"
          >
            <Play className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">Quiz Boshlash</span>
            <span className="sm:hidden">Test</span>
          </button>

          {/* Bulk Import button (1000+ words) */}
          <button
            onClick={onOpenBulkImport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-200/80 dark:border-slate-700/60"
            title="1000-2000 ta so'zni birdaniga kiritish"
          >
            <Upload className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="hidden md:inline">Ommaviy kiritish</span>
          </button>

          {/* Add single word */}
          <button
            onClick={onOpenAddWord}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-200/80 dark:border-slate-700/60"
            title="Yangi so'z qo'shish"
          >
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden lg:inline">Yangi so'z</span>
          </button>

          {/* Stats modal button */}
          <button
            onClick={onOpenStats}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Statistika va progress"
            aria-label="Statistika"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {/* Standalone HTML and Export */}
          <button
            onClick={onOpenExport}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Yuklab olish / Ofline HTML"
            aria-label="Ofline HTML faylni yuklab olish"
          >
            <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Sozlamalar"
            aria-label="Sozlamalar"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
