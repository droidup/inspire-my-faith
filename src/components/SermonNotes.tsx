import React, { useState, useMemo, useEffect } from 'react';
import { PenTool, Plus, BookOpen, Trash2, Calendar as CalendarIcon, CheckCircle2, Circle, Copy, FolderOpen, Sparkles, X, ChevronLeft, ChevronRight, Check, AlertTriangle, Loader2, Bookmark, Heart, BookHeart, Flag, Map, Sun, Crosshair, Star, Pin, PinOff, LayoutGrid, List, Settings, Compass, Moon, Cloud, Flame, Leaf, Wind, Zap, Shield, Anchor, Key, Bell, Crown, Gem, Home, Search, Info, Minus, Church, Cross, Bird, HeartHandshake, Hand, HandHeart, Droplet, Snowflake, Mountain, Trees, Waves, Sword, Clock, Camera, Coffee, Gift, Umbrella, Users, User, Smile, Frown, Meh, Eye, HeartCrack, Activity, Save } from 'lucide-react';
import { useSermonNotes, SermonNote } from '../hooks/useSermonNotes';
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
import RichTextEditor from './RichTextEditor';
import AdBanner from './AdBanner';
import { useAuth } from '../contexts/AuthContext';
import AuthPromptModal from './AuthPromptModal';
import FaithDiaryView from './FaithDiaryView';
import FolderDropdown from './shared/FolderDropdown';

interface SermonNotesProps {
  targetNoteId?: string | null;
  clearTargetNote?: () => void;
  onReturn?: () => void;
}

export default function SermonNotes({ targetNoteId, clearTargetNote, onReturn }: SermonNotesProps) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'collections'>('calendar');
  

  
  const { notes, saveNote, removeNote, toggleNoteCollection, toggleNotePin, renameCollectionInItems } = useSermonNotes();
  const { collectionSettings, updateCollectionSetting, togglePinCollection, renameCollection, deleteCollection } = useCollectionSettings('note');
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [editDraft, setEditDraft] = useState<SermonNote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Premium Collection States
  const [folderViewMode, setFolderViewMode] = useState<'grid' | 'list'>('grid');
  const [entryViewMode, setEntryViewMode] = useState<'grid' | 'list'>('grid');
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#c2094c');
  const [editIcon, setEditIcon] = useState('FolderOpen');
  const [editDescription, setEditDescription] = useState('');
  const [activeIconTab, setActiveIconTab] = useState('General');
  
  // Collections state
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
  const [activeCollectionDropdown, setActiveCollectionDropdown] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  
  const uniqueCollections = useMemo(() => {
    const fromNotes = notes.flatMap(n => n.collections || []);
    const fromSettings = Object.keys(collectionSettings);
    return (Array.from(new Set([...fromNotes, ...fromSettings].filter(Boolean))) as string[])
      .sort((a, b) => {
        const pinA = collectionSettings[a]?.isPinned ? 1 : 0;
        const pinB = collectionSettings[b]?.isPinned ? 1 : 0;
        return pinB - pinA;
      });
  }, [notes, collectionSettings]);

  // Calendar Heatmap state
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // AI Summary state
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  useEffect(() => {
    if (targetNoteId) {
      setActiveTab('calendar');
      const noteToEdit = notes.find(n => n.id === targetNoteId);
      if (noteToEdit) {
        setEditDraft(noteToEdit);
        setIsModalOpen(true);
      }
      if (clearTargetNote) {
        clearTargetNote();
      }
    }
  }, [targetNoteId, notes, clearTargetNote]);

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const noteDatesSet = useMemo(() => {
    const dates = new Set<string>();
    notes.forEach(n => {
      const d = new Date(n.timestamp);
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return dates;
  }, [notes]);
  
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

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (activeTab === 'collections') {
      if (selectedCollection) {
        filtered = notes.filter(n => n.collections?.includes(selectedCollection));
      } else {
        return [];
      }
    } else {
      if (calendarView === 'day') {
        if (!selectedDateFilter) return [];
        filtered = notes.filter(n => {
          const d = new Date(n.timestamp);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === selectedDateFilter;
        });
      } else if (calendarView === 'week') {
        const startOfWeek = new Date(currentMonth);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0,0,0,0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        
        filtered = notes.filter(n => {
          const d = new Date(n.timestamp);
          return d >= startOfWeek && d <= endOfWeek;
        });
      } else if (calendarView === 'month') {
        filtered = notes.filter(n => {
          const d = new Date(n.timestamp);
          return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
        });
      } else if (calendarView === 'year') {
        filtered = notes.filter(n => {
          const d = new Date(n.timestamp);
          return d.getFullYear() === currentMonth.getFullYear();
        });
      }
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [notes, selectedDateFilter, calendarView, currentMonth, activeTab, selectedCollection]);

  const getContextName = () => {
    if (activeTab === 'collections') {
      return selectedCollection || '';
    }
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

  const handleCreateNew = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const newNote: SermonNote = {
      id: `note-${Date.now()}`,
      title: '',
      speaker: '',
      date: new Date().toLocaleDateString(),
      text: '',
      timestamp: Date.now(),
      collections: activeTab === 'collections' && selectedCollection ? [selectedCollection] : []
    };
    setEditDraft(newNote);
    setIsModalOpen(true);
  };

  const updateDraft = (field: keyof SermonNote, value: any) => {
    setEditDraft(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveEntry = () => {
    if (editDraft) {
      saveNote({ ...editDraft, timestamp: Date.now() });
    }
    setIsModalOpen(false);
    setEditDraft(null);
  };

  const handleCancelEntry = () => {
    setIsModalOpen(false);
    setEditDraft(null);
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;
    const collectionNotes = notes.filter(n => n.collections?.includes(collectionToDelete));
    for (const note of collectionNotes) {
      await toggleNoteCollection(note, collectionToDelete);
    }
    setCollectionToDelete(null);
    if (selectedCollection === collectionToDelete) {
      setSelectedCollection(null);
    }
  };

  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const toggleNoteSelection = (id: string) => {
    setSelectedNotes(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const generateSummary = async () => {
    if (filteredNotes.length === 0) return;
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setGeneratingSummary(true);
    setSummaryText('');
    setIsSummaryModalOpen(true);
    setSummaryCopied(false);
    
    try {
      const itemsToSummarize = selectedNotes.length > 0
        ? filteredNotes.filter(n => selectedNotes.includes(n.id))
        : filteredNotes;
      const finalItems = itemsToSummarize.length > 0 ? itemsToSummarize : filteredNotes;

      const res = await fetch('/api/timeline/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: finalItems })
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

  const handleCopySummary = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  };

  const handleCopy = (htmlString: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    navigator.clipboard.writeText(tempDiv.textContent || tempDiv.innerText || "");
  };

  const renderNoteCard = (note: SermonNote, inCollectionView = false, viewMode: 'grid' | 'list' = 'grid') => {
    const isSelected = selectedNotes.includes(note.id);
    const activeColor = selectedCollection ? (collectionSettings[selectedCollection]?.color || '#c2094c') : '#c2094c';

    const tooltipClass = selectedCollection
      ? "absolute -top-8 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md"
      : "absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg";

    const tooltipStyle = selectedCollection ? { backgroundColor: activeColor } : {};

    if (viewMode === 'list') {
      return (
        <div key={note.id} className={`bg-white border-b border-stone-100 p-4 flex items-center justify-between transition-colors hover:bg-stone-50 group border-l-4 ${isSelected ? 'shadow-md' : 'border-transparent'}`} style={isSelected ? { borderLeftColor: activeColor } : {}}>
          <div className="flex items-center gap-4 flex-1 overflow-hidden cursor-pointer" onClick={() => { setEditDraft(note); setIsModalOpen(true); }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleNoteSelection(note.id);
              }}
              className="shrink-0 transition-transform hover:scale-110 focus:outline-none"
            >
              {isSelected ? (
                <CheckCircle2 size={24} style={{ color: activeColor }} />
              ) : (
                <Circle size={24} className="text-stone-300 hover:text-stone-400" />
              )}
            </button>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-[#c2094c]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 truncate">{note.title || 'Untitled Entry'}</h4>
                {note.isPinned && <Pin size={12} className="text-stone-400 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest mt-1 truncate">
                <span>{note.date}</span>
                {note.speaker && <span>• {note.speaker}</span>}
              </div>
            </div>
            {!inCollectionView && note.collections && note.collections.length > 0 && (
              <div className="hidden sm:flex gap-1 shrink-0">
                {note.collections.map((c: string) => {
                  const badgeColor = collectionSettings[c]?.color || '#c2094c';
                  return (
                    <span 
                      key={c}
                      onClick={(e) => { e.stopPropagation(); setSelectedCollection(c); setActiveTab('collections'); }}
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
            {inCollectionView && (
              <div className="relative group/btn">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleNotePin(note); }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                  onMouseLeave={(e) => { if (!note.isPinned) { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; } }}
                  className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${note.isPinned ? 'opacity-100' : 'text-stone-400'}`}
                  style={note.isPinned ? { color: activeColor, backgroundColor: `${activeColor}1A` } : {}}
                >
                  {note.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
                <span className={tooltipClass} style={tooltipStyle}>
                  {note.isPinned ? "Unpin Entry" : "Pin Entry"}
                </span>
              </div>
            )}
            <div className="relative group/btn">
              <button
                onClick={() => handleCopy(note.text)}
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
                onClick={(e) => { e.stopPropagation(); setActiveCollectionDropdown(activeCollectionDropdown === note.id ? null : note.id); }}
                onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                onMouseLeave={(e) => { if (!(note.collections && note.collections.length > 0)) { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; } }}
                className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${note.collections && note.collections.length > 0 ? 'opacity-100' : 'text-stone-400'}`}
                style={note.collections && note.collections.length > 0 ? { color: activeColor, backgroundColor: `${activeColor}1A` } : {}}
              >
                <Bookmark size={16} className={note.collections && note.collections.length > 0 ? "fill-current" : ""} /> 
              </button>
              <span className={tooltipClass} style={tooltipStyle}>
                Save to Collection
              </span>
              
              {activeCollectionDropdown === note.id && (
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
                      {uniqueCollections.map(collection => (
                        <button
                          key={collection}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNoteCollection(note, collection);
                            setActiveCollectionDropdown(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors flex items-center justify-between"
                        >
                          {collection}
                          {note.collections?.includes(collection) && <Check size={14} className="text-[#c2094c]" />}
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
                            toggleNoteCollection(note, newCollectionName.trim());
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
                onClick={(e) => { e.stopPropagation(); removeNote(note.id); }}
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
    <div key={note.id} onClick={() => { setEditDraft(note); setIsModalOpen(true); }} className={`bg-white border ${isSelected ? 'border-l-4 shadow-md' : 'border-stone-200 shadow-sm'} rounded-3xl p-6 sm:p-8 transition-all relative overflow-visible group cursor-pointer`} style={isSelected ? { borderLeftColor: activeColor } : {}}>

      
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleNoteSelection(note.id);
              }}
              className="shrink-0 transition-transform hover:scale-110 focus:outline-none"
            >
              {isSelected ? (
                <CheckCircle2 size={24} style={{ color: activeColor }} />
              ) : (
                <Circle size={24} className="text-stone-300 hover:text-stone-400" />
              )}
            </button>
            <h4 className="font-bold text-slate-900 text-lg">{note.title || 'Untitled Entry'}</h4>
            {note.isPinned && <Pin size={14} className="text-stone-300" />}
          </div>
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{note.date}</span>
          {note.speaker && (
            <span className="ml-3 text-xs font-bold text-stone-500 uppercase tracking-widest">
              By {note.speaker}
            </span>
          )}
          {!inCollectionView && note.collections && note.collections.length > 0 && (
            <span className="ml-3 inline-flex gap-2 flex-wrap align-middle relative z-10">
              {note.collections.map((c: string) => {
                const badgeColor = collectionSettings[c]?.color || '#c2094c';
                return (
                  <button 
                    key={c}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCollection(c);
                      setActiveTab('collections');
                    }}
                    className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded transition-all hover:opacity-80 shadow-sm"
                    style={{ color: badgeColor, backgroundColor: badgeColor + '1A' }}
                  >
                    {c}
                  </button>
                );
              })}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {inCollectionView && (
            <div className="relative group/btn">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNotePin(note);
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
                onMouseLeave={(e) => { if (!note.isPinned) { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; } }}
                className={`p-2 rounded-lg transition-colors ${note.isPinned ? 'opacity-100' : 'text-stone-400'}`}
                style={note.isPinned ? { color: activeColor, backgroundColor: `${activeColor}1A` } : {}}
              >
                {note.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
              <span className={tooltipClass} style={tooltipStyle}>
                {note.isPinned ? "Unpin Entry" : "Pin Entry"}
              </span>
            </div>
          )}
          <div className="relative group/btn">
            <button
              onClick={() => handleCopy(note.text)}
              onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; }}
              className="p-2 text-stone-400 rounded-lg transition-colors"
            >
              <Copy size={16} />
            </button>
            <span className={tooltipClass} style={tooltipStyle}>
              Copy
            </span>
          </div>
          
          <div className="relative group/btn">
            <button
              onClick={() => setActiveCollectionDropdown(activeCollectionDropdown === note.id ? null : note.id)}
              onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
              onMouseLeave={(e) => { if (!(note.collections && note.collections.length > 0)) { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; } }}
              className={`p-2 rounded-lg transition-colors ${note.collections && note.collections.length > 0 ? 'opacity-100' : 'text-stone-400'}`}
              style={note.collections && note.collections.length > 0 ? { color: activeColor, backgroundColor: `${activeColor}1A` } : {}}
            >
              <Bookmark size={16} className={note.collections && note.collections.length > 0 ? "fill-current" : ""} /> 
            </button>
            <span className={tooltipClass} style={tooltipStyle}>
              Save to Collection
            </span>
            
            {activeCollectionDropdown === note.id && (
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
                    {uniqueCollections.map(collection => (
                      <button
                        key={collection}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNoteCollection(note, collection);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors flex items-center justify-between"
                      >
                        {collection}
                        {note.collections?.includes(collection) && <Check size={14} className="text-[#c2094c]" />}
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
                          toggleNoteCollection(note, newCollectionName.trim());
                          setNewCollectionName('');
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
          <button
            onClick={() => removeNote(note.id)}
            onMouseEnter={(e) => { e.currentTarget.style.color = activeColor; e.currentTarget.style.backgroundColor = `${activeColor}1A`; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; }}
            className="p-2 text-stone-400 rounded-lg transition-colors"
            title="Delete Entry"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div 
        className="text-stone-600 line-clamp-3 text-sm leading-relaxed prose prose-sm max-w-none cursor-pointer"
        onClick={() => {
          setEditDraft({ ...note });
          setIsModalOpen(true);
        }}
        dangerouslySetInnerHTML={{ __html: note.text }}
      />
    </div>
  );
  };

  return (
    <>
      <FaithDiaryView isEmbedded={false} onNavigate={onReturn} onEditEvent={(id) => { const note = notes.find(n => n.id === id); if (note) { setEditDraft(note); setIsModalOpen(true); } }} primaryAction={{ label: 'New Entry', icon: Plus, onClick: handleCreateNew }} />

      {/* Entry Modal */}
      {isModalOpen && editDraft && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh] my-4 sm:my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    Faith Diary
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">Local Browser Storage</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEntry}
                  className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#faf9f8] space-y-6 flex flex-col h-[70vh]">
              {/* Primary Card */}
              <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col gap-4 shrink-0 overflow-visible">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Title</label>
                  <input 
                    type="text" 
                    value={editDraft.title}
                    onChange={(e) => updateDraft('title', e.target.value)}
                    className="w-full text-lg font-bold text-[#c2094c] border-none outline-none placeholder:text-stone-300 focus:ring-0 p-0"
                    placeholder="Name your entry..."
                    autoFocus
                  />
                  </div>
                  <div className="shrink-0 flex items-end">
                    <FolderDropdown 
                      availableFolders={uniqueCollections}
                      selectedFolders={editDraft.collections || []}
                      onChange={(folders) => updateDraft('collections', folders)}
                      label="Collections"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Area */}
              <div className="space-y-3 flex-1 flex flex-col min-h-[300px]">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide shrink-0">
                  Your Thoughts
                </label>
                <div className="relative flex-1 flex flex-col [&>div]:flex-1">
                  <RichTextEditor 
                    value={editDraft.text} 
                    onChange={(val) => updateDraft('text', val)} 
                    placeholder="Start taking notes... (Tip: Typing a scripture reference will be helpful for studying later!)"
                  />
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-stone-100 flex items-center justify-end gap-3 bg-white shrink-0">
              <button 
                onClick={handleCancelEntry}
                className="px-5 py-2.5 rounded-xl font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              {editDraft && (
                <button
                  onClick={() => {
                    if (editDraft) {
                      const newId = `draft-${Date.now()}`;
                      saveNote({ ...editDraft, id: newId, timestamp: Date.now() });
                      setIsModalOpen(false);
                      setEditDraft(null);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-md shadow-stone-900/20"
                >
                  Save as New
                </button>
              )}
              <button 
                onClick={handleSaveEntry}
                className="px-5 py-2.5 rounded-xl font-medium bg-[#c2094c] text-white hover:bg-red-700 transition-colors shadow-md shadow-[#c2094c]/20 flex items-center gap-2"
              >
                <Save size={18} /> {notes.some(n => n.id === editDraft.id) ? 'Save Changes' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
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
                  <p>Reflecting on your entries...</p>
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

      {/* Delete Collection Confirmation Modal */}
      {collectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Collection?</h3>
              <p className="text-stone-500 mb-6 leading-relaxed">
                Are you sure you want to delete the collection <strong>"{collectionToDelete}"</strong>? Your entries will remain completely safe in your Faith Diary; they just won't be grouped in this collection anymore.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setCollectionToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteCollection}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
                >
                  Delete Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthPromptModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSaveToBrowser={() => setIsAuthModalOpen(false)}
        title="Sign In Required"
        description="You need to be signed in to generate an AI Pastoral Summary."
      />
      {/* Customize Collection Modal */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-100 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
              <h3 className="text-xl font-serif text-slate-900 flex items-center gap-2">
                <Settings size={20} className="text-[#c2094c]" /> Customize Collection
              </h3>
              <button onClick={() => setIsCustomizeModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-600 bg-stone-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {showDeleteConfirm ? (
                <div className="bg-red-50 text-red-900 p-6 rounded-xl border border-red-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <Trash2 size={32} />
                  </div>
                  <h4 className="text-lg font-bold mb-2">Delete Collection?</h4>
                  <p className="text-sm text-red-700/80 mb-6">
                    Are you sure you want to delete <strong className="font-bold">"{editingCollection}"</strong>? This will permanently remove the folder, but your notes will remain safe.
                  </p>
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-3 bg-white border border-red-200 text-red-700 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                        if (editingCollection) {
                          await deleteCollection(editingCollection);
                          setIsCustomizeModalOpen(false);
                          setSelectedCollection(null);
                          window.location.reload();
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Yes, Delete It
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 mb-3">Collection Name</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full font-serif text-xl bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-[#c2094c]"
                      placeholder="Collection Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 mb-3">Theme Color</label>
                    
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setEditColor(color)}
                            className={`w-8 h-8 rounded-full transition-transform ${editColor === color ? 'scale-125 shadow-md ring-2 ring-offset-2 ring-stone-300' : 'hover:scale-110'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-stone-400 uppercase">Custom Hex:</span>
                        <input 
                          type="text" 
                          value={editColor} 
                          onChange={(e) => setEditColor(e.target.value)}
                          placeholder="#000000"
                          className="w-24 font-mono text-sm bg-stone-100 border border-stone-200 rounded px-2 py-1 outline-none focus:border-[#c2094c]"
                        />
                        <input 
                          type="color" 
                          value={editColor} 
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 mb-3">Collection Icon</label>
                    
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                      {ICON_CATEGORIES.map(category => (
                        <button
                          key={category.name}
                          onClick={() => setActiveIconTab(category.name)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeIconTab === category.name ? 'bg-slate-800 text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                      {ICON_CATEGORIES.find(c => c.name === activeIconTab)?.icons.map(iconName => {
                        const IconComp = ICON_MAP[iconName];
                        if (!IconComp) return null;
                        const isSelected = editIcon === iconName;
                        return (
                          <button
                            key={iconName}
                            onClick={() => setEditIcon(iconName)}
                            className={`p-2.5 rounded-xl transition-all ${isSelected ? 'bg-white shadow-md border-2 border-[#c2094c] scale-110' : 'bg-transparent border-2 border-transparent text-stone-400 hover:bg-stone-200 hover:text-stone-600'}`}
                            style={{ color: isSelected ? editColor : undefined }}
                            title={iconName}
                          >
                            <IconComp size={20} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 mb-3">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="e.g., Prayers for Jereme's house sale - Proverbs 3:5"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-[#c2094c] resize-none h-24"
                    />
                  </div>
                </>
              )}
            </div>

            {!showDeleteConfirm && (
              <div className="p-6 border-t border-stone-100 bg-stone-50 flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  title="Delete Collection"
                >
                  <Trash2 size={20} />
                </button>
                <button 
                  onClick={() => setIsCustomizeModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white border border-stone-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (editingCollection) {
                      await updateCollectionSetting(editingCollection, { color: editColor, icon: editIcon, description: editDescription });
                      if (editName.trim() && editName !== editingCollection) {
                        const success = await renameCollection(editingCollection, editName.trim());
                        if (success) {
                          renameCollectionInItems(editingCollection, editName.trim());
                          if (selectedCollection === editingCollection) {
                            setSelectedCollection(editName.trim());
                          }
                        }
                      }
                    }
                    setIsCustomizeModalOpen(false);
                  }}
                  className="flex-1 px-4 py-3 bg-[#c2094c] text-white rounded-xl text-sm font-bold hover:bg-[#a0073e] transition-colors shadow-sm"
                >
                  Save Settings
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <AuthPromptModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSaveToBrowser={() => setIsAuthModalOpen(false)}
        title="Save Your Diary"
        description="Sign in to save and organize your faith diary entries." 
      />
    </>
  );
}
