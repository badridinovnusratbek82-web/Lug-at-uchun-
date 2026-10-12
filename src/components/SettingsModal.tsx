import React from 'react';
import { X, Settings, Volume2, FastForward, Moon, Sun, RotateCcw, ShieldAlert } from 'lucide-react';
import { AppSettings } from '../types';
import { soundManager } from '../utils/audio';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetToDefaults: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetToDefaults,
  onClose,
}) => {
  const handleToggleAutoAdvance = () => {
    onUpdateSettings({ ...settings, autoAdvance: !settings.autoAdvance });
  };

  const handleToggleSound = () => {
    const nextSound = !settings.soundEffects;
    soundManager.setSoundEnabled(nextSound);
    onUpdateSettings({ ...settings, soundEffects: nextSound });
  };

  const handleRateChange = (rate: number) => {
    soundManager.setSpeechRate(rate);
    onUpdateSettings({ ...settings, speechRate: rate });
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Dastur Sozlamalari
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings list */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* 1. Auto Advance Toggle */}
          <div className="flex items-center justify-between">
            <div className="pr-4">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Avtomatik Keyingi Savolga O'tish
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                To'g'ri javob tanlanganda avtomatik keyingi savolga o'tadi
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleAutoAdvance}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.autoAdvance ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.autoAdvance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto advance delay slider */}
          {settings.autoAdvance && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-200/80 dark:border-slate-800">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>O'tish tezligi (kechikish)</span>
                <span>{settings.autoAdvanceDelayMs} ms</span>
              </div>
              <input
                type="range"
                min={200}
                max={1200}
                step={50}
                value={settings.autoAdvanceDelayMs}
                onChange={e => onUpdateSettings({ ...settings, autoAdvanceDelayMs: Number(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>
          )}

          {/* 2. Sound Effects */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="pr-4">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Ovoz Effektlari (Chimes)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                To'g'ri va xato javoblar uchun xushovoz tovushlar
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.soundEffects ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.soundEffects ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Speech Rate */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span>Talaffuz Tezligi (Speech Rate)</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{settings.speechRate}x</span>
            </div>
            <input
              type="range"
              min={0.6}
              max={1.3}
              step={0.1}
              value={settings.speechRate}
              onChange={e => handleRateChange(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Sekin (0.6x)</span>
              <span>Normal (0.9x)</span>
              <span>Tez (1.3x)</span>
            </div>
          </div>

          {/* 4. Theme Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Tungi / Kunduzgi Rejim
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Hozirgi holat: {settings.theme === 'dark' ? "Qorong'u (Dark)" : "Yorug' (Light)"}
              </div>
            </div>
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>

          {/* 5. Danger Zone: Reset to Defaults */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                if (confirm("Haqiqatan ham barcha ma'lumotlarni boshlang'ich holatiga qaytarmoqchimisiz?")) {
                  onResetToDefaults();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Boshlang'ich lug'atni qayta tiklash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
