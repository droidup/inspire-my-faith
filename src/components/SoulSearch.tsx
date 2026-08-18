import React, { useState, useEffect } from 'react';
import { Send, Compass, BookHeart, Check, Heart, Languages, Loader2, Bookmark, CheckCircle2, Circle, Copy, FolderOpen, Sparkles, X, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, AlertTriangle, Pin, PinOff, LayoutGrid, List, Settings, Crosshair, Map, Sun, Flag, Star, Moon, Cloud, Flame, Leaf, Wind, Zap, BookOpen, Shield, Anchor, Key, Bell, Crown, Gem, Home, Search, Info, Minus, Church, Cross, Bird, HeartHandshake, Hand, HandHeart, Droplet, Snowflake, Mountain, Trees, Waves, Sword, Clock, Camera, Coffee, Gift, Umbrella, Users, User, Smile, Frown, Meh, Eye, HeartCrack, Activity, PenTool, MessageSquareText } from 'lucide-react';
import AdBanner from './AdBanner';
import { usePrayers, Prayer } from '../hooks/usePrayers';
import { useCollectionSettings } from '../hooks/useCollectionSettings';

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
import { useAuth } from '../contexts/AuthContext';
import AuthPromptModal from './AuthPromptModal';
import PrayerJournalView from './PrayerJournalView';
import RichTextEditor from './RichTextEditor';
import FolderDropdown from './shared/FolderDropdown';

interface SoulSearchProps {
  globalVersion: string;
  targetPrayerId?: string | null;
  clearTargetPrayer?: () => void;
  onReturn?: () => void;
}

export default function SoulSearch({ globalVersion, targetPrayerId, clearTargetPrayer, onReturn }: SoulSearchProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'calendar' | 'seasons' | 'collections'>('search');
  

  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [originalResults, setOriginalResults] = useState<any[]>([]);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState('');
  const [prayer, setPrayer] = useState('');
  
  const { prayers, savePrayer, removePrayer, toggleAnswered, togglePrayerCollection, togglePrayerPin, renameCollectionInItems } = usePrayers();
  const { collectionSettings, updateCollectionSetting, togglePinCollection, renameCollection, deleteCollection } = useCollectionSettings('prayer');
  const [savingPrayer, setSavingPrayer] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();
  
  // Premium Collection States
  const [folderViewMode, setFolderViewMode] = useState<'grid' | 'list'>('grid');
  const [entryViewMode, setEntryViewMode] = useState<'grid' | 'list'>('grid');
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editColor, setEditColor] = useState('#c2094c');
  const [editIcon, setEditIcon] = useState('FolderOpen');
  const [editDescription, setEditDescription] = useState('');
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [activeIconTab, setActiveIconTab] = useState('General');

  // Seasons of Faith state
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'prayer' | 'thoughts'>('prayer');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<string | null>(null);
  const [savedGeneratedPrayerId, setSavedGeneratedPrayerId] = useState<string | null>(null);

  useEffect(() => {
    if (targetPrayerId) {
      setActiveTab('calendar');
      const prayerToEdit = prayers.find(p => p.id === targetPrayerId);
      if (prayerToEdit) {
        setEditingPrayer(prayerToEdit);
      }
      if (clearTargetPrayer) {
        clearTargetPrayer();
      }
    }
  }, [targetPrayerId, prayers, clearTargetPrayer]);

  const handleDeleteSeason = async () => {
    if (!seasonToDelete) return;
    const seasonPrayers = prayers.filter(p => p.collections?.includes(seasonToDelete));
    for (const prayer of seasonPrayers) {
      await togglePrayerCollection(prayer, seasonToDelete);
    }
    setSeasonToDelete(null);
    if (selectedSeason === seasonToDelete) {
      setSelectedSeason(null);
    }
  };

  // Calendar Heatmap state
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prayerDatesSet = React.useMemo(() => {
    const dates = new Set<string>();
    prayers.forEach(p => {
      const d = new Date(p.timestamp);
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return dates;
  }, [prayers]);
  
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

  const filteredPrayers = React.useMemo(() => {
    let filtered = prayers;

    if (calendarView === 'day') {
      if (!selectedDateFilter) return [];
      filtered = prayers.filter(p => {
        const d = new Date(p.timestamp);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === selectedDateFilter;
      });
    } else if (calendarView === 'week') {
      const startOfWeek = new Date(currentMonth);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0,0,0,0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      
      filtered = prayers.filter(p => {
        const d = new Date(p.timestamp);
        return d >= startOfWeek && d <= endOfWeek;
      });
    } else if (calendarView === 'month') {
      filtered = prayers.filter(p => {
        const d = new Date(p.timestamp);
        return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
      });
    } else if (calendarView === 'year') {
      filtered = prayers.filter(p => {
        const d = new Date(p.timestamp);
        return d.getFullYear() === currentMonth.getFullYear();
      });
    }

    // Sort by timestamp descending (most recent first)
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [prayers, selectedDateFilter, calendarView, currentMonth]);

  // Dropdown state for collections
  const [activeCollectionDropdown, setActiveCollectionDropdown] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Extract unique seasons/collections
  const uniqueSeasons = React.useMemo(() => {
    const fromPrayers = prayers.flatMap(p => p.collections || []);
    const fromSettings = Object.keys(collectionSettings);
    return (Array.from(new Set([...fromPrayers, ...fromSettings].filter(Boolean))) as string[])
      .sort((a, b) => {
        const pinA = collectionSettings[a]?.isPinned ? 1 : 0;
        const pinB = collectionSettings[b]?.isPinned ? 1 : 0;
        return pinB - pinA;
      });
  }, [prayers, collectionSettings]);

  const getContextName = () => {
    if (calendarView === 'day') {
      if (!selectedDateFilter) return '';
      const [year, month, day] = selectedDateFilter.split('-');
      return new Date(parseInt(year), parseInt(month), parseInt(day)).toLocaleDateString();
    } else if (calendarView === 'week') {
      const startOfWeek = new Date(currentMonth);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return `The week of ${startOfWeek.toLocaleDateString()}`;
    } else if (calendarView === 'month') {
      return currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else if (calendarView === 'year') {
      return `The year ${currentMonth.getFullYear()}`;
    }
    return '';
  };

  React.useEffect(() => {
    if (originalResults.length === 0) return;
    
    if (globalVersion === 'KJV') {
      setResults(originalResults);
      return;
    }
    
    setTranslating(true);
    fetch('/api/translate-verses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verses: originalResults, version: globalVersion })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setResults(data.data);
      }
    })
    .catch(console.error)
    .finally(() => setTranslating(false));
  }, [globalVersion, originalResults]);

  const handleSearch = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResults([]);
    setPrayer('');
    setSavedGeneratedPrayerId(null);
    setMessage(null);
    
    try {
      const res = await fetch('/api/soul-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      const data = await res.json();
      
      if (data.success) {
        setOriginalResults(data.data);
        
        if (globalVersion !== 'KJV') {
          setTranslating(true);
          try {
            const tRes = await fetch('/api/translate-verses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ verses: data.data, version: globalVersion })
            });
            const tData = await tRes.json();
            if (tData.success) {
              setResults(tData.data);
            } else {
              setResults(data.data);
            }
          } catch (e) {
            setResults(data.data);
          }
          setTranslating(false);
        } else {
          setResults(data.data);
        }

        if (data.prayer) {
          setPrayer(data.prayer);
        }
      } else {
        setMessage(data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrayer = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    await performSavePrayer();
  };

  const performSavePrayer = async () => {
    if (savedGeneratedPrayerId) {
      const existing = prayers.find(p => p.id === savedGeneratedPrayerId);
      if (existing) {
        setEditingPrayer(existing);
        setActiveTab('calendar');
        return;
      }
    }
    
    setSavingPrayer(true);
    const newId = `generated-${Date.now()}`;
    const newPrayer: Prayer = {
      id: newId,
      title: 'A Prayer for ' + new Date().toLocaleDateString(),
      text: prayer,
      answered: false,
      timestamp: Date.now(),
      reflection: ''
    };
    await savePrayer(newPrayer);
    setSavedGeneratedPrayerId(newId);
    setSavingPrayer(false);
    setActiveTab('calendar');
    setEditingPrayer(newPrayer);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const [selectedPrayers, setSelectedPrayers] = useState<string[]>([]);

  const togglePrayerSelection = (id: string) => {
    setSelectedPrayers(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  };

  const handleGenerateSummary = async (seasonName: string, seasonPrayers: any[]) => {
    const itemsToSummarize = selectedPrayers.length > 0 
      ? seasonPrayers.filter(p => selectedPrayers.includes(p.id))
      : seasonPrayers;
    
    const finalItems = itemsToSummarize.length > 0 ? itemsToSummarize : seasonPrayers;

    setIsSummaryModalOpen(true);
    setGeneratingSummary(true);
    setSummaryText('');

    try {
      const res = await fetch('/api/soul-search/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prayers: finalItems, seasonName })
      });
      const data = await res.json();
      if (data.success) {
        setSummaryText(data.data);
      } else {
        setSummaryText('Failed to generate summary.');
      }
    } catch (err) {
      setSummaryText('Error connecting to AI service.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const renderPrayerCard = (p: any, inSeasonView = false, viewMode: 'grid' | 'list' = 'grid') => {
    const isSelected = selectedPrayers.includes(p.id);
    const activeColor = selectedSeason ? (collectionSettings[selectedSeason]?.color || '#c2094c') : '#c2094c';

    const tooltipClass = selectedSeason
      ? "absolute -top-8 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md"
      : "absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg";

    const tooltipStyle = selectedSeason ? { backgroundColor: activeColor } : {};

    if (viewMode === 'list') {
      return (
        <div key={p.id} onClick={() => setEditingPrayer(p)} className={`bg-white border-b border-stone-100 p-4 flex items-center justify-between transition-colors hover:bg-stone-50 group border-l-4 cursor-pointer ${isSelected ? 'shadow-md' : 'border-transparent'}`} style={isSelected ? { borderLeftColor: activeColor } : {}}>
          <div className="flex items-center gap-4 flex-1 overflow-hidden">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                togglePrayerSelection(p.id);
              }}
              className="shrink-0 transition-transform hover:scale-110 focus:outline-none"
            >
              {isSelected ? (
                <CheckCircle2 size={24} style={{ color: activeColor }} />
              ) : (
                <Circle size={24} className="text-stone-300 hover:text-stone-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 truncate">{p.title}</h4>
                {p.reflection && <MessageSquareText size={14} className="text-[#c2094c] shrink-0" />}
                {p.isPinned && <Pin size={12} className="text-stone-400 shrink-0" />}
              </div>
              <p className="text-sm text-stone-500 truncate">{p.text}</p>
            </div>
            {!inSeasonView && p.collections && p.collections.length > 0 && (
              <div className="hidden sm:flex gap-1 shrink-0">
                {p.collections.map((c: string) => {
                  const badgeColor = collectionSettings[c]?.color || '#c2094c';
                  return (
                    <span 
                      key={c}
                      onClick={(e) => { e.stopPropagation(); setSelectedSeason(c); setActiveTab('seasons'); }}
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ color: badgeColor, backgroundColor: badgeColor + '1A' }}
                    >
                      {c}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {inSeasonView && (
              <div className="relative group/btn">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePrayerPin(p); }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                  onMouseLeave={(e) => { if (!p.isPinned) { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; } }}
                  className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${p.isPinned ? 'opacity-100' : 'text-stone-400'}`}
                  style={p.isPinned ? { color: activeColor, backgroundColor: `${activeColor}1A` } : {}}
                >
                  {p.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
                <span className={tooltipClass} style={tooltipStyle}>
                  {p.isPinned ? "Unpin Prayer" : "Pin Prayer"}
                </span>
              </div>
            )}
            <div className="relative group/btn">
              <button
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.text); }}
                onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; }}
                className="p-2 text-stone-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <Copy size={16} />
              </button>
              <span className={tooltipClass} style={tooltipStyle}>
                Copy
              </span>
            </div>
            
            <div className="relative group/btn">
              <button
                onClick={(e) => { e.stopPropagation(); toggleAnswered(p); }}
                onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                onMouseLeave={(e) => { if (!p.answered) { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; } }}
                className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${p.answered ? 'opacity-100' : 'text-stone-400'}`}
                style={p.answered ? { color: activeColor, backgroundColor: `${activeColor}1A` } : {}}
              >
                {p.answered ? <HandHeart size={16} className="fill-current" /> : <HandHeart size={16} />} 
              </button>
              <span className={tooltipClass} style={tooltipStyle}>
                {p.answered ? "Marked Answered" : "Mark Answered"}
              </span>
            </div>

            <div className="relative group/btn">
              <button
                onClick={(e) => { e.stopPropagation(); removePrayer(p.id); }}
                onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; }}
                className="p-2 text-stone-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
              <span className={tooltipClass} style={tooltipStyle}>
                Delete
              </span>
            </div>
          </div>
        </div>
      );
    }
    
    return (
    <div key={p.id} onClick={() => setEditingPrayer(p)} className={`bg-white border cursor-pointer ${isSelected ? 'border-l-4 shadow-md' : (p.answered ? 'border-green-200' : 'border-stone-200')} rounded-3xl p-6 sm:p-8 shadow-sm transition-all relative overflow-visible group`} style={isSelected ? { borderLeftColor: activeColor } : {}}>
      {p.answered && !isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-3xl"></div>}
      
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                togglePrayerSelection(p.id);
              }}
              className="shrink-0 transition-transform hover:scale-110 focus:outline-none"
            >
              {isSelected ? (
                <CheckCircle2 size={24} style={{ color: activeColor }} />
              ) : (
                <Circle size={24} className="text-stone-300 hover:text-stone-400" />
              )}
            </button>
            <h4 className="font-bold text-slate-900 text-lg">{p.title}</h4>
            {p.isPinned && <Pin size={14} className="text-stone-300" />}
          </div>
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{new Date(p.timestamp).toLocaleDateString()}</span>
          
          <div className="mt-4 text-stone-600 leading-relaxed text-sm line-clamp-4 italic whitespace-pre-wrap">
            "{p.text}"
          </div>
          
          {p.reflection && (
            <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 relative">
              <MessageSquareText size={14} className="absolute top-4 left-4 text-[#c2094c]" />
              <p className="text-sm text-stone-600 pl-6 leading-relaxed italic">{p.reflection}</p>
            </div>
          )}
          {!inSeasonView && p.collections && p.collections.length > 0 && (
            <span className="ml-3 inline-flex gap-2 flex-wrap align-middle relative z-10">
              {p.collections.map((c: string) => {
                const badgeColor = collectionSettings[c]?.color || '#c2094c';
                return (
                  <span 
                    key={c}
                    onClick={(e) => { e.stopPropagation(); setSelectedSeason(c); setActiveTab('seasons'); }}
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                    style={{ color: badgeColor, backgroundColor: badgeColor + '1A' }}
                  >
                    {c}
                  </span>
                );
              })}
            </span>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {inSeasonView && (
              <div className="relative group/btn">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePrayerPin(p); }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                  onMouseLeave={(e) => { if (!p.isPinned) { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; } }}
                  className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${p.isPinned ? 'opacity-100' : 'text-stone-400'}`}
                  style={p.isPinned ? { color: activeColor, backgroundColor: `${activeColor}1A` } : {}}
                >
                  {p.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
                <span className={tooltipClass} style={tooltipStyle}>
                  {p.isPinned ? "Unpin Prayer" : "Pin Prayer"}
                </span>
              </div>
            )}
            <div className="relative group/btn">
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(p.text); }}
                onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; }}
                className="p-2 text-stone-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <Copy size={16} />
              </button>
              <span className={tooltipClass} style={tooltipStyle}>
                Copy
              </span>
            </div>
            
            <div className="relative group/btn">
              <button
                onClick={(e) => { e.stopPropagation(); setActiveCollectionDropdown(activeCollectionDropdown === p.id ? null : p.id); }}
                onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                onMouseLeave={(e) => { if (!(p.collections && p.collections.length > 0)) { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; } }}
                className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${p.collections && p.collections.length > 0 ? 'opacity-100' : 'text-stone-400'}`}
                style={p.collections && p.collections.length > 0 ? { color: activeColor, backgroundColor: `${activeColor}1A` } : {}}
              >
                <Bookmark size={16} className={p.collections && p.collections.length > 0 ? "fill-current" : ""} /> 
              </button>
              <span className={tooltipClass} style={tooltipStyle}>
                Save to Collection
              </span>
              
              {activeCollectionDropdown === p.id && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCollectionDropdown(null);
                    }}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden relative">
                    <div className="p-3 bg-stone-50 border-b border-stone-200">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500">Save to Collection</h4>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                      {uniqueSeasons.map(season => (
                        <button
                          key={season}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePrayerCollection(p, season);
                            setActiveCollectionDropdown(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors flex items-center justify-between"
                        >
                          {season}
                          {p.collections?.includes(season) && <Check size={14} className="text-[#c2094c]" />}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-stone-200 p-2 flex gap-2">
                      <input
                        type="text"
                        value={newCollectionName}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="New Collection..."
                        className="flex-1 min-w-0 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-sm outline-none focus:border-[#c2094c]"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (newCollectionName.trim()) {
                            togglePrayerCollection(p, newCollectionName.trim());
                            setNewCollectionName('');
                            setActiveCollectionDropdown(null);
                          }
                        }}
                        className="p-1.5 bg-[#c2094c] text-white rounded hover:bg-[#a0073e]"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="relative group/btn">
              <button
                onClick={(e) => { e.stopPropagation(); toggleAnswered(p); }}
                onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                onMouseLeave={(e) => { if (!p.answered) { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; } }}
                className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${p.answered ? 'opacity-100' : 'text-stone-400'}`}
                style={p.answered ? { color: activeColor, backgroundColor: `${activeColor}1A` } : {}}
              >
                {p.answered ? <HandHeart size={16} className="fill-current" /> : <HandHeart size={16} />} 
              </button>
              <span className={tooltipClass} style={tooltipStyle}>
                {p.answered ? "Marked Answered" : "Mark Answered"}
              </span>
            </div>
            
            <div className="relative group/btn">
              <button
                onClick={(e) => { e.stopPropagation(); removePrayer(p.id); }}
                onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; }}
                className="p-2 text-stone-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
              <span className={tooltipClass} style={tooltipStyle}>
                Delete
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <p className={`font-serif text-lg leading-relaxed ${p.answered ? 'text-stone-500 italic' : 'text-slate-800'}`}>
        "{p.text}"
      </p>
    </div>
  );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#faf9f8] p-4 sm:p-8 md:p-12 animate-in fade-in duration-700 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="max-w-4xl mx-auto w-full flex flex-col min-h-full relative">
        
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-stone-100 p-1 rounded-2xl flex flex-wrap justify-center gap-1 shadow-inner">
            <button
              onClick={() => { setActiveTab('search'); setSelectedSeason(null); }}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'search' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Compass size={16} /> Faith Prayer
            </button>
            <button
              onClick={() => { setActiveTab('calendar'); setSelectedSeason(null); }}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'calendar' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <CalendarIcon size={16} /> Prayer Calendar
            </button>
            <button
              onClick={() => { setActiveTab('collections'); setSelectedSeason(null); }}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'collections' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <FolderOpen size={16} /> Prayer Collections
            </button>
          </div>
        </div>

        {/* Standard Header (Dynamic based on Tab) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center text-[#c2094c]">
              {activeTab === 'search' ? <Heart size={24} /> : activeTab === 'calendar' ? <CalendarIcon size={24} /> : <FolderOpen size={24} />}
            </div>
            <div>
              <h2 className="text-3xl font-serif text-slate-900">
                {activeTab === 'search' ? 'Faith Prayer' : activeTab === 'calendar' ? 'Prayer Calendar' : 'Prayer Collections'}
              </h2>
              <div className="text-stone-500 text-sm font-medium tracking-wide mt-1">
                {activeTab === 'search' ? (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-xl font-serif text-slate-800">How are you feeling today?</span>
                    <span className="text-stone-500 font-normal">Vent your frustrations, share your fears, or express your gratitude.<br className="hidden sm:block" /> We'll find the scripture you need.</span>
                  </div>
                ) : activeTab === 'calendar' ? (
                  "Your conversations with God, organized and easily accessible."
                ) : (
                  "Organize and explore your saved prayers by topic and season."
                )}
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'search' && (
          <>
            <div className="relative group mb-12">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#c2094c]/20 to-[#c2094c]/5 rounded-[2rem] blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
              <div className="relative bg-white border border-stone-200 rounded-3xl shadow-lg shadow-[#c2094c]/5 flex flex-col p-2 transition-all group-focus-within:border-[#c2094c]/40 group-focus-within:ring-4 group-focus-within:ring-[#c2094c]/10">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSearch()}
                  placeholder="e.g., I'm feeling really anxious about tomorrow..."
                  className="w-full bg-transparent outline-none px-6 py-5 text-slate-700 placeholder-stone-400 text-lg font-medium resize-none min-h-[140px] leading-relaxed"
                />
                <div className="flex items-center justify-end px-4 pb-3 pt-2">
                  <button 
                    onClick={handleSearch}
                    disabled={loading || !input.trim()}
                    className="bg-[#c2094c] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#a0073e] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#c2094c]/20 hover:shadow-lg hover:shadow-[#c2094c]/40 hover:-translate-y-0.5"
                  >
                    {loading ? 'Searching...' : 'Faith Prayer'} <Heart size={18} className={loading ? "animate-pulse" : ""} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-8 pb-16">
              {message && (
                <div className="bg-white border border-stone-200 text-stone-600 p-8 rounded-3xl text-center font-medium shadow-sm">
                  {message}
                </div>
              )}

              {prayer && (
                <div className="bg-white border border-[#c2094c]/20 p-6 sm:p-8 md:p-10 rounded-3xl space-y-6 shadow-xl shadow-[#c2094c]/5 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-[#c2094c]"></div>
                   <div className="flex items-center justify-between">
                     <h3 className="font-bold text-[#c2094c] uppercase tracking-widest text-[10px] sm:text-xs flex items-center gap-2">
                        <Heart size={16} fill="currentColor" className="opacity-80" /> A Prayer For You
                      </h3>
                      <button
                        onClick={handleSavePrayer}
                        disabled={savingPrayer}
                        className="text-xs font-bold uppercase tracking-widest bg-red-50 text-[#c2094c] px-4 py-2 rounded-xl hover:bg-[#c2094c] hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Bookmark size={14} /> {savingPrayer ? 'Saving...' : 'Save to Journal'}
                      </button>
                   </div>
                   <p className="font-serif text-[1.1rem] sm:text-xl md:text-2xl leading-[1.8] text-slate-800 italic">
                     "{prayer}"
                   </p>
                </div>
              )}
              
              {results.length > 0 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
                    <h3 className="font-bold text-stone-400 uppercase tracking-widest text-[10px] sm:text-[11px] flex items-center gap-2">
                      <BookHeart size={16} /> Curated Verses for You <span className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full text-[10px]">{globalVersion}</span>
                    </h3>
                  </div>
                  
                  <div className="grid gap-6">
                    {results.map((verse, idx) => (
                      <div key={idx} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 hover:border-[#c2094c]/30 hover:shadow-xl hover:shadow-[#c2094c]/5 transition-all duration-300 group">
                        <div className="inline-block px-3 py-1 bg-stone-50 text-stone-500 text-[10px] font-bold uppercase tracking-widest rounded-lg mb-4 sm:mb-6 group-hover:bg-red-50 group-hover:text-[#c2094c] transition-colors">
                          On {verse.topic_name}
                        </div>
                        <p className="font-serif text-[1.1rem] sm:text-xl md:text-2xl leading-[1.8] text-slate-900 mb-6 group-hover:text-black transition-colors">
                          "{verse.text}"
                        </p>
                        <span className="font-bold text-[#c2094c] tracking-wide text-sm">
                          {verse.book_name} {verse.chapter}:{verse.verse}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ad placement */}
              <div className="pt-12 mt-auto">
                <AdBanner dataAdSlot="soul_search_bottom" />
              </div>
            </div>
          </>
        )}
        
        {(activeTab === 'calendar' || activeTab === 'seasons' || activeTab === 'collections') && (
           <PrayerJournalView isEmbedded={true} onNavigate={onReturn} onEditEvent={(id) => setEditingPrayer(prayers.find(p => p.id === id) || null)} forcedTab={activeTab === 'calendar' ? 'calendar' : (activeTab === 'collections' ? 'collections' : 'timeline')} hideTabs={true} />
        )}
      </div>
      
      <AuthPromptModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSaveToBrowser={performSavePrayer}
        title="Save Your Prayer"
        description="You are not logged in. How would you like to save this prayer to your journal?"
      />
      {/* Prayer Edit Modal */}
      {editingPrayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    Faith Prayer
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">Local Browser Storage</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Optional: handle delete here if required, currently it just closes if they cancel
                    setEditingPrayer(null);
                  }}
                  className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-white z-[60] relative">
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveModalTab('prayer'); }}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeModalTab === 'prayer' ? 'bg-[#c2094c] text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                >
                  Prayer
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveModalTab('thoughts'); }}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeModalTab === 'thoughts' ? 'bg-[#c2094c] text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                >
                  Your Thoughts
                </button>
              </div>
              <div className="flex items-center">
                <FolderDropdown 
                  availableFolders={uniqueSeasons}
                  selectedFolders={editingPrayer.collections || []}
                  onChange={(folders) => setEditingPrayer({ ...editingPrayer, collections: folders })}
                  label="Collections"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#faf9f8] min-h-[500px] flex flex-col">
              {activeModalTab === 'prayer' ? (
                /* Primary Card */
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col gap-4 flex-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={editingPrayer.title}
                      onChange={(e) => setEditingPrayer({ ...editingPrayer, title: e.target.value })}
                      className="w-full text-lg font-bold text-[#c2094c] border-none outline-none placeholder:text-stone-300 focus:ring-0 p-0"
                      placeholder="Prayer Title..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Prayer Text</label>
                    <textarea
                      value={editingPrayer.text}
                      onChange={(e) => setEditingPrayer({ ...editingPrayer, text: e.target.value })}
                      className="w-full min-h-[150px] font-serif text-lg leading-relaxed text-slate-800 border-none outline-none resize-none placeholder:text-stone-300 focus:ring-0 p-0"
                      placeholder="Write your prayer..."
                    />
                  </div>


                </div>
              ) : (
                /* Notes Area */
                <div className="flex-1 flex flex-col min-h-[300px] [&>div]:flex-1">
                  <RichTextEditor
                    value={editingPrayer.reflection || ''}
                    onChange={(val) => setEditingPrayer({ ...editingPrayer, reflection: val })}
                    placeholder="Reflect on this prayer... How is God working? What are your thoughts?"
                  />
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-stone-100 flex items-center justify-end gap-3 bg-white shrink-0">
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingPrayer(null); }}
                className="px-5 py-2.5 rounded-xl font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              {prayers.some(p => p.id === editingPrayer.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    savePrayer({ ...editingPrayer, id: `generated-${Date.now()}`, timestamp: Date.now() });
                    setEditingPrayer(null);
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-md shadow-stone-900/20"
                >
                  Save as New
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  savePrayer(editingPrayer);
                  setEditingPrayer(null);
                }}
                className="px-5 py-2.5 rounded-xl font-medium bg-[#c2094c] text-white hover:bg-red-700 transition-colors shadow-md shadow-[#c2094c]/20 flex items-center gap-2"
              >
                {prayers.some(p => p.id === editingPrayer.id) ? 'Save Changes' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
