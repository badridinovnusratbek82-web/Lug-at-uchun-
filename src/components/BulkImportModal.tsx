import React, { useState, useMemo } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, FileText, Plus, Sparkles } from 'lucide-react';
import { Book, Folder, Word } from '../types';
import { parseBulkText } from '../utils/storage';

interface BulkImportModalProps {
  books: Book[];
  folders: Folder[];
  existingWords: Word[];
  selectedBookId: string | null;
  selectedFolderId: string | null;
  onClose: () => void;
  onImport: (newWords: Array<Omit<Word, 'id' | 'createdAt' | 'timesStudied' | 'timesCorrect' | 'timesIncorrect' | 'consecutiveCorrect' | 'masteryLevel'>>) => void;
  onCreateFolder: (bookId: string, title: string) => Folder;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  books,
  folders,
  existingWords,
  selectedBookId,
  selectedFolderId,
  onClose,
  onImport,
  onCreateFolder,
}) => {
  const [text, setText] = useState('');
  const [targetBookId, setTargetBookId] = useState<string>(
    selectedBookId || books[0]?.id || ''
  );
  const [targetFolderId, setTargetFolderId] = useState<string>(
    selectedFolderId || folders.find(f => f.bookId === (selectedBookId || books[0]?.id))?.id || ''
  );

  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');

  // Update targetFolderId when targetBookId changes
  const availableFolders = useMemo(
    () => folders.filter(f => f.bookId === targetBookId),
    [folders, targetBookId]
  );

  // Live parse result
  const parseResult = useMemo(() => {
    if (!text.trim()) return { validWords: [], errors: [], totalParsed: 0, duplicateCount: 0 };
    return parseBulkText(text, existingWords);
  }, [text, existingWords]);

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderTitle.trim() || !targetBookId) return;
    const newFolder = onCreateFolder(targetBookId, newFolderTitle.trim());
    setTargetFolderId(newFolder.id);
    setNewFolderTitle('');
    setIsCreatingFolder(false);
  };

  const handleImportSubmit = () => {
    if (parseResult.validWords.length === 0) return;
    if (!targetBookId || !targetFolderId) {
      alert("Iltimos, so'zlar saqlanadigan Kitob va Papkani tanlang!");
      return;
    }

    const wordsToInsert = parseResult.validWords.map(item => ({
      english: item.english,
      uzbek: item.uzbek,
      transcription: item.transcription,
      example: item.example,
      bookId: targetBookId,
      folderId: targetFolderId,
    }));

    onImport(wordsToInsert);
    onClose();
  };

  const loadSampleText = () => {
    const sample = `apple [ˈæp.əl] - olma
banana [bəˈnɑː.nə] - banan
courage [ˈkʌr.ɪdʒ] - jasorat, shijoat
diligent [ˈdɪl.ɪ.dʒənt] - tirishqoq, g'ayratli
enthusiasm [ɪnˈθjuː.zi.æz.əm] - ishtiyoq, zavq
fascinating [ˈfæs.ɪ.neɪ.tɪŋ] - juda qiziqarli, maftunkor
gratitude [ˈɡræt.ɪ.tʃuːd] - minnatdorchilik
hesitate [ˈhez.ɪ.teɪt] - ikkilanmoq
illuminate [ɪˈluː.mɪ.neɪt] - yoritmoq, oydinlashtirmoq
journey [ˈdʒɜː.ni] - sayohat, yo'l
knowledge [ˈnɒl.ɪdʒ] - bilim, ma'lumot
liberty [ˈlɪb.ə.ti] - erkinlik, ozodlik
magnificent [mæɡˈnɪf.ɪ.sənt] - muhtasham, ajoyib
neglect [nɪˈɡlekt] - e'tiborsiz qoldirmoq
opportunity [ˌɒp.əˈtʃuː.nə.ti] - imkoniyat, qulay vaziyat
persevere [ˌpɜː.sɪˈvɪər] - taslim bo'lmaslik, sabr qilmoq
quit [kwɪt] - to'xtatmoq, tark etmoq
remarkable [rɪˈmɑː.kə.bəl] - ajoyib, ko'zga ko'ringan
succeed [səkˈsiːd] - muvaffaqiyat qozonmoq
tolerate [ˈtɒl.ər.eɪt] - chidamoq, toqat qilmoq`;
    setText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ommaviy So'z Kiritish (1000 - 2000+)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Minglab so'zlarni nusxalab joylang yoki fayldan kiritish
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Destination Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Qaysi Kitobga qo'shilsin?
              </label>
              <select
                value={targetBookId}
                onChange={e => {
                  setTargetBookId(e.target.value);
                  const firstFolder = folders.find(f => f.bookId === e.target.value);
                  if (firstFolder) setTargetFolderId(firstFolder.id);
                }}
                className="w-full text-xs font-medium p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Qaysi Papkaga?
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(true)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Yangi papka</span>
                </button>
              </div>

              {isCreatingFolder ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Papka nomi..."
                    value={newFolderTitle}
                    onChange={e => setNewFolderTitle(e.target.value)}
                    autoFocus
                    className="flex-1 text-xs p-1.5 bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewFolder}
                    className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-medium"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="text-xs text-slate-400 px-1"
                  >
                    Bekor
                  </button>
                </div>
              ) : (
                <select
                  value={targetFolderId}
                  onChange={e => setTargetFolderId(e.target.value)}
                  className="w-full text-xs font-medium p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {availableFolders.length === 0 ? (
                    <option value="">Papkalar yo'q (Yangi papka oching)</option>
                  ) : (
                    availableFolders.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
          </div>

          {/* Format instructions & demo helper */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Format: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">inglizcha - o'zbekcha</code> yoki <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Excel / Tab jadval</code>
            </span>
            <button
              type="button"
              onClick={loadSampleText}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Namuna so'zlarni yuklash</span>
            </button>
          </div>

          {/* Textarea */}
          <div>
            <textarea
              rows={12}
              placeholder={`Inglizcha va o'zbekcha so'zlarni qatorlab yozing yoki nusxalang:\n\nword - so'z\nbook [bʊk] - kitob\nlearn : o'rganmoq\napple = olma\nteach\to'rgatmoq`}
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full p-3 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Live Parser Feedback */}
          {text.trim() && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {parseResult.totalParsed} ta so'z aniqlandi
                  </span>
                </div>
                {parseResult.duplicateCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {parseResult.duplicateCount} ta takroriy so'z
                  </span>
                )}
              </div>

              {parseResult.errors.length > 0 && (
                <div className="text-rose-600 dark:text-rose-400 flex items-start gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{parseResult.errors.length} ta qator o'qilmadi:</span>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 max-h-20 overflow-y-auto">
                      {parseResult.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {parseResult.errors.length > 5 && (
                        <li>...va yana {parseResult.errors.length - 5} ta</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={e => setSkipDuplicates(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Mavjud so'zlarni qayta kiritmaslik</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleImportSubmit}
              disabled={parseResult.validWords.length === 0 || !targetFolderId}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{parseResult.validWords.length} ta so'zni saqlash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
