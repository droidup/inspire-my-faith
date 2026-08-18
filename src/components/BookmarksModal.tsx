import React, { useEffect, useState } from 'react';
import { X, Bookmark, ChevronRight } from 'lucide-react';
import { getBookmarks, Bookmark as BookmarkType, addBookmark } from '../lib/bookmarks';
import { useAuth } from '../contexts/AuthContext';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (bookmark: BookmarkType) => void;
}

export default function BookmarksModal({ isOpen, onClose, onSelect }: BookmarksModalProps) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getBookmarks(user?.uid || null).then(data => {
        setBookmarks(data);
        setLoading(false);
      });
    }
  }, [isOpen, user]);

  const handleSelect = async (bookmark: BookmarkType) => {
    // When selected, move to top
    await addBookmark(user?.uid || null, bookmark);
    onSelect(bookmark);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Bookmark size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-slate-800">Bookmarks</h3>
              <p className="text-xs font-bold tracking-wider uppercase text-stone-400 mt-1">Pick up where you left off</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-slate-800 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-stone-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <p>You haven't bookmarked any verses yet.</p>
              <p className="text-sm mt-2">Click the bookmark icon on any verse to save your place.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark, idx) => (
                <button
                  key={bookmark.id}
                  onClick={() => handleSelect(bookmark)}
                  className="w-full text-left p-4 rounded-2xl border border-stone-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 group flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold tracking-widest uppercase text-blue-500">
                        {bookmark.bookName} {bookmark.chapter}:{bookmark.verseNum}
                      </span>
                      <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                        {bookmark.version}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                          LATEST
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 font-serif line-clamp-2 leading-relaxed">
                      "{bookmark.text}"
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-stone-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
