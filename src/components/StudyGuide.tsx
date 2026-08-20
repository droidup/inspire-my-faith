import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BookHeart, ChevronRight, Bookmark, ArrowLeft, Home, Download, FileText, ChevronDown, 
  X, Search, Maximize, Sparkles, Copy, Check, Calendar as CalendarIcon, 
  FolderOpen, Compass, Heart, Circle, CheckCircle2, Pin, PinOff, BrainCircuit, Trash2,
  MessageSquareText, ChevronLeft, Plus, LayoutGrid, List, Settings, FolderPlus,
  PenTool, AlertTriangle, Map, Flag, Bell, Info, Minus, Church, Cross,
  Flame, Sun, Bird, HeartHandshake, Hand, HandHeart, Moon, Cloud, Leaf,
  Wind, Zap, Droplet, Snowflake, Mountain, Trees, Waves, Shield, Anchor,
  Key, Crown, Gem, Sword, Clock, Camera, Coffee, Gift, Umbrella, Users,
  User, Smile, Frown, Meh, Eye, HeartCrack, Activity, Star, BookOpen, Loader2
} from 'lucide-react';
import { useSavedVerses, SavedVerse } from '../hooks/useSavedVerses';
import StudyGuideModal from './StudyGuideModal';
import RichTextEditor from './RichTextEditor';
import MemorizeModal from './MemorizeModal';
import AdBanner from './AdBanner';
import { useCollectionSettings } from '../hooks/useCollectionSettings';
import { useAuth } from '../contexts/AuthContext';
import FaithGuideView from './FaithGuideView';
import StandardToolbar from './shared/StandardToolbar';

const ICON_MAP: Record<string, React.ElementType> = {
  FolderOpen, Bookmark, Star, Heart, Map, Flag, CheckCircle2, Compass, Home, Settings, Search, Bell, AlertTriangle, Info, Plus, Minus, X, Check,
  BookOpen, BookHeart, Church, Cross, Sparkles, Flame, Sun, Bird, HeartHandshake, Hand, HandHeart,
  Moon, Cloud, Leaf, Wind, Zap, Droplet, Snowflake, Mountain, Trees, Waves,
  Shield, Anchor, Key, Crown, Gem, Sword, Clock, PenTool, Camera, Coffee, Gift, Umbrella,
  Users, User, Smile, Frown, Meh, Eye, HeartCrack, Activity
};

const ICON_CATEGORIES = [
  { name: 'Essentials', icons: ['FolderOpen', 'Bookmark', 'Star', 'Heart', 'Map', 'Flag', 'CheckCircle2', 'Compass', 'Home', 'Settings', 'Search', 'Bell', 'AlertTriangle', 'Info', 'Plus', 'Minus', 'X', 'Check'] },
  { name: 'Faith', icons: ['BookOpen', 'BookHeart', 'Church', 'Cross', 'Sparkles', 'Flame', 'Sun', 'Bird', 'HeartHandshake', 'Hand', 'HandHeart'] },
  { name: 'Nature', icons: ['Moon', 'Cloud', 'Leaf', 'Wind', 'Zap', 'Droplet', 'Snowflake', 'Mountain', 'Trees', 'Waves'] },
  { name: 'Objects', icons: ['Shield', 'Anchor', 'Key', 'Crown', 'Gem', 'Sword', 'Clock', 'PenTool', 'Camera', 'Coffee', 'Gift', 'Umbrella'] },
  { name: 'People', icons: ['Users', 'User', 'Smile', 'Frown', 'Meh', 'Eye', 'HeartCrack', 'Activity'] }
];

const PRESET_COLORS = ['#c2094c', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#64748b', '#14b8a6'];

const OT_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
];

const NT_BOOKS = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
  'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

interface StudyGuideProps {
  onGoHome?: () => void;
  targetVerseId?: string;
  clearTargetVerse?: () => void;
  onReturn?: () => void;
}

export default function StudyGuide({ onGoHome, targetVerseId, clearTargetVerse, onReturn }: StudyGuideProps) {
  const { savedVerses, saveVerse, updateNote, removeVerse, toggleVersePin, toggleVerseMemorized, toggleVerseCollection, renameCollectionInItems } = useSavedVerses();
  const { collectionSettings, updateCollectionSetting, togglePinCollection, renameCollection, deleteCollection } = useCollectionSettings('verse');
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'search' | 'calendar' | 'collections'>('search');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTestament, setActiveTestament] = useState<'OT' | 'NT'>('OT');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);
  const bookDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(event.target as Node)) {
        setIsBookDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const [verseToEdit, setVerseToEdit] = useState<SavedVerse | null>(null);
  const [verseToMemorize, setVerseToMemorize] = useState<SavedVerse | null>(null);
  
  const [selectedVerses, setSelectedVerses] = useState<string[]>([]);
  
  useEffect(() => {
    if (targetVerseId) {
      setActiveTab('search');
      const verse = savedVerses.find(v => v.id === targetVerseId);
      if (verse) {
        setVerseToEdit(verse);
      }
      if (clearTargetVerse) {
        clearTargetVerse();
      }
    }
  }, [targetVerseId, savedVerses, clearTargetVerse]);
  
  // Summary Modal State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  // Calendar Heatmap State
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  
  // Collection State
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [activeCollectionDropdown, setActiveCollectionDropdown] = useState<string | null>(null);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#c2094c');
  const [editIcon, setEditIcon] = useState('FolderOpen');
  const [editDescription, setEditDescription] = useState('');
  const [activeIconTab, setActiveIconTab] = useState('Essentials');
  const [newCollectionName, setNewCollectionName] = useState('');

  const [showBulkCollectionPopover, setShowBulkCollectionPopover] = useState(false);
  const bulkSaveBtnRef = React.useRef<HTMLButtonElement>(null);
  const bulkSavePopoverRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showBulkCollectionPopover &&
        bulkSavePopoverRef.current &&
        !bulkSavePopoverRef.current.contains(event.target as Node) &&
        bulkSaveBtnRef.current &&
        !bulkSaveBtnRef.current.contains(event.target as Node)
      ) {
        setShowBulkCollectionPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showBulkCollectionPopover]);

  const handleBulkSaveToCollection = (collectionName: string) => {
    selectedVerses.forEach(verseId => {
      const verse = savedVerses.find(v => v.id === verseId);
      if (verse && (!verse.collections || !verse.collections.includes(collectionName))) {
        toggleVerseCollection(verseId, collectionName);
      }
    });
    setShowBulkCollectionPopover(false);
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const verseDatesSet = useMemo(() => {
    const dates = new Set<string>();
    savedVerses.forEach(v => {
      if (v.savedAt) {
        const d = new Date(v.savedAt);
        dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    });
    return dates;
  }, [savedVerses]);

  const uniqueCollections = useMemo(() => {
    const fromVerses = savedVerses.flatMap(v => v.collections || []);
    const fromSettings = Object.keys(collectionSettings);
    return (Array.from(new Set([...fromVerses, ...fromSettings].filter(Boolean))) as string[])
      .sort((a, b) => {
        const pinA = collectionSettings[a]?.isPinned ? 1 : 0;
        const pinB = collectionSettings[b]?.isPinned ? 1 : 0;
        return pinB - pinA;
      });
  }, [savedVerses, collectionSettings]);

  const toggleVerseSelection = (id: string) => {
    setSelectedVerses(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const nextMonth = () => {
    setSelectedDateFilter(null);
    if (calendarView === 'week') setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() + 7));
    else if (calendarView === 'year') setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
    else setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setSelectedDateFilter(null);
    if (calendarView === 'week') setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() - 7));
    else if (calendarView === 'year') setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
    else setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  };

  const generateSummary = async (itemsToSummarize: SavedVerse[], contextName?: string) => {
    if (itemsToSummarize.length === 0) return;
    setIsSummaryModalOpen(true);
    setGeneratingSummary(true);
    setSummaryText('');
    
    try {
      const res = await fetch('/api/timeline_summary.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: itemsToSummarize })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSummaryText(data.data);
      } else {
        setSummaryText('Failed to generate summary.');
      }
    } catch (e) {
      setSummaryText('Failed to generate summary.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const filteredVersesForView = useMemo(() => {
    let filtered = savedVerses;
    if (activeTab === 'collections') {
      if (selectedCollection) {
        filtered = savedVerses.filter(v => v.collections?.includes(selectedCollection));
      } else {
        return [];
      }
    } else if (activeTab === 'calendar') {
      if (calendarView === 'day') {
        if (!selectedDateFilter) return [];
        filtered = savedVerses.filter(v => {
          if (!v.savedAt) return false;
          const d = new Date(v.savedAt);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === selectedDateFilter;
        });
      } else if (calendarView === 'week') {
        const startOfWeek = new Date(currentMonth);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        filtered = savedVerses.filter(v => {
          if (!v.savedAt) return false;
          const d = new Date(v.savedAt);
          return d >= startOfWeek && d <= endOfWeek;
        });
      } else if (calendarView === 'month') {
        filtered = savedVerses.filter(v => {
          if (!v.savedAt) return false;
          const d = new Date(v.savedAt);
          return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
        });
      } else if (calendarView === 'year') {
        filtered = savedVerses.filter(v => {
          if (!v.savedAt) return false;
          const d = new Date(v.savedAt);
          return d.getFullYear() === currentMonth.getFullYear();
        });
      }
    }
    return filtered;
  }, [savedVerses, activeTab, selectedCollection, calendarView, currentMonth, selectedDateFilter]);


  // Library Sidebar Logic (Tab 1)
  const otVerses = useMemo(() => savedVerses.filter(v => OT_BOOKS.includes(v.bookName)), [savedVerses]);
  const ntVerses = useMemo(() => savedVerses.filter(v => NT_BOOKS.includes(v.bookName)), [savedVerses]);
  const activeVerses = activeTestament === 'OT' ? otVerses : ntVerses;
  
  const booksWithVerses = useMemo(() => {
    const grouped = activeVerses.reduce((acc, verse) => {
      if (!acc[verse.bookName]) acc[verse.bookName] = [];
      acc[verse.bookName].push(verse);
      return acc;
    }, {} as Record<string, SavedVerse[]>);
    const referenceList = activeTestament === 'OT' ? OT_BOOKS : NT_BOOKS;
    return (Object.keys(grouped) as string[]).sort((a, b) => referenceList.indexOf(a) - referenceList.indexOf(b));
  }, [activeVerses, activeTestament]);

  const handleTestamentChange = (testament: 'OT' | 'NT') => {
    setActiveTestament(testament);
    setSelectedBook(null);
  };

  const currentBookVerses = selectedBook ? activeVerses.filter(v => v.bookName === selectedBook) : [];
  const versesToRender = useMemo(() => {
    if (selectedBook) {
      return [...currentBookVerses].sort((a, b) => {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.verseNum - b.verseNum;
      });
    } else {
      return [...activeVerses].sort((a, b) => {
        if (a.bookName !== b.bookName) {
           return a.bookName.localeCompare(b.bookName);
        }
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verseNum - b.verseNum;
      });
    }
  }, [currentBookVerses, activeVerses, selectedBook]);



  const renderVerseCard = (verse: SavedVerse, contextColor: string = '#c2094c') => {
    const isSelected = selectedVerses.includes(verse.id);
    const timeStr = verse.savedAt ? new Date(verse.savedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
    const isPinned = verse.isPinned;
    const badgeColor = "bg-purple-50 text-purple-600 border-purple-100";
    
    const ActionMenu = () => (
      <div className="flex items-center gap-1 sm:gap-2 text-stone-400">
        <div className="relative group/btn">
          <button onClick={(e) => { e.stopPropagation(); toggleVersePin(verse); }} className={`p-1.5 hover:bg-stone-100 rounded-md transition-colors ${isPinned ? 'text-blue-500' : 'hover:text-slate-600'}`}>
            {isPinned ? <Pin className="fill-current" size={16} /> : <Pin size={16} />}
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            {isPinned ? 'Unpin' : 'Pin'}
          </span>
        </div>
        <div className="relative group/btn">
          <button onClick={(e) => { e.stopPropagation(); handleCopy(verse.text); }} className="p-1.5 hover:bg-stone-100 rounded-md transition-colors hover:text-slate-600">
            <Copy size={16} />
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            Copy
          </span>
        </div>
        <div className="relative group/btn">
          <button onClick={(e) => { e.stopPropagation(); setVerseToEdit(verse); }} className="p-1.5 hover:bg-stone-100 rounded-md transition-colors hover:text-[#c2094c]">
            <PenTool size={16} />
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#c2094c]/90 backdrop-blur-md border border-[#c2094c]/50 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            Edit
          </span>
        </div>
        <div className="relative group/btn">
          <button onClick={(e) => { e.stopPropagation(); removeVerse(verse.id); }} className="p-1.5 hover:bg-red-50 rounded-md transition-colors hover:text-red-500">
            <Trash2 size={16} />
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md border border-red-500/50 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            Delete
          </span>
        </div>
      </div>
    );

    if (viewMode === 'grid') {
      return (
         <div key={verse.id} onClick={() => setVerseToEdit(verse)} className={`bg-white border p-6 rounded-3xl shadow-sm hover:shadow-md transition-all relative flex flex-col cursor-pointer ${isSelected ? 'border-[#f43f5e] ring-2 ring-[#f43f5e]/20' : 'border-stone-200'}`}>
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
               <button onClick={(e) => { e.stopPropagation(); toggleVerseSelection(verse.id); }} className="text-stone-300 hover:text-[#f43f5e] transition-colors shrink-0">
                 {isSelected ? <CheckCircle2 size={20} className="text-[#f43f5e] fill-[#f43f5e]/10" /> : <Circle size={20} />}
               </button>
               <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border inline-block whitespace-nowrap ${badgeColor}`}>
                 Faith Guide
               </span>
             </div>
             <ActionMenu />
           </div>
           
           <div className="flex items-start gap-4 flex-1">
              <div onClick={(e) => { e.stopPropagation(); setVerseToEdit(verse); }} className={`w-10 h-10 rounded-full bg-white border-2 shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 cursor-pointer border-stone-100 hover:scale-110 hover:border-[#c2094c]/20`}>
                <BookHeart size={18} className="text-purple-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-serif text-slate-900 mb-2">{verse.bookName} {verse.chapter}:{verse.verseNum}</h4>
                <p className="text-stone-600 leading-relaxed text-sm line-clamp-4 whitespace-pre-wrap italic">
                  "{verse.text}"
                </p>
                {verse.collections && verse.collections.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {verse.collections.map((c: string) => {
                      const cColor = collectionSettings[c]?.color || '#c2094c';
                      return (
                        <span key={c} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" style={{ color: cColor, backgroundColor: `${cColor}1A` }}>
                          {c}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
           </div>
           <div className="mt-auto pt-4 flex justify-end">
              {!selectedBook ? (
                 <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border bg-stone-100 text-stone-600 border-stone-200 shadow-sm">{verse.bookName}</span>
              ) : (
                 <div className="text-xs text-stone-400 font-bold uppercase tracking-widest">{timeStr}</div>
              )}
           </div>
         </div>
      );
    }
    
    // List View
    return (
      <div key={verse.id} className="relative flex items-start gap-6 sm:gap-8 group">
        <div className="flex-1 flex items-start gap-4">
          <button onClick={(e) => { e.stopPropagation(); toggleVerseSelection(verse.id); }} className="mt-4 text-stone-300 hover:text-[#f43f5e] transition-colors shrink-0">
             {isSelected ? <CheckCircle2 size={22} className="text-[#f43f5e] fill-[#f43f5e]/10" /> : <Circle size={22} />}
          </button>
          
          <div onClick={(e) => { e.stopPropagation(); setVerseToEdit(verse); }} className={`w-12 h-12 rounded-full bg-white border-[3px] shadow-sm flex items-center justify-center shrink-0 mt-1 relative z-10 transition-transform duration-300 cursor-pointer border-stone-100 hover:scale-110 hover:border-[#c2094c]/20`}>
            <BookHeart size={20} className="text-purple-500" />
          </div>
          
          <div onClick={() => setVerseToEdit(verse)} className={`flex-1 bg-white border p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isSelected ? 'border-[#f43f5e] ring-1 ring-[#f43f5e]/20' : 'border-stone-200'}`}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${badgeColor}`}>
                  Faith Guide
                </span>
                {!selectedBook ? (
                   <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border bg-stone-100 text-stone-600 border-stone-200 shadow-sm">{verse.bookName}</span>
                ) : (
                   <span className="text-stone-400 text-sm font-bold uppercase tracking-widest">{timeStr}</span>
                )}
              </div>
              <ActionMenu />
            </div>
            <h4 className="text-xl font-serif text-slate-900 mb-2">{verse.bookName} {verse.chapter}:{verse.verseNum}</h4>
            <p className="text-stone-600 leading-relaxed text-sm whitespace-pre-wrap italic">
              "{verse.text}"
            </p>
            {verse.collections && verse.collections.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-4">
                {verse.collections.map((c: string) => {
                  const cColor = collectionSettings[c]?.color || '#c2094c';
                  return (
                    <span key={c} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" style={{ color: cColor, backgroundColor: `${cColor}1A` }}>
                      {c}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#faf9f8] p-4 sm:p-8 md:p-12 animate-in fade-in duration-700 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="max-w-4xl mx-auto w-full flex flex-col relative shrink-0">
        
        {/* Navigation / Header Area */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-stone-100 p-1 rounded-2xl w-fit shrink-0 shadow-inner">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'search' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <BookOpen size={16} /> Faith Guide
            </button>
            <button
              onClick={() => { setActiveTab('calendar'); }}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'calendar' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <CalendarIcon size={16} /> Guide Calendar
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'collections' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <FolderOpen size={16} /> Guide Collections
            </button>
          </div>
        </div>

        {/* Standard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center text-[#c2094c]">
              {activeTab === 'calendar' ? <CalendarIcon size={24} /> : activeTab === 'collections' ? <FolderOpen size={24} /> : <BookHeart size={24} />}
            </div>
            <div>
              <h2 className="text-3xl font-serif text-slate-900">
                {activeTab === 'calendar' ? 'Guide Calendar' : activeTab === 'collections' ? 'Guide Collections' : 'Faith Guide'}
              </h2>
              <p className="text-stone-500 text-sm font-medium tracking-wide">
                {activeTab === 'calendar' ? 'View and track your saved guidance over time.' : activeTab === 'collections' ? 'Organize your verses and scriptures.' : 'Your saved verses, scriptures, and divine guidance.'}
              </p>
            </div>
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${activeTab === 'search' ? 'items-start' : 'gap-6 md:gap-8'}`}>
          
          {/* Main Tab View */}
          {activeTab === 'search' && (
            <div className="flex flex-col w-full relative">
              <StandardToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchPlaceholder="Search verses...">
                {selectedVerses.length > 0 && (
                  <div className="relative">
                    <button 
                      ref={bulkSaveBtnRef}
                      onClick={() => setShowBulkCollectionPopover(!showBulkCollectionPopover)}
                      className="bg-[#f43f5e] text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-colors flex items-center gap-2 shadow-sm shadow-[#f43f5e]/20"
                    >
                      <FolderPlus size={16} /> Save {selectedVerses.length} Items
                    </button>
                    
                    {showBulkCollectionPopover && (
                      <div ref={bulkSavePopoverRef} className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden">
                        <div className="bg-stone-50 px-4 py-2 border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-500 flex justify-between items-center">
                          Save to Collection
                          <button onClick={() => setShowBulkCollectionPopover(false)} className="text-stone-400 hover:text-stone-600"><X size={14}/></button>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2">
                         {uniqueCollections.map(colName => (
                           <button
                             key={colName}
                             onClick={() => handleBulkSaveToCollection(colName)}
                             className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors flex items-center justify-between"
                           >
                             {colName}
                           </button>
                         ))}
                       </div>
                       <div className="border-t border-stone-200 p-2 flex gap-2">
                         <input
                           type="text"
                           value={newCollectionName}
                           onChange={(e) => setNewCollectionName(e.target.value)}
                           placeholder="New Collection..."
                           className="flex-1 min-w-0 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-sm outline-none focus:border-[#c2094c]"
                         />
                         <button 
                           onClick={() => {
                             if (newCollectionName.trim()) {
                               updateCollectionSetting(newCollectionName.trim(), {});
                               handleBulkSaveToCollection(newCollectionName.trim());
                               setNewCollectionName('');
                             }
                           }}
                           disabled={newCollectionName.trim() === ''}
                           className="bg-[#c2094c] text-white p-1.5 rounded-lg hover:bg-rose-600 disabled:opacity-50 transition-colors border-none"
                         >
                           <Plus size={16} />
                         </button>
                       </div>
                      </div>
                    )}
                  </div>
                )}
                
                <button 
                  onClick={() => generateSummary(selectedVerses.length > 0 ? savedVerses.filter(v => selectedVerses.includes(v.id)) : (selectedBook ? currentBookVerses : savedVerses))}
                  className="bg-[#c2094c] text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#a1073e] transition-colors flex items-center gap-2 shadow-sm shadow-[#c2094c]/20"
                >
                  <Sparkles size={16} /> AI Pastoral Summary
                </button>
                
                <div className="flex bg-stone-100 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    title="Grid View"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    title="List View"
                  >
                    <List size={16} />
                  </button>
                </div>
              </StandardToolbar>

              {/* Filters Area */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="relative flex bg-stone-100/80 p-1 rounded-xl shrink-0 shadow-inner">
                  <div 
                    className="absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm border border-stone-200/50 transition-all duration-300 ease-in-out"
                    style={{ left: activeTestament === 'OT' ? '4px' : 'calc(50%)' }}
                  />
                  <button 
                    onClick={() => handleTestamentChange('OT')}
                    className={`relative z-10 w-32 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${activeTestament === 'OT' ? 'text-[#c2094c]' : 'text-stone-500 hover:text-slate-700'}`}
                  >
                    Old Testament
                  </button>
                  <button 
                    onClick={() => handleTestamentChange('NT')}
                    className={`relative z-10 w-32 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${activeTestament === 'NT' ? 'text-[#c2094c]' : 'text-stone-500 hover:text-slate-700'}`}
                  >
                    New Testament
                  </button>
                </div>

                <div className="flex-1 w-full sm:w-auto max-w-xs relative" ref={bookDropdownRef}>
                  <button
                    onClick={() => setIsBookDropdownOpen(!isBookDropdownOpen)}
                    className="w-full flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-2.5 shadow-sm hover:bg-stone-50 transition-colors text-left"
                  >
                    <span className="text-sm font-bold text-slate-700 truncate">
                      {selectedBook ? selectedBook : "ALL BOOKS"}
                    </span>
                    <ChevronDown size={16} className={`text-stone-400 transition-transform ${isBookDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isBookDropdownOpen && (
                    <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-full min-w-[200px] bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-60 overflow-y-auto py-1">
                        <button
                          onClick={() => { setSelectedBook(null); setIsBookDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between ${
                            !selectedBook ? 'bg-pink-50 text-[#c2094c]' : 'text-slate-700 hover:bg-stone-50'
                          }`}
                        >
                          ALL BOOKS
                          {!selectedBook && <Check size={16} />}
                        </button>
                        {booksWithVerses.map(book => {
                          const isSelected = selectedBook === book;
                          return (
                            <button
                              key={book}
                              onClick={() => { setSelectedBook(book); setIsBookDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between ${
                                isSelected ? 'bg-pink-50 text-[#c2094c]' : 'text-slate-700 hover:bg-stone-50'
                              }`}
                            >
                              {book}
                              {isSelected && <Check size={16} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="relative w-full pb-24">
                {viewMode === 'list' && (
                  <div className="absolute left-[34px] top-4 bottom-0 w-1 bg-stone-100 rounded-full"></div>
                )}
                <div className={`flex-1 ${viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6'}`}>
                  {versesToRender.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-white rounded-3xl border border-stone-100 shadow-sm">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                        <Bookmark size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No Verses Found</h3>
                      <p className="text-stone-500 max-w-sm mx-auto">
                        There are no saved verses matching your filters in this testament.
                      </p>
                    </div>
                  ) : (
                    <>
                      {versesToRender.map(verse => renderVerseCard(verse))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab View */}
          {(activeTab === 'calendar' || activeTab === 'collections') && (
            <FaithGuideView 
              isEmbedded={true} 
              onNavigate={onGoHome} 
              forcedTab={activeTab === 'collections' ? 'collections' : 'calendar'} 
              onEditEvent={(id) => {
                const verse = savedVerses.find(v => v.id === id);
                if (verse) setVerseToEdit(verse);
              }}
            />
          )}
        </div>
      </div>
      
      {verseToEdit && (
        <StudyGuideModal 
          isOpen={true}
          verse={verseToEdit}
          onClose={() => {
            setVerseToEdit(null);
            if (clearTargetVerse) clearTargetVerse();
            if (onReturn) onReturn();
          }}
          onUpdateNote={updateNote}
          onDelete={removeVerse}
          availableCollections={uniqueCollections}
          onUpdateCollections={async (collections) => {
             // We need a way to bulk update a verse's collections or individually toggle them.
             // It's easier to just call saveVerse with the updated collections array.
             await saveVerse({ ...verseToEdit, collections });
             setVerseToEdit({ ...verseToEdit, collections });
          }}
        />
      )}
      
      {verseToMemorize && (
        <MemorizeModal
          verse={verseToMemorize}
          onClose={() => setVerseToMemorize(null)}
        />
      )}
      
      {/* AI Summary Modal */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-stone-100 shrink-0">
              <h3 className="text-xl font-serif text-[#c2094c] flex items-center gap-2">
                <Sparkles size={24} />
                AI Pastoral Summary
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopySummary}
                  disabled={!summaryText || generatingSummary}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {summaryCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  {summaryCopied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={() => setIsSummaryModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-600 bg-stone-50 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-[#faf9f8]">
              {generatingSummary ? (
                <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                  <Loader2 size={32} className="animate-spin mb-4 text-[#c2094c]" />
                  <p>Reflecting on your items...</p>
                </div>
              ) : (
                <div className="prose prose-stone prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {summaryText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
