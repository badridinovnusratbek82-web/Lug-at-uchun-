import React, { useState } from 'react';
import {
  Folder as FolderIcon,
  FolderPlus,
  BookMarked,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Layers,
  Star,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Book, Folder, Word } from '../types';

interface FolderSidebarProps {
  books: Book[];
  folders: Folder[];
  words: Word[];
  selectedBookId: string | null;
  selectedFolderId: string | null;
  activeFilter: 'all' | 'starred' | 'mistakes' | 'mastered' | 'new';
  onSelectAll: () => void;
  onSelectBook: (bookId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onSelectFilter: (filter: 'all' | 'starred' | 'mistakes' | 'mastered' | 'new') => void;
  onCreateBook: (title: string, description?: string) => void;
  onEditBook: (bookId: string, title: string) => void;
  onDeleteBook: (bookId: string) => void;
  onCreateFolder: (bookId: string, title: string) => void;
  onEditFolder: (folderId: string, title: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export const FolderSidebar: React.FC<FolderSidebarProps> = ({
  books,
  folders,
  words,
  selectedBookId,
  selectedFolderId,
  activeFilter,
  onSelectAll,
  onSelectBook,
  onSelectFolder,
  onSelectFilter,
  onCreateBook,
  onEditBook,
  onDeleteBook,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
}) => {
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({
    'book-essential': true,
    'book-ielts': true,
    'book-phrasal': true,
  });

  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [addingFolderForBookId, setAddingFolderForBookId] = useState<string | null>(null);
  const [newFolderTitle, setNewFolderTitle] = useState('');

  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingBookTitle, setEditingBookTitle] = useState('');

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderTitle, setEditingFolderTitle] = useState('');

  const toggleBook = (bookId: string) => {
    setExpandedBooks(prev => ({ ...prev, [bookId]: !prev[bookId] }));
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;
    onCreateBook(newBookTitle.trim());
    setNewBookTitle('');
    setIsAddingBook(false);
  };

  const handleCreateFolder = (bookId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderTitle.trim()) return;
    onCreateFolder(bookId, newFolderTitle.trim());
    setNewFolderTitle('');
    setAddingFolderForBookId(null);
    setExpandedBooks(prev => ({ ...prev, [bookId]: true }));
  };

  const handleSaveEditBook = (bookId: string) => {
    if (!editingBookTitle.trim()) return;
    onEditBook(bookId, editingBookTitle.trim());
    setEditingBookId(null);
  };

  const handleSaveEditFolder = (folderId: string) => {
    if (!editingFolderTitle.trim()) return;
    onEditFolder(folderId, editingFolderTitle.trim());
    setEditingFolderId(null);
  };

  const starredCount = words.filter(w => w.isStarred).length;
  const mistakesCount = words.filter(w => w.timesIncorrect > w.timesCorrect || (w.timesIncorrect > 0 && w.masteryLevel < 2)).length;
  const masteredCount = words.filter(w => w.masteryLevel >= 4).length;
  const newCount = words.filter(w => w.timesStudied === 0).length;

  return (
    <aside className="w-full md:w-72 lg:w-80 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-4 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Smart Quick Filters */}
      <div>
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
          Asosiy To'plamlar
        </div>
        <div className="space-y-1">
          <button
            onClick={() => {
              onSelectAll();
              onSelectFilter('all');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'all' && !selectedBookId && !selectedFolderId
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Barcha so'zlar</span>
            </div>
            <span className="text-xs text-slate-400">{words.length}</span>
          </button>

          <button
            onClick={() => onSelectFilter('starred')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'starred'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Yulduzchali so'zlar</span>
            </div>
            <span className="text-xs text-slate-400">{starredCount}</span>
          </button>

          <button
            onClick={() => onSelectFilter('mistakes')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'mistakes'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>Xatolar / Qiyin so'zlar</span>
            </div>
            <span className="text-xs text-slate-400">{mistakesCount}</span>
          </button>

          <button
            onClick={() => onSelectFilter('mastered')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'mastered'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Yodlab olingan</span>
            </div>
            <span className="text-xs text-slate-400">{masteredCount}</span>
          </button>

          <button
            onClick={() => onSelectFilter('new')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'new'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>Hali ochilmagan</span>
            </div>
            <span className="text-xs text-slate-400">{newCount}</span>
          </button>
        </div>
      </div>

      {/* Books and Folders Tree */}
      <div className="flex-1">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Kitoblar & Bo'limlar
          </span>
          <button
            onClick={() => setIsAddingBook(true)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium flex items-center gap-1"
            title="Yangi kitob qo'shish"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kitob</span>
          </button>
        </div>

        {/* Add Book Inline Form */}
        {isAddingBook && (
          <form onSubmit={handleCreateBook} className="p-2 mb-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
            <input
              type="text"
              placeholder="Masalan: Oxford 3000, IELTS..."
              value={newBookTitle}
              onChange={e => setNewBookTitle(e.target.value)}
              autoFocus
              className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsAddingBook(false)}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                Bekor
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
              >
                Saqlash
              </button>
            </div>
          </form>
        )}

        {/* Books List */}
        <div className="space-y-2">
          {books.map(book => {
            const bookWords = words.filter(w => w.bookId === book.id);
            const bookFolders = folders.filter(f => f.bookId === book.id);
            const isExpanded = !!expandedBooks[book.id];
            const isBookActive = selectedBookId === book.id && !selectedFolderId;

            return (
              <div key={book.id} className="rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800/80">
                {/* Book Header Row */}
                <div
                  className={`group flex items-center justify-between px-2.5 py-2 cursor-pointer transition-colors ${
                    isBookActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => onSelectBook(book.id)}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBook(book.id);
                      }}
                      className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <BookMarked className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />

                    {editingBookId === book.id ? (
                      <input
                        type="text"
                        value={editingBookTitle}
                        onChange={e => setEditingBookTitle(e.target.value)}
                        onBlur={() => handleSaveEditBook(book.id)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEditBook(book.id)}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                        className="text-xs px-1 py-0.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <span className="text-xs font-semibold truncate leading-tight">{book.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <span className="text-[11px] text-slate-400 px-1">{bookWords.length}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingFolderForBookId(book.id);
                        setExpandedBooks(p => ({ ...p, [book.id]: true }));
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                      title="Papka qo'shish"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBookId(book.id);
                        setEditingBookTitle(book.title);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                      title="Nomini o'zgartirish"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {books.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`"${book.title}" kitobini o'chirmoqchimisiz? Ichidagi so'zlar ham o'chiriladi.`)) {
                            onDeleteBook(book.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Folders List */}
                {isExpanded && (
                  <div className="pl-6 pr-2 py-1 bg-slate-50/50 dark:bg-slate-900/50 space-y-0.5 border-t border-slate-100 dark:border-slate-800/50">
                    {bookFolders.map(folder => {
                      const folderWords = words.filter(w => w.folderId === folder.id);
                      const isFolderActive = selectedFolderId === folder.id;

                      return (
                        <div
                          key={folder.id}
                          className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                            isFolderActive
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 font-medium'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div
                            className="flex items-center gap-2 flex-1 min-w-0"
                            onClick={() => onSelectFolder(folder.id)}
                          >
                            <FolderIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {editingFolderId === folder.id ? (
                              <input
                                type="text"
                                value={editingFolderTitle}
                                onChange={e => setEditingFolderTitle(e.target.value)}
                                onBlur={() => handleSaveEditFolder(folder.id)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveEditFolder(folder.id)}
                                autoFocus
                                onClick={e => e.stopPropagation()}
                                className="text-xs px-1 py-0.5 border rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              />
                            ) : (
                              <span className="truncate">{folder.title}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <span className="text-[10px] text-slate-400">{folderWords.length}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolderId(folder.id);
                                setEditingFolderTitle(folder.title);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-600 transition-opacity"
                              title="Tahrirlash"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`"${folder.title}" papkasini o'chirmoqchimisiz?`)) {
                                  onDeleteFolder(folder.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Inline form to add folder in this book */}
                    {addingFolderForBookId === book.id ? (
                      <form onSubmit={e => handleCreateFolder(book.id, e)} className="p-1.5 my-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                        <input
                          type="text"
                          placeholder="Yangi papka nomi..."
                          value={newFolderTitle}
                          onChange={e => setNewFolderTitle(e.target.value)}
                          autoFocus
                          className="w-full text-xs px-2 py-1 bg-slate-50 dark:bg-slate-900 border rounded text-slate-900 dark:text-white focus:outline-none"
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setAddingFolderForBookId(null)}
                            className="text-[11px] text-slate-500 px-1.5 py-0.5"
                          >
                            Bekor
                          </button>
                          <button
                            type="submit"
                            className="text-[11px] bg-indigo-600 text-white rounded px-2 py-0.5 font-medium"
                          >
                            Qo'shish
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setAddingFolderForBookId(book.id)}
                        className="w-full text-left py-1 px-2 text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Yangi papka qo'shish</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
