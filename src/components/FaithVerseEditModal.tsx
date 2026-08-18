import React, { useState, useEffect } from 'react';
import { X, Trash2, HeartHandshake, AlertTriangle } from 'lucide-react';
import { SavedVerse } from '../hooks/useSavedVerses';
import FolderDropdown from './shared/FolderDropdown';
import RichTextEditor from './RichTextEditor';
import { renderCustomHTML } from '../lib/renderCustomHTML';

interface FaithVerseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: SavedVerse | null;
  onUpdate: (verse: SavedVerse) => void;
  onDelete: (id: string) => void;
  availableCollections?: string[];
}

export default function FaithVerseEditModal({
  isOpen,
  onClose,
  verse,
  onUpdate,
  onDelete,
  availableCollections = [],
}: FaithVerseEditModalProps) {
  const [editingVerse, setEditingVerse] = useState<SavedVerse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const reference = verse ? `${verse.bookName} ${verse.chapter}:${verse.verseNum}` : '';
  
  useEffect(() => {
    if (verse) {
      setEditingVerse({ ...verse });
    }
  }, [verse]);

  if (!isOpen || !editingVerse) return null;

  const handleSaveAndClose = () => {
    onUpdate(editingVerse);
    onClose();
  };

  const handleUpdate = () => {
    onUpdate(editingVerse);
    onClose();
  };

  const handleDeleteClick = () => {
    setIsDeleting(true);
  };

  const confirmDelete = () => {
    onDelete(editingVerse.id);
    setIsDeleting(false);
    onClose();
  };

  const cancelDelete = () => {
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-stone-100 flex flex-col max-h-[95vh] h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-900">Faith Verse</h3>
              <p className="text-xs text-stone-500 font-medium">Save to the Faith Verse area</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isDeleting && (
              <button onClick={handleDeleteClick} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Verse">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={handleUpdate} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {isDeleting ? (
          <div className="p-8 flex flex-col items-center text-center bg-white flex-1 justify-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h4 className="text-2xl font-serif font-bold mb-4">Delete Item?</h4>
            <p className="text-stone-600 mb-8 leading-relaxed max-w-sm">
              Are you sure you want to delete this item? This action cannot be undone. It will be permanently removed <strong className="text-red-600">site-wide</strong>, including from your timeline, all collections, and all feature areas.
            </p>
            <div className="flex gap-3 w-full max-w-sm">
              <button 
                onClick={cancelDelete}
                className="flex-1 px-4 py-3 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                Yes, Delete It
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Collections */}
            <div className="px-4 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-end bg-white z-[60] relative">
              <FolderDropdown 
                availableFolders={availableCollections}
                selectedFolders={editingVerse.collections || []}
                onChange={(folders) => setEditingVerse({ ...editingVerse, collections: folders })}
                label="Collections"
              />
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#faf9f8] flex flex-col">
              <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col flex-1 h-full min-h-[400px]">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingVerse ? `${editingVerse.bookName} ${editingVerse.chapter}:${editingVerse.verseNum}` : ''}
                    onChange={(e) => {
                      if (!editingVerse) return;
                      const parts = e.target.value.split(/[:\s]+/);
                      const bookName = parts.slice(0, -2).join(' ') || editingVerse.bookName;
                      const chapter = parseInt(parts[parts.length - 2] || String(editingVerse.chapter), 10);
                      const verseNum = parseInt(parts[parts.length - 1] || String(editingVerse.verseNum), 10);
                      setEditingVerse({ ...editingVerse, bookName, chapter, verseNum });
                    }}
                    className="w-full text-xl sm:text-2xl font-serif text-slate-900 border-none outline-none placeholder:text-stone-300 focus:ring-0 p-0 mb-4"
                    placeholder="Verse Title..."
                  />
                </div>
                
                {editingVerse.text && (
                  <div className="mb-6 p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <p className="font-serif text-lg text-slate-800 italic">
                      {renderCustomHTML(editingVerse.text)}
                    </p>
                  </div>
                )}
                
                <div className="flex-1 -mx-5 -mb-5 border-t border-stone-100 flex flex-col">
                  <RichTextEditor
                    value={editingVerse.note}
                    onChange={(content) => setEditingVerse({ ...editingVerse, note: content })}
                    placeholder="Start writing..."
                  />
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-stone-100 bg-white flex justify-end shrink-0 gap-3">
               <button onClick={handleUpdate} className="px-6 py-2.5 bg-[#c2094c] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#a0073e] transition-colors shadow-sm">
                 Save Changes
               </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
