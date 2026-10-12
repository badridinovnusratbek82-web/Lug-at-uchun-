import React, { useState } from 'react';
import { X, Volume2, Save } from 'lucide-react';
import { Book, Folder, Word } from '../types';
import { soundManager } from '../utils/audio';

interface SingleWordModalProps {
  wordToEdit?: Word | null;
  books: Book[];
  folders: Folder[];
  defaultBookId?: string | null;
  defaultFolderId?: string | null;
  onClose: () => void;
  onSave: (wordData: {
    id?: string;
    english: string;
    uzbek: string;
    transcription?: string;
    example?: string;
    exampleUz?: string;
    partOfSpeech?: Word['partOfSpeech'];
    bookId: string;
    folderId: string;
  }) => void;
}

export const SingleWordModal: React.FC<SingleWordModalProps> = ({
  wordToEdit,
  books,
  folders,
  defaultBookId,
  defaultFolderId,
  onClose,
  onSave,
}) => {
  const [english, setEnglish] = useState(wordToEdit?.english || '');
  const [uzbek, setUzbek] = useState(wordToEdit?.uzbek || '');
  const [transcription, setTranscription] = useState(wordToEdit?.transcription || '');
  const [example, setExample] = useState(wordToEdit?.example || '');
  const [exampleUz, setExampleUz] = useState(wordToEdit?.exampleUz || '');
  const [partOfSpeech, setPartOfSpeech] = useState<Word['partOfSpeech']>(
    wordToEdit?.partOfSpeech || 'other'
  );

  const [bookId, setBookId] = useState(
    wordToEdit?.bookId || defaultBookId || books[0]?.id || ''
  );
  const [folderId, setFolderId] = useState(
    wordToEdit?.folderId || defaultFolderId || folders.find(f => f.bookId === (wordToEdit?.bookId || defaultBookId || books[0]?.id))?.id || ''
  );

  const availableFolders = folders.filter(f => f.bookId === bookId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !uzbek.trim() || !bookId || !folderId) {
      alert("Iltimos, Inglizcha, O'zbekcha so'zlarni hamda papkani to'ldiring!");
      return;
    }

    onSave({
      id: wordToEdit?.id,
      english: english.trim(),
      uzbek: uzbek.trim(),
      transcription: transcription.trim() || undefined,
      example: example.trim() || undefined,
      exampleUz: exampleUz.trim() || undefined,
      partOfSpeech,
      bookId,
      folderId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {wordToEdit ? "So'zni tahrirlash" : "Yangi so'z qo'shish"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* English word + Audio listen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Inglizcha so'z yoki ibora <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Masalan: accomplish, opportunity"
                value={english}
                onChange={e => setEnglish(e.target.value)}
                autoFocus
                required
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => soundManager.speak(english)}
                disabled={!english.trim()}
                className="p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-lg disabled:opacity-40"
                title="Talaffuzini eshitib ko'rish"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Uzbek translation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              O'zbekcha tarjimasi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Masalan: erishmoq, amalga oshirmoq"
              value={uzbek}
              onChange={e => setUzbek(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Transcription & Part of speech */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transkripsiya (ixtiyoriy)
              </label>
              <input
                type="text"
                placeholder="[əˈkʌm.plɪʃ]"
                value={transcription}
                onChange={e => setTranscription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                So'z turkumi
              </label>
              <select
                value={partOfSpeech}
                onChange={e => setPartOfSpeech(e.target.value as Word['partOfSpeech'])}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="verb">Fe'l (Verb)</option>
                <option value="noun">Ot (Noun)</option>
                <option value="adjective">Sifat (Adjective)</option>
                <option value="adverb">Ravish (Adverb)</option>
                <option value="phrase">Ibora (Phrase)</option>
                <option value="other">Boshqa</option>
              </select>
            </div>
          </div>

          {/* Example sentence */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Misol gap (Inglizcha)
            </label>
            <input
              type="text"
              placeholder="She accomplished her goal of learning English."
              value={example}
              onChange={e => setExample(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Misol tarjimasi (O'zbekcha)
            </label>
            <input
              type="text"
              placeholder="U ingliz tilini o'rganish maqsadiga erishdi."
              value={exampleUz}
              onChange={e => setExampleUz(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Book & Folder selection */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kitob
              </label>
              <select
                value={bookId}
                onChange={e => {
                  setBookId(e.target.value);
                  const firstF = folders.find(f => f.bookId === e.target.value);
                  if (firstF) setFolderId(firstF.id);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
              >
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Papka
              </label>
              <select
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
              >
                {availableFolders.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
