import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Volume2,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Keyboard,
  Award,
  Zap,
  Check,
  Eye,
} from 'lucide-react';
import { AppSettings, QuizMode, QuizQuestion, QuizSessionSummary, Word } from '../types';
import { soundManager } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';

interface QuizEngineProps {
  wordsPool: Word[];
  allWords: Word[];
  settings: AppSettings;
  onClose: () => void;
  onUpdateWordStats: (results: Array<{ wordId: string; isCorrect: boolean }>) => void;
  onSaveSession: (session: QuizSessionSummary) => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  wordsPool,
  allWords,
  settings,
  onClose,
  onUpdateWordStats,
  onSaveSession,
}) => {
  // Mode selection or active test
  const [selectedMode, setSelectedMode] = useState<QuizMode>('mcq_en_to_uz');
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Active quiz queue
  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Interactive Question State
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState<boolean | null>(null);

  // Spelling mode input
  const [typingInput, setTypingInput] = useState('');

  // Flashcard mode state
  const [isFlipped, setIsFlipped] = useState(false);

  // Session stats tracking
  const [sessionResults, setSessionResults] = useState<Array<{ wordId: string; isCorrect: boolean }>>([]);
  const [mistakeWordIds, setMistakeWordIds] = useState<string[]>([]);
  const [consecutiveStreak, setConsecutiveStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Total original questions planned
  const [initialCount, setInitialCount] = useState(15);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(settings.autoAdvance);

  // Active current word
  const currentWord: Word | undefined = queue[currentIndex];

  // Initialize and start quiz
  const startQuizWithMode = (mode: QuizMode, countLimit: number = 20) => {
    let source = [...wordsPool];

    if (mode === 'mistakes') {
      source = allWords.filter(w => w.timesIncorrect > w.timesCorrect || (w.timesIncorrect > 0 && w.masteryLevel < 3));
      if (source.length === 0) {
        alert("Sizda hali xato qilingan so'zlar yo'q! Boshqa rejimni tanlang.");
        return;
      }
    }

    if (source.length === 0) {
      alert("Test uchun so'zlar yetarli emas!");
      return;
    }

    // Shuffle
    const shuffled = [...source].sort(() => 0.5 - Math.random()).slice(0, countLimit);
    setQueue(shuffled);
    setInitialCount(shuffled.length);
    setCurrentIndex(0);
    setSelectedMode(mode);
    setIsQuizStarted(true);
    setIsCompleted(false);
    setSessionResults([]);
    setMistakeWordIds([]);
    setConsecutiveStreak(0);
    setBestStreak(0);
  };

  // Prepare current question whenever currentIndex or queue changes
  useEffect(() => {
    if (!isQuizStarted || !currentWord || isCompleted) return;

    setHasAnswered(false);
    setSelectedAnswer(null);
    setIsCurrentCorrect(null);
    setTypingInput('');
    setIsFlipped(false);

    // Auto speak in english modes or listening mode
    if (selectedMode === 'listening' || selectedMode === 'mcq_en_to_uz' || selectedMode === 'flashcards') {
      soundManager.speak(currentWord.english);
    }

    // Generate options for multiple choice or listening modes
    if (selectedMode === 'mcq_en_to_uz' || selectedMode === 'mcq_uz_to_en' || selectedMode === 'listening' || selectedMode === 'mistakes') {
      const isUzbekOptions = selectedMode === 'mcq_en_to_uz' || selectedMode === 'listening' || selectedMode === 'mistakes';
      const correctAnswer = isUzbekOptions ? currentWord.uzbek : currentWord.english;

      // Select 3 distractors from allWords
      const distractors = allWords
        .filter(w => w.id !== currentWord.id)
        .map(w => (isUzbekOptions ? w.uzbek : w.english))
        .filter(text => text !== correctAnswer)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());
      setCurrentOptions(options);
    }
  }, [currentIndex, isQuizStarted, currentWord, selectedMode, allWords, isCompleted]);

  // Handle user selecting an option or submitting answer
  const handleAnswer = useCallback((answer: string) => {
    if (hasAnswered || !currentWord) return;

    setHasAnswered(true);
    setSelectedAnswer(answer);

    const isUzbekTarget = selectedMode === 'mcq_en_to_uz' || selectedMode === 'listening' || selectedMode === 'mistakes';
    const expected = (isUzbekTarget ? currentWord.uzbek : currentWord.english).trim().toLowerCase();
    const actual = answer.trim().toLowerCase();

    // Check correctness: exact match or contains
    const isCorrect = actual === expected || (expected.includes(',') && expected.split(',').some(p => p.trim() === actual));

    setIsCurrentCorrect(isCorrect);
    setSessionResults(prev => [...prev, { wordId: currentWord.id, isCorrect }]);

    if (isCorrect) {
      soundManager.playCorrect();
      const newStreak = consecutiveStreak + 1;
      setConsecutiveStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      // User requirement: "har safar togri javobni bersa avtomatik keyingi savolga otsin"
      if (autoAdvanceEnabled) {
        setTimeout(() => {
          advanceToNext();
        }, settings.autoAdvanceDelayMs || 450);
      }
    } else {
      soundManager.playIncorrect();
      setConsecutiveStreak(0);
      setMistakeWordIds(prev => (prev.includes(currentWord.id) ? prev : [...prev, currentWord.id]));

      // Speak pronunciation so they hear it
      soundManager.speak(currentWord.english);

      // User requirement: "xato bolsa xatolarni tahlil qilib, ularni keyinroq qayta so'rasin"
      // Re-queue the missed word at the end so they MUST get it right before finishing!
      setQueue(prevQueue => [...prevQueue, currentWord]);
    }
  }, [hasAnswered, currentWord, selectedMode, consecutiveStreak, bestStreak, autoAdvanceEnabled, settings.autoAdvanceDelayMs]);

  // Handle Flashcard self-rating
  const handleFlashcardRating = (known: boolean) => {
    if (!currentWord) return;

    setSessionResults(prev => [...prev, { wordId: currentWord.id, isCorrect: known }]);

    if (known) {
      soundManager.playCorrect();
      setConsecutiveStreak(s => s + 1);
      advanceToNext();
    } else {
      soundManager.playIncorrect();
      setConsecutiveStreak(0);
      setMistakeWordIds(prev => (prev.includes(currentWord.id) ? prev : [...prev, currentWord.id]));
      soundManager.speak(currentWord.english);
      // Re-queue
      setQueue(prevQueue => [...prevQueue, currentWord]);
      advanceToNext();
    }
  };

  // Move to next question or complete
  const advanceToNext = () => {
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Quiz finished!
      completeQuiz();
    }
  };

  // Complete session and calculate statistics
  const completeQuiz = () => {
    setIsCompleted(true);
    soundManager.playCelebration();
    triggerConfetti();

    // Notify parent to persist word masteries and statistics
    onUpdateWordStats(sessionResults);

    const correctCount = sessionResults.filter(r => r.isCorrect).length;
    const summary: QuizSessionSummary = {
      id: 'session-' + Date.now(),
      date: new Date().toISOString(),
      mode: selectedMode,
      totalQuestions: sessionResults.length,
      correctAnswers: correctCount,
      incorrectAnswers: sessionResults.length - correctCount,
      accuracy: sessionResults.length > 0 ? Math.round((correctCount / sessionResults.length) * 100) : 0,
      wordsPracticedCount: new Set(sessionResults.map(r => r.wordId)).size,
      mistakeWordIds,
    };

    onSaveSession(summary);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isQuizStarted || isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing into input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter' && selectedMode === 'spelling' && typingInput.trim()) {
          e.preventDefault();
          handleAnswer(typingInput.trim());
        }
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (selectedMode === 'flashcards') {
          setIsFlipped(f => !f);
          soundManager.playCardFlip();
        } else if (currentWord) {
          soundManager.speak(currentWord.english);
        }
        return;
      }

      // Keys 1, 2, 3, 4 for options
      if (['1', '2', '3', '4'].includes(e.key) && currentOptions.length >= 4 && !hasAnswered) {
        const idx = parseInt(e.key, 10) - 1;
        if (currentOptions[idx]) {
          handleAnswer(currentOptions[idx]);
        }
      }

      // Enter to advance when answered and waiting
      if (e.key === 'Enter' && hasAnswered) {
        e.preventDefault();
        advanceToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuizStarted, isCompleted, currentOptions, hasAnswered, selectedMode, typingInput, currentWord, handleAnswer]);

  // Statistics summaries
  const totalCorrectSoFar = sessionResults.filter(r => r.isCorrect).length;
  const totalAnsweredSoFar = sessionResults.length;
  const currentAccuracy = totalAnsweredSoFar > 0 ? Math.round((totalCorrectSoFar / totalAnsweredSoFar) * 100) : 100;
  const progressPercent = Math.min(100, Math.round(((currentIndex) / Math.max(queue.length, initialCount)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-indigo-600 dark:fill-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {isQuizStarted ? "Interaktiv Quiz & Yodlash" : "Quiz Rejimini Tanlang"}
              </h3>
              {isQuizStarted && !isCompleted && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>Savol: {currentIndex + 1} / {queue.length}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentAccuracy}% aniqlik</span>
                  {consecutiveStreak > 1 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-500 font-semibold">🔥 {consecutiveStreak} streak</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto advance toggle inside quiz */}
            {isQuizStarted && !isCompleted && (
              <button
                type="button"
                onClick={() => setAutoAdvanceEnabled(prev => !prev)}
                className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                  autoAdvanceEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
                title="To'g'ri javob berganda avtomatik keyingisiga o'tish"
              >
                Avto-o'tish: {autoAdvanceEnabled ? "YOQILGAN" : "O'CHIQ"}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isQuizStarted && !isCompleted && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* MAIN BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {!isQuizStarted ? (
            /* Mode Selector View */
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Qaysi usulda yodlamoqchisiz?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tanlangan bo'limda {wordsPool.length} ta so'z mavjud. Xato qilsangiz, tizim ularni avtomatik takrorlatadi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => startQuizWithMode('mcq_en_to_uz')}
                  className="flex items-start gap-3 p-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    🔤
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      4 ta Variant (EN &rarr; UZ)
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Inglizcha so'z beriladi, 4 ta o'zbekcha tarjimadan to'g'risini topasiz.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => startQuizWithMode('mcq_uz_to_en')}
                  className="flex items-start gap-3 p-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    🔄
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      4 ta Variant (UZ &rarr; EN)
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      O'zbekcha ma'nosi beriladi, inglizcha to'g'ri variantini tanlaysiz.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => startQuizWithMode('spelling')}
                  className="flex items-start gap-3 p-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    ✍️
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      Imlo & Yozish Testi
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      O'zbekcha ma'noga qarab inglizcha so'zni klaviaturada to'liq yozasiz.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => startQuizWithMode('flashcards')}
                  className="flex items-start gap-3 p-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    🃏
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      Flesh-kartalar (3D Flip)
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Kartani o'giring, o'zingizni tekshiring va "Bildim / Bilmadim" deb baholang.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => startQuizWithMode('listening')}
                  className="flex items-start gap-3 p-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    🎧
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      Tinglab Topish (Listening)
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      So'z ovozda o'qiladi, eshitish orqali to'g'ri ma'nosini aniqlaysiz.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => startQuizWithMode('mistakes')}
                  className="flex items-start gap-3 p-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    🎯
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      Xatolar Ustida Ishlash
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Avvalgi testlarda xato qilingan so'zlarni 100% o'zlashtirish uchun takrorlash.
                    </p>
                  </div>
                </button>
              </div>

              {/* Keyboard shortcuts tip */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 pt-2">
                <span className="flex items-center gap-1">
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Tezkor tugmalar:</span>
                </span>
                <span><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">1</kbd>–<kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">4</kbd> Variantlar</span>
                <span><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">Space</kbd> Ovoz / O'girish</span>
                <span><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">Enter</kbd> Tasdiqlash</span>
              </div>
            </div>
          ) : isCompleted ? (
            /* Quiz Completion View */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Ajoyib Natija! Test Yakunlandi
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Barcha so'zlar takrorlandi va xatolar tuzatildi.
                </p>
              </div>

              {/* Score Badges */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {currentAccuracy}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Aniqlik foizi</div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {totalCorrectSoFar}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">To'g'ri javoblar</div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div className="text-xl font-bold text-amber-500">
                    {bestStreak}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Eng yaxshi streak</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                {mistakeWordIds.length > 0 && (
                  <button
                    onClick={() => startQuizWithMode('mistakes')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Xatolarni qayta yechish ({mistakeWordIds.length})</span>
                  </button>
                )}

                <button
                  onClick={() => startQuizWithMode(selectedMode)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Yana bir bor topshirish</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Lug'atga qaytish
                </button>
              </div>
            </div>
          ) : currentWord ? (
            /* ACTIVE QUESTION VIEW */
            <div className="space-y-6">
              {/* Question Header */}
              <div className="text-center py-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 relative">
                {/* Main Prominent Prompt */}
                <div className="flex items-center justify-center gap-3">
                  <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {selectedMode === 'mcq_uz_to_en' || selectedMode === 'spelling'
                      ? currentWord.uzbek
                      : selectedMode === 'listening'
                      ? "🎧 Ovozni eshiting va toping"
                      : currentWord.english}
                  </h4>

                  {/* Speaker Button */}
                  <button
                    type="button"
                    onClick={() => soundManager.speak(currentWord.english)}
                    className="p-2 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl shadow-xs transition-transform active:scale-95"
                    title="Qayta eshitish (Space)"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Transcription (hidden in listening mode before answer) */}
                {currentWord.transcription && selectedMode !== 'listening' && (
                  <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                    {currentWord.transcription}
                  </div>
                )}

                {/* Subtitle helper */}
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  {selectedMode === 'mcq_uz_to_en'
                    ? "Ushbu ma'noga mos inglizcha so'zni tanlang"
                    : selectedMode === 'spelling'
                    ? "Inglizcha yozilishini kiriting"
                    : selectedMode === 'listening'
                    ? "Talaffuz qilingan so'zning o'zbekcha tarjimasini toping"
                    : "To'g'ri o'zbekcha tarjimasini tanlang"}
                </div>
              </div>

              {/* 1. Multiple Choice Options (4 ta variant) */}
              {(selectedMode === 'mcq_en_to_uz' || selectedMode === 'mcq_uz_to_en' || selectedMode === 'listening' || selectedMode === 'mistakes') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentOptions.map((opt, idx) => {
                    const isSelected = selectedAnswer === opt;
                    const isUzbekTarget = selectedMode === 'mcq_en_to_uz' || selectedMode === 'listening' || selectedMode === 'mistakes';
                    const expectedTarget = isUzbekTarget ? currentWord.uzbek : currentWord.english;
                    const isTheCorrectOption = opt.toLowerCase() === expectedTarget.toLowerCase();

                    let btnClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/20";

                    if (hasAnswered) {
                      if (isTheCorrectOption) {
                        btnClass = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500";
                      } else if (isSelected && !isCurrentCorrect) {
                        btnClass = "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500";
                      } else {
                        btnClass = "opacity-50 border-slate-200 dark:border-slate-800 text-slate-400";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={hasAnswered}
                        onClick={() => handleAnswer(opt)}
                        className={`group relative flex items-center justify-between p-3.5 rounded-xl border text-sm font-medium transition-all text-left ${btnClass}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>

                        {hasAnswered && isTheCorrectOption && (
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        {hasAnswered && isSelected && !isCurrentCorrect && (
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. Spelling / Typing Mode */}
              {selectedMode === 'spelling' && (
                <div className="space-y-4">
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      if (typingInput.trim()) handleAnswer(typingInput.trim());
                    }}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Inglizcha so'zni yozing..."
                        value={typingInput}
                        onChange={e => setTypingInput(e.target.value)}
                        disabled={hasAnswered}
                        autoFocus
                        className="w-full text-base font-semibold px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      {!hasAnswered && (
                        <button
                          type="submit"
                          disabled={!typingInput.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-40"
                        >
                          Tekshirish
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* 3. Flashcards 3D Interactive Mode */}
              {selectedMode === 'flashcards' && (
                <div className="space-y-4">
                  <div
                    onClick={() => {
                      setIsFlipped(f => !f);
                      soundManager.playCardFlip();
                    }}
                    className="cursor-pointer min-h-[220px] rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-950 p-6 flex flex-col items-center justify-center text-center shadow-md hover:shadow-lg transition-all"
                  >
                    {!isFlipped ? (
                      <div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                          {currentWord.english}
                        </div>
                        {currentWord.transcription && (
                          <div className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                            {currentWord.transcription}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mt-6 flex items-center justify-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tarjimani ko'rish uchun bosing (Space)</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                          {currentWord.uzbek}
                        </div>
                        {currentWord.example && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 italic max-w-sm mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                            "{currentWord.example}"
                            {currentWord.exampleUz && (
                              <div className="text-slate-400 not-italic mt-1">
                                {currentWord.exampleUz}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rating Buttons */}
                  <div className="flex items-center gap-3 justify-center pt-2">
                    <button
                      onClick={() => handleFlashcardRating(false)}
                      className="flex-1 max-w-xs py-3 px-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Eslay olmadim (Qayta so'rash)</span>
                    </button>
                    <button
                      onClick={() => handleFlashcardRating(true)}
                      className="flex-1 max-w-xs py-3 px-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Bilaman (Keyingisiga)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MISTAKE ANALYSIS & CORRECTION CARD */}
              {/* User prompt requirement: "xato bolsa xatolarni tahlil qilib, ularni keyinroq qayta so'rasin" */}
              {hasAnswered && !isCurrentCorrect && selectedMode !== 'flashcards' && (
                <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-2 animate-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-start gap-2.5">
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        Xato javob berildi. Tahlil va to'g'ri javob:
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                        <span className="text-indigo-600 dark:text-indigo-400">{currentWord.english}</span> = <span className="text-emerald-700 dark:text-emerald-400">{currentWord.uzbek}</span>
                        {currentWord.transcription && (
                          <span className="text-xs font-mono text-slate-500 ml-2">
                            {currentWord.transcription}
                          </span>
                        )}
                      </div>
                      {currentWord.example && (
                        <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 italic">
                          Misol: "{currentWord.example}"
                          {currentWord.exampleUz && (
                            <div className="text-slate-500 not-italic mt-0.5">
                              {currentWord.exampleUz}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mt-2 text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                        ⚠️ Ushbu so'z test oxirida qayta so'raladi va to'g'ri topmaguningizcha takrorlanadi!
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={advanceToNext}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      <span>Tushundim, davom etish</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Correct notification if auto-advance is disabled */}
              {hasAnswered && isCurrentCorrect && !autoAdvanceEnabled && selectedMode !== 'flashcards' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>To'g'ri topdingiz!</span>
                  </div>
                  <button
                    onClick={advanceToNext}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    <span>Keyingi savol</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
