/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import BibleReader from './components/BibleReader';
import SoulSearch from './components/SoulSearch';
import StudyGuide from './components/StudyGuide';
import FaithVerses from './components/FaithVerses';
import PromptBuilder from './components/PromptBuilder';
import AdminDashboard from './components/AdminDashboard';
import ReadingPlans from './components/ReadingPlans';
import SermonNotes from './components/SermonNotes';
import FaithTimeline from './components/FaithTimeline';
import Collections from './components/Collections';
import AdBanner from './components/AdBanner';
import BookmarksModal from './components/BookmarksModal';
import AuthModal from './components/AuthModal';
import VerseOfTheDayCard from './components/VerseOfTheDayCard';
import { Bookmark as BookmarkType } from './lib/bookmarks';
import { ArrowRight, Book, Flame, Search, BookOpen, Scroll, MessageCircle, MoreVertical, Send, Menu, X, ChevronDown, ChevronUp, MapPin, PlayCircle, Library, History, Calendar, Star, Settings, User, LogOut, LogIn, Compass, Map, Sun, Heart, CheckCircle2, Bookmark, Home, BookHeart, CalendarDays, PenTool, Signpost, ArrowLeft, Activity, MessageSquareText, HeartHandshake } from 'lucide-react';

export default function App() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [activeView, setActiveView] = useState<'home' | 'bible' | 'soul_search' | 'prompt_builder' | 'lifeline' | 'admin' | 'study_guide' | 'reading_plans' | 'sermon_notes' | 'faith_timeline' | 'faith_verses'>('home');
  const [globalVersion, setGlobalVersion] = useState(() => localStorage.getItem('preferred_bible_version') || 'IMF');
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [isBibleDropdownOpen, setIsBibleDropdownOpen] = useState(false);
  const [isMyFaithDropdownOpen, setIsMyFaithDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileTranslationAccordionOpen, setIsMobileTranslationAccordionOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [targetBookmark, setTargetBookmark] = useState<BookmarkType | null>(null);
  const [targetTestament, setTargetTestament] = useState<'OT' | 'NT' | null>(null);
  const [targetPrayer, setTargetPrayer] = useState<string | null>(null);
  const [targetNote, setTargetNote] = useState<string | null>(null);
  const [targetVerse, setTargetVerse] = useState<string | null>(null);
  const [editingVerseId, setEditingVerseId] = useState<number | null>(null);
  const [returnView, setReturnView] = useState<'faith_timeline' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetch(`/api/admin/check?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => {
           setIsAdmin(data.isAdmin || false);
           setIsSuperAdmin(data.isSuperAdmin || false);
        })
        .catch(err => console.error(err));
    } else {
      setIsAdmin(false);
      setIsSuperAdmin(false);
    }
  }, [user]);

  const versionDropdownRef = useRef<HTMLDivElement>(null);
  const bibleDropdownRef = useRef<HTMLDivElement>(null);
  const myFaithDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
        setIsVersionDropdownOpen(false);
      }
      if (bibleDropdownRef.current && !bibleDropdownRef.current.contains(event.target as Node)) {
        setIsBibleDropdownOpen(false);
      }
      if (myFaithDropdownRef.current && !myFaithDropdownRef.current.contains(event.target as Node)) {
        setIsMyFaithDropdownOpen(false);
      }
      if (
        (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) &&
        (mobileMenuDropdownRef.current && !mobileMenuDropdownRef.current.contains(event.target as Node))
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleGlobalVersionChange = (v: string) => {
      setGlobalVersion(v);
      localStorage.setItem('preferred_bible_version', v);
      setIsVersionDropdownOpen(false);
  };

  const handleNavClick = (view: 'home' | 'bible' | 'soul_search' | 'prompt_builder' | 'lifeline' | 'admin' | 'study_guide' | 'reading_plans' | 'sermon_notes' | 'faith_timeline' | 'faith_verses', data?: any) => {
    if (activeView === 'faith_timeline' && view !== 'faith_timeline' && view !== 'home') {
      setReturnView('faith_timeline');
    } else if (view === 'faith_timeline') {
      setReturnView(null);
    }
    
    if (data?.verse) {
      setTargetBookmark({ id: 0, user_id: '', reference: data.verse, created_at: '' });
    }
    if (data?.prayerId) {
      setTargetPrayer(data.prayerId);
    }
    if (data?.noteId) {
      setTargetNote(data.noteId);
    }
    if (data?.verseId) {
      setTargetVerse(data.verseId);
    }
    
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const handleReturn = () => {
    if (returnView) {
      handleNavClick(returnView);
    }
  };

  const handleSelectBookmark = (bookmark: BookmarkType) => {
    setTargetBookmark(bookmark);
    setActiveView('bible');
  };

  return (
    <div className="h-screen overflow-hidden w-full bg-[#faf9f8] flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-16 py-4 md:py-6 shrink-0 bg-[#faf9f8]/80 backdrop-blur-md shadow-[0_4px_20px_rgb(0,0,0,0.02)] border-b border-stone-200/50 z-50 sticky top-0 transition-all duration-300">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleNavClick('home')}>
           {/* Fallback text logo if image is missing */}
          <div className="w-14 h-14 flex items-center justify-center overflow-hidden">
             <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-slate-900 font-serif font-bold text-2xl tracking-tight">IMF</span>'; }} />
          </div>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 font-bold tracking-widest uppercase text-xs">
          <span 
            className={`cursor-pointer transition-all duration-300 hover:text-[#c2094c] ${activeView === 'home' ? 'text-[#c2094c]' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </span>
          <div className="relative" ref={bibleDropdownRef}>
            <div 
              className={`cursor-pointer transition-all duration-300 flex items-center gap-1 ${activeView === 'bible' ? 'text-[#c2094c]' : 'hover:text-[#c2094c]'}`}
              onClick={() => setIsBibleDropdownOpen(!isBibleDropdownOpen)}
            >
              Bible
              <ChevronDown size={14} className={`transition-transform duration-300 ${isBibleDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
            </div>
            {isBibleDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[320px] bg-[#faf9f8] border border-stone-200/50 rounded-2xl shadow-xl shadow-[#c2094c]/5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="py-2">
                  <div 
                    className="px-6 py-3 cursor-pointer flex items-center gap-2 transition-colors text-slate-600 hover:bg-stone-50 hover:text-[#c2094c] font-bold"
                    onClick={() => { 
                      setTargetTestament('OT');
                      setTargetBookmark(null);
                      handleNavClick('bible'); 
                      setIsBibleDropdownOpen(false); 
                    }}
                  >
                    <Scroll size={16} />
                    Old Testament
                  </div>
                  <div 
                    className="px-6 py-3 cursor-pointer flex items-center gap-2 transition-colors text-slate-600 hover:bg-stone-50 hover:text-[#c2094c] font-bold"
                    onClick={() => { 
                      setTargetTestament('NT');
                      setTargetBookmark(null);
                      handleNavClick('bible'); 
                      setIsBibleDropdownOpen(false); 
                    }}
                  >
                    <BookOpen size={16} />
                    New Testament
                  </div>
                  
                  <div className="border-t border-stone-100 my-2"></div>
                  <div className="px-6 py-2 text-[10px] font-bold tracking-widest uppercase text-stone-400">Translation</div>
                  
                  {[
                    { id: 'IMF', name: 'Inspire My Faith Version' },
                    { id: 'KJV', name: 'King James Version' },
                    { id: 'WEB', name: 'World English Bible' },
                    { id: 'BSB', name: 'Berean Standard Bible' },
                    { id: 'BBE', name: 'Bible in Basic English' }
                  ].map((version) => (
                    <div 
                      key={version.id}
                      className={`px-6 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${globalVersion === version.id ? 'bg-red-50 text-[#c2094c]' : 'text-slate-600 hover:bg-stone-50 hover:text-[#c2094c]'}`}
                      onClick={() => {
                        handleGlobalVersionChange(version.id);
                        setIsBibleDropdownOpen(false);
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${globalVersion === version.id ? 'bg-[#c2094c]' : 'bg-transparent'}`} />
                      <span className={`text-xs uppercase whitespace-nowrap ${globalVersion === version.id ? 'font-bold' : 'font-medium'}`}>{version.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={myFaithDropdownRef}>
            <div 
              className={`cursor-pointer transition-all duration-300 flex items-center gap-1 ${['faith_verses', 'soul_search', 'prompt_builder', 'study_guide', 'reading_plans', 'sermon_notes', 'faith_timeline'].includes(activeView) ? 'text-[#c2094c]' : 'hover:text-[#c2094c]'}`}
              onClick={() => setIsMyFaithDropdownOpen(!isMyFaithDropdownOpen)}
            >
              My Faith
              <ChevronDown size={14} className={`transition-transform duration-300 ${isMyFaithDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
            </div>
            {isMyFaithDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[240px] bg-[#faf9f8] border border-stone-200/50 rounded-2xl shadow-xl shadow-[#c2094c]/5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="py-2">
                  <div 
                    className={`px-6 py-3 flex items-center gap-3 cursor-pointer transition-colors ${activeView === 'faith_verses' ? 'bg-red-50 text-[#c2094c]' : 'text-slate-600 hover:bg-stone-50 hover:text-[#c2094c]'}`}
                    onClick={() => { handleNavClick('faith_verses'); setIsMyFaithDropdownOpen(false); }}
                  >
                    <HeartHandshake size={16} /> Faith Verses
                  </div>
                  <div 
                    className={`px-6 py-3 flex items-center gap-3 cursor-pointer transition-colors ${activeView === 'soul_search' ? 'bg-red-50 text-[#c2094c]' : 'text-slate-600 hover:bg-stone-50 hover:text-[#c2094c]'}`}
                    onClick={() => { handleNavClick('soul_search'); setIsMyFaithDropdownOpen(false); }}
                  >
                    <Heart size={16} /> Faith Prayer
                  </div>
                  <div 
                    className={`px-6 py-3 flex items-center gap-3 cursor-pointer transition-colors ${activeView === 'prompt_builder' ? 'bg-red-50 text-[#c2094c]' : 'text-slate-600 hover:bg-stone-50 hover:text-[#c2094c]'}`}
                    onClick={() => { handleNavClick('prompt_builder'); setIsMyFaithDropdownOpen(false); }}
                  >
                    <MessageSquareText size={16} /> Faith Builder
                  </div>
                  <div 
                    className={`px-6 py-3 flex items-center gap-3 cursor-pointer transition-colors ${activeView === 'study_guide' ? 'bg-red-50 text-[#c2094c]' : 'text-slate-600 hover:bg-stone-50 hover:text-[#c2094c]'}`}
                    onClick={() => { handleNavClick('study_guide'); setIsMyFaithDropdownOpen(false); }}
                  >
                    <BookHeart size={16} /> Faith Guide
                  </div>

                  <div 
                    className={`px-6 py-3 flex items-center gap-3 cursor-pointer transition-colors ${activeView === 'sermon_notes' ? 'bg-red-50 text-[#c2094c]' : 'text-slate-600 hover:bg-stone-50 hover:text-[#c2094c]'}`}
                    onClick={() => { handleNavClick('sermon_notes'); setIsMyFaithDropdownOpen(false); }}
                  >
                    <PenTool size={16} /> Faith Diary
                  </div>
                  <div 
                    className={`px-6 py-3 flex items-center gap-3 cursor-pointer transition-colors ${activeView === 'faith_timeline' ? 'bg-red-50 text-[#c2094c]' : 'text-slate-600 hover:bg-stone-50 hover:text-[#c2094c]'}`}
                    onClick={() => { handleNavClick('faith_timeline'); setIsMyFaithDropdownOpen(false); }}
                  >
                    <Signpost size={16} /> Faith Timeline
                  </div>
                </div>
              </div>
            )}
          </div>
          <span 
            className={`cursor-pointer transition-all duration-300 hover:text-[#c2094c] flex items-center gap-1 ${isBookmarksModalOpen ? 'text-[#c2094c]' : ''}`}
            onClick={() => setIsBookmarksModalOpen(true)}
          >
            Bookmarks
          </span>
          {isAdmin && (
            <span 
              className={`cursor-pointer transition-all duration-300 hover:text-[#c2094c] text-blue-600 ${activeView === 'admin' ? 'font-black' : ''}`}
              onClick={() => handleNavClick('admin')}
            >
              Bible Builder
            </span>
          )}
          
          
          {user ? (
            <button 
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-200 text-stone-600 rounded-full hover:bg-stone-100 hover:shadow-sm transition-all ml-2"
              title="Sign Out"
            >
              <img src={user.photoURL || ''} alt="User" className="w-6 h-6 rounded-full object-cover" />
              <LogOut size={16} />
            </button>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#c2094c] text-white rounded-full hover:bg-[#a0073e] hover:shadow-lg hover:shadow-[#c2094c]/20 transition-all ml-2"
            >
              <LogIn size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Sign In</span>
            </button>
          )}

        </div>
        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-4" ref={mobileMenuRef}>
          <button 
            className="text-stone-600 hover:text-[#c2094c] transition-colors p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
      <BookmarksModal 
        isOpen={isBookmarksModalOpen} 
        onClose={() => setIsBookmarksModalOpen(false)} 
        onSelect={handleSelectBookmark} 
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuDropdownRef} className="absolute top-[72px] sm:top-[88px] right-4 sm:right-8 w-[280px] sm:w-[320px] bg-white border border-stone-100 shadow-2xl rounded-2xl z-[100] flex flex-col p-6 gap-5 animate-in slide-in-from-top-4 duration-300">
          <span 
            className={`cursor-pointer font-bold tracking-widest uppercase text-sm ${activeView === 'home' ? 'text-[#c2094c]' : 'text-stone-500'}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </span>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Bible</span>
            <span 
              className={`cursor-pointer flex items-center gap-2 font-bold tracking-widest uppercase text-sm ml-2 ${activeView === 'bible' ? 'text-[#c2094c]' : 'text-stone-500'}`}
              onClick={() => { 
                setTargetTestament('OT');
                setTargetBookmark(null);
                handleNavClick('bible'); 
                setIsMobileMenuOpen(false);
              }}
            >
              <Scroll size={16} />
              Old Testament
            </span>
            <span 
              className={`cursor-pointer flex items-center gap-2 font-bold tracking-widest uppercase text-sm ml-2 ${activeView === 'bible' ? 'text-[#c2094c]' : 'text-stone-500'}`}
              onClick={() => { 
                setTargetTestament('NT');
                setTargetBookmark(null);
                handleNavClick('bible'); 
                setIsMobileMenuOpen(false);
              }}
            >
              <BookOpen size={16} />
              New Testament
            </span>
            
            <div className="ml-2 mt-2 flex flex-col gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-stone-300">Translation</span>
              {(() => {
                const versions = [
                  { id: 'IMF', name: 'Inspire My Faith Version' },
                  { id: 'KJV', name: 'King James Version' },
                  { id: 'WEB', name: 'World English Bible' },
                  { id: 'BSB', name: 'Berean Standard Bible' },
                  { id: 'BBE', name: 'Bible in Basic English' }
                ];
                const activeVersionObj = versions.find(v => v.id === globalVersion) || versions[0];
                
                return (
                  <>
                    <div 
                      className={`px-3 py-2 -mx-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors bg-red-50 text-[#c2094c]`}
                      onClick={() => setIsMobileTranslationAccordionOpen(!isMobileTranslationAccordionOpen)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#c2094c]" />
                        <span className="text-sm font-bold">{activeVersionObj.name}</span>
                      </div>
                      {isMobileTranslationAccordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {isMobileTranslationAccordionOpen && (
                      <div className="flex flex-col gap-1 animate-in slide-in-from-top-2 fade-in duration-200">
                        {versions.filter(v => v.id !== globalVersion).map((version) => (
                          <div 
                            key={version.id}
                            className={`px-3 py-2 -mx-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors text-slate-600 hover:bg-stone-50`}
                            onClick={() => {
                              handleGlobalVersionChange(version.id);
                              setIsMobileTranslationAccordionOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <div className="w-2 h-2 rounded-full bg-transparent" />
                            <span className="text-sm font-medium">{version.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400">My Faith</span>
            <span 
              className={`cursor-pointer font-bold tracking-widest uppercase text-sm ml-2 ${activeView === 'faith_verses' ? 'text-[#c2094c]' : 'text-stone-500'}`}
              onClick={() => handleNavClick('faith_verses')}
            >
              Faith Verses
            </span>
            <span 
              className={`cursor-pointer font-bold tracking-widest uppercase text-sm ml-2 ${activeView === 'soul_search' ? 'text-[#c2094c]' : 'text-stone-500'}`}
              onClick={() => handleNavClick('soul_search')}
            >
              Faith Prayer
            </span>
            <span 
              className={`cursor-pointer font-bold tracking-widest uppercase text-sm ml-2 ${activeView === 'prompt_builder' ? 'text-[#c2094c]' : 'text-stone-500'}`}
              onClick={() => handleNavClick('prompt_builder')}
            >
              Faith Builder
            </span>
            <span 
              className={`cursor-pointer font-bold tracking-widest uppercase text-sm ml-2 ${activeView === 'study_guide' ? 'text-[#c2094c]' : 'text-stone-500'}`}
              onClick={() => handleNavClick('study_guide')}
            >
              Faith Guide
            </span>

            <span 
              className={`cursor-pointer font-bold tracking-widest uppercase text-sm ml-2 ${activeView === 'sermon_notes' ? 'text-[#c2094c]' : 'text-stone-500'}`}
              onClick={() => handleNavClick('sermon_notes')}
            >
              Faith Diary
            </span>
            <span 
              className={`cursor-pointer font-bold tracking-widest uppercase text-sm ml-2 ${activeView === 'faith_timeline' ? 'text-[#c2094c]' : 'text-stone-500'}`}
              onClick={() => handleNavClick('faith_timeline')}
            >
              Faith Timeline
            </span>
          </div>
          <span 
            className={`cursor-pointer font-bold tracking-widest uppercase text-sm hover:text-[#c2094c] flex items-center gap-2 ${isBookmarksModalOpen ? 'text-[#c2094c]' : 'text-stone-500'}`}
            onClick={() => { setIsBookmarksModalOpen(true); setIsMobileMenuOpen(false); }}
          >
            Bookmarks
          </span>
          


          <hr className="border-stone-100 my-2" />
          
          {isAdmin && (
          <div className="flex gap-4">
            <button 
              className={`cursor-pointer flex items-center gap-2 font-medium text-sm ${activeView === 'admin' ? 'text-[#c2094c]' : 'text-stone-500'}`}
              onClick={() => { handleNavClick('admin'); setIsMobileMenuOpen(false); }}
            >
              <Activity size={16} /> Bible Builder
            </button>
          </div>
          )}

          <hr className="border-stone-100 my-2" />
          <div className="flex flex-col">
            {user ? (
                <button 
                  onClick={signOut}
                  className="flex items-center justify-center gap-2 p-3 w-full bg-stone-100 text-stone-600 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-stone-200 transition-colors"
                >
                  <img src={user.photoURL || ''} alt="User" className="w-5 h-5 rounded-full object-cover" />
                  Sign Out
                </button>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center justify-center gap-2 p-3 w-full bg-[#c2094c] text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm hover:bg-[#a0073e] transition-colors"
                >
                  <LogIn size={16} />
                  Sign In
                </button>
              )}
          </div>
        </div>
      )}

      {activeView === 'bible' && <BibleReader globalVersion={globalVersion} onGoHome={() => handleNavClick('home')} initialBookmark={targetBookmark} clearInitialBookmark={() => setTargetBookmark(null)} initialTestament={targetTestament} clearInitialTestament={() => setTargetTestament(null)} onReturn={returnView ? handleReturn : undefined} />}
      
      {['faith_verses', 'soul_search', 'prompt_builder', 'study_guide', 'reading_plans', 'sermon_notes', 'faith_timeline'].includes(activeView) && (
        <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
          {activeView === 'faith_verses' && (
            <FaithVerses 
              onNavigate={(view, data) => {
                if (view === 'bible') {
                  handleNavClick('bible', data);
                }
              }} 
              onEditEvent={setEditingVerseId} 
            />
          )}
          {activeView === 'soul_search' && <SoulSearch globalVersion={globalVersion} targetPrayerId={targetPrayer} clearTargetPrayer={() => setTargetPrayer(null)} onReturn={returnView ? handleReturn : undefined} />}
          {activeView === 'prompt_builder' && <PromptBuilder globalVersion={globalVersion} />}
          {activeView === 'study_guide' && <StudyGuide onGoHome={() => handleNavClick('home')} targetVerseId={targetVerse} clearTargetVerse={() => setTargetVerse(null)} />}
          {activeView === 'reading_plans' && <ReadingPlans />}
          {activeView === 'sermon_notes' && <SermonNotes targetNoteId={targetNote} clearTargetNote={() => setTargetNote(null)} onReturn={returnView ? handleReturn : undefined} />}
          {activeView === 'faith_timeline' && <FaithTimeline onNavigate={handleNavClick} />}
        </main>
      )}
      {activeView === 'admin' && (
        <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#faf9f8]">
          {isAdmin ? <AdminDashboard userEmail={user?.email || ''} isSuperAdmin={isSuperAdmin} /> : <div className="p-8 text-center text-stone-500">Access Denied</div>}
        </main>
      )}

      {activeView === 'home' && (
        <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-7xl mx-auto px-8 md:px-16 py-12 md:py-24 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row items-center gap-16 mb-24">
              {/* Left: Logo */}
              <div className="w-full lg:w-1/2 flex justify-center">
                 <div className="w-full max-w-md flex items-center justify-center p-4 relative group">
                    <img src="/logo.png" alt="Inspire My Faith Logo" className="w-full h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if(parent) {
                          const placeholder = document.createElement('div');
                          placeholder.className = "text-center space-y-4 relative z-10";
                          placeholder.innerHTML = `<h2 class="text-5xl font-serif text-slate-900 tracking-tight">INSPIRE<br/>MY FAITH</h2><p class="text-sm font-bold text-[#c2094c] uppercase tracking-widest mt-2">Logo Placeholder</p><p class="text-xs text-stone-500">Upload logo to public/logo.png</p>`;
                          parent.appendChild(placeholder);
                        }
                      }} 
                    />
                 </div>
              </div>
              
              {/* Right: Content */}
              <div className="w-full lg:w-1/2 space-y-10">
                <div className="space-y-6">
                  <h3 className="text-[#c2094c] font-bold tracking-widest text-[11px] uppercase">Discover the power of faith</h3>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl text-slate-900 font-serif leading-[1.1] tracking-tight">
                    Inspire My Faith
                  </h1>
                  <p className="text-stone-500 text-base sm:text-lg leading-relaxed max-w-lg">
                    Discover the profound and transformative journey of faith that awaits you as you embrace the love and guidance of God and Jesus, inviting their miraculous presence into every aspect of your life and allowing their divine influence to inspire and uplift your spirit.
                  </p>
                </div>
                
                {/* Verse of the Day Card */}
                <div className="w-full max-w-2xl">
                  <VerseOfTheDayCard />
                </div>
              </div>
            </div>

            {/* Ad placement - Middle */}
            <div className="max-w-4xl mx-auto px-4 mb-24">
              <AdBanner dataAdSlot="home_page_middle" />
            </div>

            {/* Grid Section */}
            <div className="text-center space-y-20 pb-24 border-t border-stone-200 pt-24">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-900 tracking-tight">Explore Inspire My Faith</h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-12 gap-y-12 sm:gap-y-16 px-2 sm:px-0">
                {/* Row 1 */}
                <div onClick={() => handleNavClick('bible')} className="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#c2094c] shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-[#c2094c]/20 transition-all duration-300">
                    <BookOpen size={32} strokeWidth={1.5} />
                  </div>
                  <h5 className="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-[#c2094c] transition-colors">The Holy Bible</h5>
                  <p className="text-stone-500 text-sm max-w-[220px] leading-relaxed">Read, study, and search through the sacred scriptures.</p>
                </div>
                <div onClick={() => handleNavClick('soul_search')} className="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#c2094c] shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-[#c2094c]/20 transition-all duration-300">
                    <Heart size={32} strokeWidth={1.5} />
                  </div>
                  <h5 className="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-[#c2094c] transition-colors">Faith Prayer</h5>
                  <p className="text-stone-500 text-sm max-w-[220px] leading-relaxed">Find verses tailored to your feelings and build your prayer journal.</p>
                </div>
                <div onClick={() => handleNavClick('study_guide')} className="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#c2094c] shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-[#c2094c]/20 transition-all duration-300">
                    <BookHeart size={32} strokeWidth={1.5} />
                  </div>
                  <h5 className="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-[#c2094c] transition-colors">Faith Guide</h5>
                  <p className="text-stone-500 text-sm max-w-[220px] leading-relaxed">Build scripture memory and deeply understand God's Word.</p>
                </div>
                <div onClick={() => handleNavClick('faith_verses')} className="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#c2094c] shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-[#c2094c]/20 transition-all duration-300">
                    <HeartHandshake size={32} strokeWidth={1.5} />
                  </div>
                  <h5 className="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-[#c2094c] transition-colors">Faith Verses</h5>
                  <p className="text-stone-500 text-sm max-w-[220px] leading-relaxed">Daily inspiration and a curated library of scripture.</p>
                </div>
                
                {/* Row 2 */}
                <div onClick={() => handleNavClick('sermon_notes')} className="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#c2094c] shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-[#c2094c]/20 transition-all duration-300">
                    <PenTool size={32} strokeWidth={1.5} />
                  </div>
                  <h5 className="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-[#c2094c] transition-colors">Faith Diary</h5>
                  <p className="text-stone-500 text-sm max-w-[220px] leading-relaxed">Take organized notes during church and tag them by scripture.</p>
                </div>
                <div onClick={() => handleNavClick('faith_timeline')} className="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#c2094c] shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-[#c2094c]/20 transition-all duration-300">
                    <Signpost size={32} strokeWidth={1.5} />
                  </div>
                  <h5 className="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-[#c2094c] transition-colors">Faith Timeline</h5>
                  <p className="text-stone-500 text-sm max-w-[220px] leading-relaxed">Track your answered prayers and key spiritual milestones.</p>
                </div>
                <div onClick={() => handleNavClick('prompt_builder')} className="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#c2094c] shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-[#c2094c]/20 transition-all duration-300">
                    <MessageSquareText size={32} strokeWidth={1.5} />
                  </div>
                  <h5 className="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-[#c2094c] transition-colors">Faith Builder</h5>
                  <p className="text-stone-500 text-sm max-w-[220px] leading-relaxed">Craft personalized AI prompts to deepen your biblical understanding.</p>
                </div>
                <div onClick={() => setIsBookmarksModalOpen(true)} className="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#c2094c] shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-[#c2094c]/20 transition-all duration-300">
                    <Bookmark size={32} strokeWidth={1.5} />
                  </div>
                  <h5 className="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-[#c2094c] transition-colors">Faith Bookmarks</h5>
                  <p className="text-stone-500 text-sm max-w-[220px] leading-relaxed">Access your saved verses and personal bookmarks in one place.</p>
                </div>
              </div>
            </div>

            {/* Ad placement */}
            <div className="max-w-4xl mx-auto px-4 mt-12">
              <AdBanner dataAdSlot="home_page_bottom" />
            </div>

          </div>
        </main>
      )}
    </div>
  );
}
