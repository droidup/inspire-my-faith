import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, Book, Maximize, AlertTriangle } from 'lucide-react';
import { SavedVerse } from '../hooks/useSavedVerses';
import RichTextEditor from './RichTextEditor';
import FolderDropdown from './shared/FolderDropdown';
import { renderCustomHTML } from '../lib/renderCustomHTML';

interface StudyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: SavedVerse | null;
  onUpdateNote: (id: string, note: string) => void;
  onDelete: (id: string) => void;
  availableCollections?: string[];
  onUpdateCollections?: (collections: string[]) => void;
}

export default function StudyGuideModal({
  isOpen,
  onClose,
  verse,
  onUpdateNote,
  onDelete,
  availableCollections = [],
  onUpdateCollections
}: StudyGuideModalProps) {
  const [noteContent, setNoteContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  useEffect(() => {
    if (verse) {
      setNoteContent(verse.note || '');
      setSaveStatus('idle');
    }
  }, [verse]);

  if (!isOpen || !verse) return null;

  const handleBlur = () => {
    if (verse.note !== noteContent) {
      setSaveStatus('saving');
      onUpdateNote(verse.id, noteContent);
      setTimeout(() => setSaveStatus('saved'), 500);
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleting(true);
  };

  const confirmDelete = () => {
    onDelete(verse.id);
    setIsDeleting(false);
    onClose();
  };

  const cancelDelete = () => {
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-900">
                {verse.version === 'DAILY_VERSE' ? 'Daily Verse' : 'Faith Guide'}
              </h3>
              {verse.version !== 'DAILY_VERSE' && (
                <p className="text-xs text-stone-500 font-medium">Local Browser Storage</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isDeleting && onUpdateCollections && (
              <div className="mr-2">
                <FolderDropdown 
                  availableFolders={availableCollections}
                  selectedFolders={verse.collections || []}
                  onChange={onUpdateCollections}
                  label="Collections"
                />
              </div>
            )}
            {!isDeleting && (
              <button
                onClick={handleDeleteClick}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title={verse.version === 'DAILY_VERSE' ? "Remove from Timeline" : "Remove from Faith Guide"}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {isDeleting ? (
          <div className="p-8 flex flex-col items-center text-center bg-white">
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
            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#faf9f8] space-y-6">
              {/* Verse Card */}
              <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[#c2094c]">
                    {verse.bookName} {verse.chapter}:{verse.verseNum}
                  </h4>
                  <span className="text-xs font-semibold px-2 py-1 bg-stone-100 rounded-md text-stone-500">
                    {verse.version}
                  </span>
                </div>
                <p className="font-serif text-lg leading-relaxed text-slate-800">
                  {renderCustomHTML(verse.text)}
                </p>
              </div>

              {/* Notes Area */}
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Your Thoughts
                  </label>
                  <span className="text-xs font-medium text-stone-400 flex items-center gap-1">
                    {saveStatus === 'saving' && <><Save className="w-3 h-3 animate-pulse" /> Saving...</>}
                    {saveStatus === 'saved' && <span className="text-emerald-500">Saved</span>}
                  </span>
                </div>
                <div className="relative">
                  <div className="h-[250px]" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) handleBlur(); }}>
                    <RichTextEditor 
                      value={noteContent}
                      onChange={setNoteContent}
                      placeholder="Add your reflections here..."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-stone-100 flex items-center justify-end gap-3 bg-white shrink-0">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setSaveStatus('saving');
                  onUpdateNote(verse.id, noteContent);
                  setTimeout(() => {
                    setSaveStatus('saved');
                    setTimeout(() => {
                      setSaveStatus('idle');
                      onClose();
                    }, 500);
                  }, 500);
                }}
                className="px-5 py-2.5 rounded-xl font-medium bg-[#c2094c] text-white hover:bg-red-700 transition-colors shadow-md shadow-[#c2094c]/20 flex items-center gap-2"
              >
                <Save size={18} /> Save Note
              </button>
            </div>
          </>
        )}
      
        </div>
    </div>
  );
}
