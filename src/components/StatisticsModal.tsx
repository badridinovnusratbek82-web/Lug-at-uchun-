import React from 'react';
import { X, Award, Flame, CheckCircle2, TrendingUp, AlertCircle, Clock, BookOpen } from 'lucide-react';
import { Book, Folder, QuizSessionSummary, Word } from '../types';

interface StatisticsModalProps {
  words: Word[];
  books: Book[];
  folders: Folder[];
  sessions: QuizSessionSummary[];
  streak: number;
  onClose: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  words,
  books,
  folders,
  sessions,
  streak,
  onClose,
}) => {
  // Mastery distribution
  const masteredWords = words.filter(w => w.masteryLevel >= 4);
  const learningWords = words.filter(w => w.masteryLevel > 0 && w.masteryLevel < 4);
  const newWords = words.filter(w => w.timesStudied === 0);
  const strugglingWords = words.filter(w => w.timesIncorrect > w.timesCorrect || (w.timesIncorrect > 0 && w.masteryLevel < 2));

  const totalStudies = words.reduce((acc, w) => acc + w.timesStudied, 0);
  const totalCorrect = words.reduce((acc, w) => acc + w.timesCorrect, 0);
  const overallAccuracy = totalStudies > 0 ? Math.round((totalCorrect / totalStudies) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                O'rganish Statistikasi va Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Barcha so'zlaringiz va test natijalaringiz tahlili
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jami so'zlar</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {words.length}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">O'zlashtirilgan</span>
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {masteredWords.length}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Streak</span>
              </div>
              <div className="text-xl font-bold text-amber-500">
                {streak} kun
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aniqlik</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {overallAccuracy}%
              </div>
            </div>
          </div>

          {/* Overall Mastery Distribution Progress Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Lug'at o'zlashtirish balansi</span>
              <span>{Math.round((masteredWords.length / Math.max(1, words.length)) * 100)}% to'liq</span>
            </div>

            {/* Stacked Multi-color Progress Bar */}
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${(masteredWords.length / Math.max(1, words.length)) * 100}%` }}
                title={`O'zlashtirilgan: ${masteredWords.length}`}
              />
              <div
                className="bg-indigo-500 h-full transition-all"
                style={{ width: `${(learningWords.length / Math.max(1, words.length)) * 100}%` }}
                title={`Jarayonda: ${learningWords.length}`}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${(strugglingWords.length / Math.max(1, words.length)) * 100}%` }}
                title={`Qiyin: ${strugglingWords.length}`}
              />
            </div>

            {/* Legend (Zero-pill text representation) */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>O'zlashtirilgan ({masteredWords.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>O'rganilmoqda ({learningWords.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Xato ko'p qilingan ({strugglingWords.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span>Yangi ({newWords.length})</span>
              </div>
            </div>
          </div>

          {/* Progress per folder */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Papkalar bo'yicha rivojlanish
            </h4>
            <div className="space-y-3">
              {folders.map(folder => {
                const folderWords = words.filter(w => w.folderId === folder.id);
                if (folderWords.length === 0) return null;

                const fMastered = folderWords.filter(w => w.masteryLevel >= 4).length;
                const fPercent = Math.round((fMastered / folderWords.length) * 100);

                return (
                  <div key={folder.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {folder.title}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {fMastered} / {folderWords.length} ({fPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                        style={{ width: `${fPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Past Quiz Sessions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              So'nggi Test Natijalari
            </h4>
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                Hozircha hech qanday test topshirilmagan.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sessions.slice(0, 10).map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {new Date(s.date).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="capitalize text-slate-500">
                        {s.mode.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-semibold">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {s.correctAnswers}/{s.totalQuestions}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {s.accuracy}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
