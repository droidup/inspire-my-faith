import React, { useState, useEffect } from 'react';
import { Bookmark as BookmarkType, addBookmark, removeBookmark } from '../lib/bookmarks';
import { useAuth } from '../contexts/AuthContext';
import { Book, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, X, Volume2, VolumeX, Bookmark, BookPlus, Home, Languages, Loader2, Info, Lightbulb, BookOpen, Scroll, ArrowUp, Pin, AlignJustify } from 'lucide-react';
import SaveVerseModal from './SaveVerseModal';
import StudyGuideModal from './StudyGuideModal';
import { useSavedVerses, SavedVerse } from '../hooks/useSavedVerses';

type BibleBook = {
  id: number;
  name: string;
  abbrev: string;
  testament: 'OT' | 'NT';
  book_order: number;
};

type Verse = {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
};

// Utility to parse [red] tags for Words of Christ
export function renderVerseText(text: string) {
  if (!text.includes('[red]')) return text;
  
  const parts = text.split(/(\[red\]|\[\/red\])/);
  let isRed = false;
  
  return parts.map((part, i) => {
    if (part === '[red]') {
      isRed = true;
      return null;
    }
    if (part === '[/red]') {
      isRed = false;
      return null;
    }
    if (isRed) {
      return <span key={i} className="text-[#c2094c] font-medium">{part}</span>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

interface BibleReaderProps {
  globalVersion?: string;
  onGoHome?: () => void;
  initialBookmark?: BookmarkType | null;
  clearInitialBookmark?: () => void;
  initialTestament?: 'OT' | 'NT' | null;
  clearInitialTestament?: () => void;
  onReturn?: () => void;
}

export default function BibleReader({ globalVersion = 'IMF', onGoHome, initialBookmark, clearInitialBookmark, initialTestament, clearInitialTestament, onReturn }: BibleReaderProps) {
  const { user } = useAuth();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const { savedVerses, saveVerse, updateNote, removeVerse, isVerseSaved, getSavedVerse } = useSavedVerses();
  const [verseToSave, setVerseToSave] = useState<Verse | null>(null);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [pendingScrollVerse, setPendingScrollVerse] = useState<number | null>(null);
  const [studyGuideVerse, setStudyGuideVerse] = useState<SavedVerse | null>(null);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());

  useEffect(() => {
    import('../lib/bookmarks').then(({ getBookmarks }) => {
      getBookmarks(user?.uid || null).then(data => {
        const bSet = new Set(data.map(b => `${b.bookName}-${b.chapter}-${b.verseNum}`));
        setBookmarkedVerses(bSet);
      });
    });
  }, [user]);

  const versionNames: Record<string, string> = {
    IMF: 'Inspire My Faith Version',
        KJV: 'King James Version',
    WEB: 'World English Bible',
    BSB: 'Berean Standard Bible',
    BBE: 'Bible in Basic English'
  };

  const [books, setBooks] = useState<BibleBook[]>([]);
  const [testament, setTestament] = useState<'OT' | 'NT' | null>(null);
  
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 300) {
      console.log("SCROLLING:", e.currentTarget.scrollTop); setShowBackToTop(true);
    } else {
      setShowBackToTop(false);
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapterCount, setChapterCount] = useState<number>(0);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);
  const [isReadingChapter, setIsReadingChapter] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  
  const [verseSpacing, setVerseSpacing] = useState<'standard' | 'medium' | 'large'>('large');
  const [isSpacingDropdownOpen, setIsSpacingDropdownOpen] = useState(false);
  
  const chapterDropdownRef = React.useRef<HTMLDivElement>(null);
  const spacingDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialBookmark) {
      // Find book
      fetch('/api/get_books.php')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBooks(data.data);
            const book = data.data.find((b: any) => b.name === initialBookmark.bookName);
            if (book) {
              setTestament(book.testament as 'OT' | 'NT');
              setSelectedBook(book);
              
              fetch(`/api/get_chapter_count.php?bookId=${book.id}`)
                .then(r => r.json())
                .then(chapterData => {
                  if (chapterData.success) {
                    setChapterCount(chapterData.data);
                    setSelectedChapter(initialBookmark.chapter);
                    setPendingScrollVerse(initialBookmark.verseNum);
                  }
                });
            }
          }
        });
      
      if (clearInitialBookmark) clearInitialBookmark();
    }
  }, [initialBookmark, clearInitialBookmark]);

  useEffect(() => {
    if (initialTestament) {
      setTestament(initialTestament);
      setSelectedBook(null); // Ensure we show the book list
      if (clearInitialTestament) clearInitialTestament();
    }
  }, [initialTestament, clearInitialTestament]);

  useEffect(() => {
    if (verses.length > 0 && pendingScrollVerse) {
      setTimeout(() => {
        const verseEl = document.getElementById(`verse-${pendingScrollVerse}`);
        if (verseEl) {
          verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedVerse(pendingScrollVerse);
          setTimeout(() => setHighlightedVerse(null), 3000);
          setPendingScrollVerse(null);
        }
      }, 100);
    }
  }, [verses, pendingScrollVerse]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chapterDropdownRef.current && !chapterDropdownRef.current.contains(event.target as Node)) {
        setIsChapterDropdownOpen(false);
      }
      if (spacingDropdownRef.current && !spacingDropdownRef.current.contains(event.target as Node)) {
        setIsSpacingDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetch('/api/get_books.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBooks(data.data);
        }
      });
  }, []);

  const handleSelectBook = async (book: BibleBook) => {
    setSelectedBook(book);
    setLoading(true);
    try {
      const res = await fetch(`/api/get_chapter_count.php?bookId=${book.id}`);
      const data = await res.json();
      if (data.success) {
        setChapterCount(data.data);
        setSelectedChapter(1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVerses = async (bookId: number, chapter: number, targetVersion: string = globalVersion) => {
    setLoading(true);
    setCurrentSummary(null);
    try {
      const [res, summaryRes] = await Promise.all([
        fetch(`/api/get_chapter_verses.php?bookId=${bookId}&chapter=${chapter}&version=${targetVersion}`),
        fetch(`/api/get_chapter_summary.php?bookId=${bookId}&chapter=${chapter}`)
      ]);
      if (!res.ok) {
        throw new Error(`Verses API returned status: ${res.status}`);
      }
      const data = await res.json();
      
      let summaryData = { success: false, data: null };
      if (summaryRes.ok) {
        try {
          summaryData = await summaryRes.json();
        } catch (e) {
          console.error('Summary fetch failed:', e);
        }
      }
      if (summaryData.success && summaryData.data) {
        setCurrentSummary(summaryData.data);
      }

      if (data.success) {
        setVerses(data.data);
      } else {
        setVerses([]);
      }
    } catch (e) {
      console.error(e);
      setVerses([]);
    } finally {
      setLoading(false);
    }
  };

  


  React.useEffect(() => {
    if (selectedBook && selectedChapter) {
      fetchVerses(selectedBook.id, selectedChapter, globalVersion);
    }
  }, [selectedBook, selectedChapter, globalVersion]);

    const handleNextChapter = async () => {
    if (!selectedBook) return;
    if (selectedChapter < chapterCount) {
      handleSelectChapter(selectedChapter + 1);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const currentIndex = books.findIndex(b => b.id === selectedBook.id);
      if (currentIndex !== -1 && currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setSelectedBook(nextBook);
        setTestament(nextBook.testament);
        try {
          const res = await fetch(`/api/get_chapter_count.php?bookId=${nextBook.id}`);
          const data = await res.json();
          if (data.success) {
            setChapterCount(data.data);
            setSelectedChapter(1);
            setIsSummaryOpen(false);
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (e) { console.error(e); }
      }
    }
  };

  const handlePrevChapter = async () => {
    if (!selectedBook) return;
    if (selectedChapter > 1) {
      handleSelectChapter(selectedChapter - 1);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const currentIndex = books.findIndex(b => b.id === selectedBook.id);
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        setSelectedBook(prevBook);
        setTestament(prevBook.testament);
        try {
          const res = await fetch(`/api/get_chapter_count.php?bookId=${prevBook.id}`);
          const data = await res.json();
          if (data.success) {
            setChapterCount(data.data);
            setSelectedChapter(data.data);
            setIsSummaryOpen(false);
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (e) { console.error(e); }
      }
    }
  };

  const handleSelectChapter = (chapter: number) => {
    setSelectedChapter(chapter);
    setIsSummaryOpen(false);
  };

  const handleReadChapter = () => {
    if ('speechSynthesis' in window) {
      if (isReadingChapter) {
        window.speechSynthesis.cancel();
        setIsReadingChapter(false);
      } else {
        window.speechSynthesis.cancel();
        const text = verses.map(v => v.text).join(' ');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onend = () => setIsReadingChapter(false);
        setIsReadingChapter(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const renderSummary = (summaryText: string) => {
    const TextToBullets = ({ text, title, icon: Icon }: { text: string, title: string, icon: any }) => {
      const sentences = text
        .replace(/\n/g, ' ')
        .split(/(?<=[.?!])\s+/)
        .filter(s => s.trim().length > 1);

      return (
        <div className="space-y-4">
          <h5 className="text-[#c2094c] font-bold uppercase tracking-wider text-xs flex items-center gap-2">
            <Icon size={14} /> {title}
          </h5>
          <ul className="space-y-3">
            {sentences.map((sentence, idx) => (
              <li key={idx} className="flex gap-3 text-slate-700">
                <span className="text-[#c2094c] mt-1 opacity-60 flex-shrink-0 text-lg leading-none">•</span>
                <span className="leading-relaxed">{sentence}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    };

    try {
      const data = JSON.parse(summaryText);
      if (data && typeof data === 'object' && (data.summary || data.daily_life_connection)) {
        return (
          <div className="space-y-8">
            {data.summary && (
              <TextToBullets text={data.summary} title="Chapter Overview" icon={BookOpen} />
            )}
            {data.daily_life_connection && (
              <TextToBullets text={data.daily_life_connection} title="Relevance for Today" icon={Lightbulb} />
            )}
          </div>
        );
      }
    } catch (e) {
      // Not JSON, continue to raw string formatting
    }

    // Fallback for raw text - if it's old unformatted data
    // Make it readable for ADHD: break into sentence-level bullet points
    return <TextToBullets text={summaryText} title="Chapter Overview" icon={BookOpen} />;
  };

  // Breadcrumbs logic
  const goToBibleHome = () => {
    setTestament(null);
    setSelectedBook(null);
  };
  
  const goToTestament = () => {
    setSelectedBook(null);
  };

  if (!testament) {
    return (
      <div className="h-full flex flex-col bg-[#faf9f8] animate-in fade-in duration-700 relative">

        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 animate-in fade-in duration-700 bg-[#faf9f8]">
          <div className="text-center space-y-4 max-w-xl">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 tracking-tight">The Holy Bible</h2>
            <p className="text-slate-500 text-lg leading-relaxed">Find comfort, wisdom, and peace in the living word. Select a testament to begin your reading journey.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-3xl">
            <button 
              onClick={() => setTestament('OT')}
              className="flex-1 bg-white border border-stone-200 hover:border-[#c2094c]/30 hover:shadow-xl hover:shadow-[#c2094c]/5 transition-all duration-300 p-10 rounded-2xl flex flex-col items-center gap-6 group"
            >
              <div className="w-20 h-20 bg-stone-50 text-[#c2094c] rounded-full flex items-center justify-center group-hover:scale-105 group-hover:bg-red-50 transition-all duration-300">
                <Scroll size={36} strokeWidth={1.5} />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-serif text-slate-900 group-hover:text-[#c2094c] transition-colors">Old Testament</h3>
                <p className="text-stone-500 text-sm">39 Books • Genesis to Malachi</p>
              </div>
            </button>

            <button 
              onClick={() => setTestament('NT')}
              className="flex-1 bg-white border border-stone-200 hover:border-[#c2094c]/30 hover:shadow-xl hover:shadow-[#c2094c]/5 transition-all duration-300 p-10 rounded-2xl flex flex-col items-center gap-6 group"
            >
              <div className="w-20 h-20 bg-stone-50 text-[#c2094c] rounded-full flex items-center justify-center group-hover:scale-105 group-hover:bg-red-50 transition-all duration-300">
                <BookOpen size={36} strokeWidth={1.5} />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-serif text-slate-900 group-hover:text-[#c2094c] transition-colors">New Testament</h3>
                <p className="text-stone-500 text-sm">27 Books • Matthew to Revelation</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedBook) {
    const filteredBooks = books.filter(b => b.testament === testament);
    
    return (
      <div className="h-full flex flex-col bg-[#faf9f8] animate-in fade-in duration-700 relative">

        <div className="flex-1 flex flex-col min-h-0 bg-[#faf9f8] p-8 md:p-12 animate-in fade-in duration-700 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-2 text-sm text-stone-500 mb-10 font-medium tracking-wide">
              <button onClick={onGoHome} className="hover:text-[#c2094c] flex items-center gap-1 transition-colors"><Home size={16}/> Home</button>
              <ChevronRight size={16} className="text-stone-300" />
              <button onClick={goToBibleHome} className="hover:text-[#c2094c] transition-colors">Bible</button>
              <ChevronRight size={16} className="text-stone-300" />
              <span className="text-stone-800">{testament === 'OT' ? 'Old Testament' : 'New Testament'}</span>
            </div>

            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4">{testament === 'OT' ? 'Old Testament' : 'New Testament'}</h2>
              <p className="text-stone-500 text-lg">Select a book to begin reading.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-32">
              {filteredBooks.map(book => (
                <button
                  key={book.id}
                  onClick={() => handleSelectBook(book)}
                  className="bg-white border border-stone-200 p-5 rounded-2xl hover:border-[#c2094c]/30 hover:shadow-lg hover:shadow-[#c2094c]/5 text-left transition-all duration-300 group"
                >
                  <h3 className="font-serif text-lg text-slate-900 group-hover:text-[#c2094c] transition-colors">{book.name}</h3>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2">{book.abbrev}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SaveVerseModal 
        isOpen={isSaveModalOpen} 
        onClose={() => setIsSaveModalOpen(false)} 
        onSaveLocal={() => { 
          if (verseToSave && selectedBook) {
            const newId = `${selectedBook.name}-${selectedChapter}-${verseToSave.verse}-${globalVersion}`;
            saveVerse({
              id: newId,
              bookName: selectedBook.name,
              chapter: selectedChapter,
              verseNum: verseToSave.verse,
              text: verseToSave.text,
              version: globalVersion
            });
            setStudyGuideVerse({
              id: newId,
              bookName: selectedBook.name,
              chapter: selectedChapter,
              verseNum: verseToSave.verse,
              text: verseToSave.text,
              version: globalVersion,
              note: '',
              savedAt: Date.now()
            });
          }
          setIsSaveModalOpen(false); 
        }} 
        onCreateAccount={() => { 
          if (verseToSave && selectedBook) {
            const newId = `${selectedBook.name}-${selectedChapter}-${verseToSave.verse}-${globalVersion}`;
            saveVerse({
              id: newId,
              bookName: selectedBook.name,
              chapter: selectedChapter,
              verseNum: verseToSave.verse,
              text: verseToSave.text,
              version: globalVersion
            });
            setStudyGuideVerse({
              id: newId,
              bookName: selectedBook.name,
              chapter: selectedChapter,
              verseNum: verseToSave.verse,
              text: verseToSave.text,
              version: globalVersion,
              note: '',
              savedAt: Date.now()
            });
          }
          setIsSaveModalOpen(false); 
        }} 
      />
      <StudyGuideModal
        isOpen={!!studyGuideVerse}
        onClose={() => setStudyGuideVerse(null)}
        verse={studyGuideVerse}
        onUpdateNote={updateNote}
        onDelete={(id) => { removeVerse(id); setStudyGuideVerse(null); }}
      />
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 flex flex-col min-h-0 bg-[#faf9f8] h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-in fade-in duration-700">

      <div className="max-w-6xl mx-auto w-full flex flex-col p-6 md:p-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-8 font-medium tracking-wide shrink-0">
          <button onClick={onGoHome} className="hover:text-[#c2094c] flex items-center gap-1 transition-colors"><Home size={16}/> Home</button>
          <ChevronRight size={16} className="text-stone-300" />
          <button onClick={goToBibleHome} className="hover:text-[#c2094c] transition-colors">Bible</button>
          <ChevronRight size={16} className="text-stone-300" />
          <button onClick={goToTestament} className="hover:text-[#c2094c] transition-colors">{testament === 'OT' ? 'Old Testament' : 'New Testament'}</button>
          <ChevronRight size={16} className="text-stone-300" />
          <span className="text-stone-800">{selectedBook.name}</span>
        </div>
        <div className="flex flex-col flex-1">
          
          {/* Main Content: Verses */}
          <div className="flex-1 bg-white sm:border border-stone-100/50 sm:rounded-[2.5rem] shadow-2xl shadow-stone-200/40 relative flex flex-col pb-12">
            
            {/* Sticky Header */}
            <div className="bg-white/95 backdrop-blur-md z-30 border-b border-stone-100 px-5 sm:px-10 py-6 sm:py-8 shrink-0 sm:rounded-t-[2.5rem]">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
                <div>
                  <h4 className="text-xs font-bold text-[#c2094c] tracking-widest uppercase mb-3">{versionNames[globalVersion] || globalVersion}</h4>
                  
                  <div className="relative" ref={chapterDropdownRef}>
                    <div 
                      className="group cursor-pointer inline-flex flex-col"
                      onClick={() => setIsChapterDropdownOpen(!isChapterDropdownOpen)}
                    >
                      <h2 className="text-4xl md:text-5xl font-serif text-slate-900 flex items-center gap-3 transition-colors group-hover:text-[#c2094c]">
                        {selectedBook.name} {selectedChapter}
                        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-stone-50 group-hover:bg-red-50 transition-colors border border-stone-100">
                          <ChevronDown size={24} strokeWidth={2} className={`text-stone-400 group-hover:text-[#c2094c] transition-transform duration-300 ${isChapterDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </h2>
                      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-400 font-bold mt-2 block group-hover:text-[#c2094c] transition-colors">Select Chapter</span>
                    </div>
                    
                    {isChapterDropdownOpen && (
                      <div className="absolute top-full left-0 mt-4 bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-2xl shadow-[#c2094c]/10 w-[280px] sm:w-[380px] z-50 animate-in fade-in slide-in-from-top-2">
                         <div className="flex justify-between items-center mb-4">
                           <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Chapters</h4>
                           <button onClick={(e) => { e.stopPropagation(); setIsChapterDropdownOpen(false); }} className="text-stone-400 hover:text-[#c2094c] transition-colors"><X size={20}/></button>
                         </div>
                         <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[40vh] sm:max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                           {Array.from({ length: chapterCount }).map((_, i) => (
                             <button
                               key={i + 1}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleSelectChapter(i + 1);
                                 setIsChapterDropdownOpen(false);
                               }}
                               className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm sm:text-base font-medium transition-all duration-200 ${
                                 selectedChapter === i + 1 
                                   ? 'bg-[#c2094c] text-white shadow-md shadow-[#c2094c]/20' 
                                   : 'hover:bg-red-50 hover:text-[#c2094c] text-stone-600 bg-stone-50'
                               }`}
                             >
                               {i + 1}
                             </button>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center relative" ref={spacingDropdownRef}>
                  <button
                    onClick={() => setIsSpacingDropdownOpen(!isSpacingDropdownOpen)}
                    className={`p-3 sm:p-4 rounded-full transition-colors border border-stone-100 relative group/space ${isSpacingDropdownOpen ? 'bg-red-50 text-[#c2094c]' : 'bg-stone-50 text-stone-600 hover:bg-red-50 hover:text-[#c2094c]'}`}
                  >
                    <AlignJustify size={20} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#c2094c] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover/space:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                      Text Spacing
                    </span>
                  </button>
                  
                  {isSpacingDropdownOpen && (
                    <div className="absolute top-full right-16 mt-2 bg-white rounded-2xl p-2 border border-stone-200 shadow-xl w-48 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-1">Verse Spacing</div>
                      {(['standard', 'medium', 'large'] as const).map(spacing => (
                        <button
                          key={spacing}
                          onClick={() => { setVerseSpacing(spacing); setIsSpacingDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors flex items-center justify-between ${verseSpacing === spacing ? 'bg-red-50 text-[#c2094c]' : 'text-slate-700 hover:bg-stone-50'}`}
                        >
                          {spacing}
                          {verseSpacing === spacing && <div className="w-2 h-2 rounded-full bg-[#c2094c]" />}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => handleSelectChapter(Math.max(1, selectedChapter - 1))}
                    disabled={selectedChapter <= 1}
                    className="p-3 sm:p-4 rounded-full bg-stone-50 hover:bg-red-50 hover:text-[#c2094c] disabled:hover:bg-stone-50 disabled:hover:text-stone-600 disabled:opacity-30 text-stone-600 transition-colors border border-stone-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => handleSelectChapter(Math.min(chapterCount, selectedChapter + 1))}
                    disabled={selectedChapter >= chapterCount}
                    className="p-3 sm:p-4 rounded-full bg-stone-50 hover:bg-red-50 hover:text-[#c2094c] disabled:hover:bg-stone-50 disabled:hover:text-stone-600 disabled:opacity-30 text-stone-600 transition-colors border border-stone-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Verses Area */}
            <div className="px-4 sm:px-10 py-10 md:py-16 flex-1">
              <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="animate-pulse space-y-8">
                    <div className="h-4 bg-stone-100 rounded w-3/4"></div>
                    <div className="h-4 bg-stone-100 rounded w-full"></div>
                    <div className="h-4 bg-stone-100 rounded w-5/6"></div>
                    <div className="h-4 bg-stone-100 rounded w-4/5"></div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6 pb-16">
                    {/* Chapter Summary Toggle */}
                    {selectedBook && (
                      <div className="pb-8">
                        <button 
                          onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                          className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-stone-100 group-hover:text-[#c2094c] transition-colors">
                              <Info size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800">Chapter Summary</h4>
                              <p className="text-sm text-stone-500">Read a brief overview of {selectedBook.name} {selectedChapter}</p>
                            </div>
                          </div>
                          <ChevronDown size={20} className={`text-stone-400 transition-transform duration-300 ${isSummaryOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Summary Content */}
                        <div className={`grid transition-all duration-300 ease-in-out ${isSummaryOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden">
                            <div className="p-5 sm:p-6 bg-[#faf9f8] rounded-2xl border border-stone-100 text-slate-700 leading-relaxed font-medium">
                              {currentSummary ? (
                                renderSummary(currentSummary)
                              ) : (
                                <p className="italic text-stone-400">Summary not available for this chapter yet.</p>
                              )}
                              
                              {/* Bottom Actions for Summary */}
                              <div className="flex items-center justify-between mt-8 pt-4 border-t border-stone-200">
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handlePrevChapter(); }}
                                    disabled={!selectedBook || (selectedBook.id === 1 && selectedChapter === 1)}
                                    className="p-2 text-stone-500 hover:bg-white hover:text-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Previous Chapter"
                                  >
                                    <ChevronLeft size={20} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleNextChapter(); }}
                                    disabled={!selectedBook || (selectedBook.id === 66 && selectedChapter === chapterCount)}
                                    className="p-2 text-stone-500 hover:bg-white hover:text-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Next Chapter"
                                  >
                                    <ChevronRight size={20} />
                                  </button>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setIsSummaryOpen(false); }}
                                  className="flex items-center gap-2 px-4 py-2 text-stone-500 hover:bg-white hover:text-slate-800 rounded-xl transition-colors font-bold text-sm tracking-wide uppercase"
                                >
                                  Close
                                  <ChevronUp size={20} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {verses.map((verse, index) => {
                      const verseId = selectedBook ? `${selectedBook.name}-${selectedChapter}-${verse.verse}-${globalVersion}` : '';
                      const isSaved = isVerseSaved(verseId);
                      return (
                      <div key={verse.id} id={`verse-${verse.verse}`} className={`group relative flex gap-4 sm:gap-6 px-2 sm:px-6 rounded-2xl transition-all duration-500 
                        ${verseSpacing === 'large' ? 'py-3 sm:py-4 -mx-2 sm:-mx-6' : ''}
                        ${verseSpacing === 'medium' ? 'py-1.5 sm:py-2 -mx-2 sm:-mx-6' : ''}
                        ${verseSpacing === 'standard' ? 'py-0 inline-flex flex-wrap' : ''}
                        ${highlightedVerse === verse.verse ? 'bg-blue-50/80 shadow-sm' : 'hover:bg-slate-50'}`}>
                        <span className="text-[#c2094c]/50 font-bold text-xs sm:text-sm shrink-0 w-6 sm:w-8 pt-1.5 select-none text-right">
                          {verse.verse}
                        </span>
                        <p className={`font-serif text-[1.1rem] sm:text-[1.25rem] leading-[1.8] sm:leading-[1.9] text-slate-800 flex-1 mb-10 md:mb-0 ${index === 0 ? 'first-letter:text-5xl sm:first-letter:text-6xl first-letter:font-bold first-letter:text-[#c2094c] first-letter:mr-2 first-letter:float-left first-letter:leading-none' : ''}`}>
                          {renderVerseText(verse.text)}
                        </p>
                        
                        {/* Actions (always visible on mobile, visible on hover on desktop) */}
                        <div className="opacity-100 pointer-events-auto translate-y-0 md:opacity-0 md:pointer-events-none md:translate-y-1 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200 absolute right-2 bottom-2 md:bottom-auto md:-top-10 sm:right-4 sm:-top-12 flex flex-row gap-1 sm:gap-2 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-sm md:shadow-lg border border-stone-200/80 z-30 after:content-[''] after:absolute after:w-full after:h-4 after:left-0 after:-bottom-4">
                          {(() => {
                            const pinVerseId = `${selectedBook?.name}-${selectedChapter}-${String(verse.verse).trim()}`;
                            const isBookmarked = bookmarkedVerses.has(pinVerseId);
                            
                            return (
                              <button 
                                onClick={async (e) => { 
                                  e.stopPropagation(); 
                                  if (selectedBook) {
                                    if (isBookmarked) {
                                      await removeBookmark(user?.uid || null, pinVerseId);
                                      setBookmarkedVerses(prev => {
                                        const next = new Set(prev);
                                        next.delete(pinVerseId);
                                        return next;
                                      });
                                    } else {
                                      await addBookmark(user?.uid || null, {
                                        id: pinVerseId,
                                        bookName: selectedBook.name,
                                        chapter: selectedChapter,
                                        verseNum: parseInt(String(verse.verse)) || 1,
                                        text: verse.text,
                                        version: globalVersion,
                                        timestamp: Date.now()
                                      });
                                      setBookmarkedVerses(prev => new Set(prev).add(pinVerseId));
                                    }
                                  }
                                }}
                                className={`group/btn relative p-2 sm:p-2.5 rounded-lg transition-colors ${isBookmarked ? 'text-blue-400 bg-blue-50/50' : 'text-stone-400 hover:text-blue-400 hover:bg-blue-50/50'}`}
                              >
                                <Pin size={16} className={isBookmarked ? 'fill-current' : ''} />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                                  {isBookmarked ? "Pinned" : "Pin / Bookmark"}
                                </span>
                              </button>
                            );
                          })()}
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (selectedBook) {
                                const newId = `${selectedBook.name}-${selectedChapter}-${verse.verse}-${globalVersion}`;
                                saveVerse({
                                  id: newId,
                                  bookName: selectedBook.name,
                                  chapter: selectedChapter,
                                  verseNum: verse.verse,
                                  text: verse.text,
                                  version: globalVersion
                                });
                                setStudyGuideVerse({
                                  id: newId,
                                  bookName: selectedBook.name,
                                  chapter: selectedChapter,
                                  verseNum: verse.verse,
                                  text: verse.text,
                                  version: globalVersion,
                                  timestamp: Date.now()
                                });
                              } else {
                                setVerseToSave(verse);
                                setIsSaveModalOpen(true);
                              }
                            }}
                            className={`group/btn relative p-2 sm:p-2.5 rounded-lg transition-colors ${isSaved ? 'text-[#c2094c] bg-red-50' : 'text-stone-400 hover:text-[#c2094c] hover:bg-red-50'}`}
                          >
                            <BookPlus size={16} className={isSaved ? 'fill-current' : ''} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#c2094c] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                              {isSaved ? "Saved to Faith Guide" : "Save to Faith Guide"}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                    })}

                  {/* Bottom Navigation */}
                  {(() => {
                    let prevLabel = '';
                    let isPrevDisabled = true;
                    let nextLabel = '';
                    let isNextDisabled = true;

                    if (selectedBook) {
                      const currentIndex = books.findIndex(b => b.id === selectedBook.id);
                      
                      if (selectedChapter > 1) {
                        prevLabel = `Previous: ${selectedBook.name} ${selectedChapter - 1}`;
                        isPrevDisabled = false;
                      } else if (currentIndex > 0) {
                        prevLabel = `Previous: ${books[currentIndex - 1].name}`;
                        isPrevDisabled = false;
                      }
                      
                      if (selectedChapter < chapterCount) {
                        nextLabel = `Next: ${selectedBook.name} ${selectedChapter + 1}`;
                        isNextDisabled = false;
                      } else if (currentIndex < books.length - 1 && currentIndex !== -1) {
                        nextLabel = `Next: ${books[currentIndex + 1].name}`;
                        isNextDisabled = false;
                      }
                    }

                    return (
                      <div className="mt-12">
                        <div className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                          onClick={handlePrevChapter}
                          disabled={isPrevDisabled}
                          className="w-full sm:w-auto px-6 py-4 flex items-center justify-center sm:justify-start gap-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-stone-600 hover:text-[#c2094c] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                          <span className="font-semibold">{prevLabel || 'Previous'}</span>
                        </button>
                        
                        <button
                          onClick={handleNextChapter}
                          disabled={isNextDisabled}
                          className="w-full sm:w-auto px-6 py-4 flex items-center justify-center sm:justify-end gap-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-stone-600 hover:text-[#c2094c] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <span className="font-semibold">{nextLabel || 'Next'}</span>
                          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                      </div>
                    );
                  })()}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 flex flex-col gap-3 z-50">
            <button
              onClick={handleReadChapter}
              className={`p-3 sm:p-4 rounded-full shadow-lg transition-all animate-in fade-in slide-in-from-bottom-4 ${isReadingChapter ? 'bg-[#c2094c] text-white hover:bg-[#a0073e]' : 'bg-white text-stone-600 hover:bg-red-50 hover:text-[#c2094c] border border-stone-100'}`}
              title={isReadingChapter ? "Stop Reading" : "Read Chapter"}
            >
              {isReadingChapter ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            {showBackToTop && (
              <button
                onClick={scrollToTop}
                className="p-3 sm:p-4 rounded-full bg-white hover:bg-red-50 hover:text-[#c2094c] text-stone-600 transition-colors border border-stone-100 shadow-lg animate-in fade-in slide-in-from-bottom-4"
                title="Back to Top"
              >
                <ArrowUp size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
  );
}