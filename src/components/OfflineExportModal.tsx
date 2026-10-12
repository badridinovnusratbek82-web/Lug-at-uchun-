import React, { useRef } from 'react';
import { X, Download, FileCode, Database, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { Book, Folder, Word } from '../types';
import { generateStandaloneHtml, triggerDownload } from '../utils/storage';

interface OfflineExportModalProps {
  books: Book[];
  folders: Folder[];
  words: Word[];
  onClose: () => void;
  onRestoreBackup: (backup: { books: Book[]; folders: Folder[]; words: Word[] }) => void;
}

export const OfflineExportModal: React.FC<OfflineExportModalProps> = ({
  books,
  folders,
  words,
  onClose,
  onRestoreBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Download Standalone Offline HTML File (User's primary requirement!)
  const handleDownloadStandaloneHtml = () => {
    const htmlString = generateStandaloneHtml(books, folders, words);
    triggerDownload(htmlString, 'lugatmaster_offline.html', 'text/html');
  };

  // 2. Download Full JSON Backup
  const handleDownloadJsonBackup = () => {
    const data = JSON.stringify({ books, folders, words, exportedAt: new Date().toISOString() }, null, 2);
    triggerDownload(data, `lugatmaster_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  // 3. Download CSV for Excel
  const handleDownloadCsv = () => {
    const bookMap = new Map(books.map(b => [b.id, b.title]));
    const folderMap = new Map(folders.map(f => [f.id, f.title]));

    const header = ['Inglizcha', "O'zbekcha", 'Transkripsiya', 'Misol', 'Kitob', 'Papka', 'Daraja'].join(',');
    const rows = words.map(w => [
      `"${w.english.replace(/"/g, '""')}"`,
      `"${w.uzbek.replace(/"/g, '""')}"`,
      `"${(w.transcription || '').replace(/"/g, '""')}"`,
      `"${(w.example || '').replace(/"/g, '""')}"`,
      `"${(bookMap.get(w.bookId) || '').replace(/"/g, '""')}"`,
      `"${(folderMap.get(w.folderId) || '').replace(/"/g, '""')}"`,
      w.masteryLevel,
    ].join(','));

    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    triggerDownload(csvContent, 'lugatmaster_words.csv', 'text/csv;charset=utf-8;');
  };

  // 4. Handle JSON Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.words) && Array.isArray(parsed.books)) {
          onRestoreBackup(parsed);
          alert("Zaxira muvaffaqiyatli tiklandi!");
          onClose();
        } else {
          alert("Fayl formati to'g'ri kelmadi!");
        }
      } catch {
        alert("Faylni o'qishda xatolik yuz berdi!");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ofline Yuklab Olish & Zaxira
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Internet yo'q joyda ham telefon yoki kompyuterda ishlatish
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

        {/* Content Options */}
        <div className="p-6 space-y-3.5 overflow-y-auto max-h-[80vh]">
          {/* Option 1: Standalone HTML (Featured) */}
          <div className="p-4 rounded-xl border-2 border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20 hover:border-indigo-500 transition-all flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bitta Faylli Ofline HTML Yuklab Olish (Tavsiya etiladi)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Barcha {words.length} ta so'zingiz va tezkor quiz tizimi bitta faylga joylanadi. Uni telefonda <strong>HTML Viewer</strong> dasturida yoki kompyuterda faylga 2 marta bosib brauzerda 100% internetsiz ishlatishingiz mumkin!
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/50 flex justify-end">
              <button
                onClick={handleDownloadStandaloneHtml}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>lugatmaster_offline.html ni yuklash</span>
              </button>
            </div>
          </div>

          {/* Option 2: Full JSON Backup */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  To'liq JSON Zaxira Fayli
                </h4>
                <p className="text-[11px] text-slate-500">
                  Barcha kitoblar, papkalar va so'zlar zaxirasi
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadJsonBackup}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
            >
              Yuklash
            </button>
          </div>

          {/* Option 3: Excel CSV Export */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Excel CSV Jadval
                </h4>
                <p className="text-[11px] text-slate-500">
                  Excel yoki Google Sheets da ko'rish uchun jadval
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
            >
              CSV Yuklash
            </button>
          </div>

          {/* Option 4: Restore Backup */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Zaxiradan Tiklash
                </h4>
                <p className="text-[11px] text-slate-500">
                  Avval yuklab olingan JSON zaxirani qayta yuklash
                </p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
            >
              Faylni tanlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
