import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Signpost, Heart, BookOpen, PenTool, Plus, X, ChevronLeft, ChevronRight, MessageSquareText, Pin as PinIcon, BookPlus, Search, Sparkles, LayoutGrid, List as ListIcon, CheckCircle2, Circle, FolderPlus, Copy, Check, Trash, HandHeart, HeartHandshake, ArrowDownUp, AlertTriangle, FolderOpen, Calendar, BookHeart } from 'lucide-react';
import { useFaithTimeline, TimelineEvent } from '../../hooks/useFaithTimeline';
import AdBanner from '../AdBanner';
import { useAuth } from '../../contexts/AuthContext';
import Collections from '../Collections';
import { useCollectionSettings } from '../../hooks/useCollectionSettings';
import { renderCustomHTML } from '../../lib/renderCustomHTML';

interface FaithAreaLayoutProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor?: string;
  events: TimelineEvent[];
  setEvents: React.Dispatch<React.SetStateAction<TimelineEvent[]>>;
  loading: boolean;
  sectionType: string;
  onNavigate?: (view: string, data?: any) => void;
  onDeleteEvent?: (id: string) => Promise<void>;
  onEditEvent?: (id: string) => void;
  primaryAction?: {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
  };
  onGenerateSummary?: () => void;
  isEmbedded?: boolean;
  forcedTab?: 'timeline' | 'collections' | 'calendar';
  hideTabs?: boolean;
  hideViewToggle?: boolean;
  heroContent?: React.ReactNode;
  customToolbarActions?: React.ReactNode;
}

export default function FaithAreaLayout({ title, subtitle, icon: IconComponent, iconColor = '#c2094c', events, setEvents, loading, sectionType, onNavigate, onDeleteEvent, onEditEvent, primaryAction, onGenerateSummary, isEmbedded = false, forcedTab, hideTabs = false, hideViewToggle = false, heroContent, customToolbarActions }: FaithAreaLayoutProps) {
  const { user } = useAuth();
  
  const [activeTabState, setActiveTab] = useState<'timeline' | 'collections' | 'calendar'>('timeline');
  const activeTab = forcedTab || activeTabState;

  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<number | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  

  
  const { collectionSettings, updateCollectionSetting, deleteCollection, renameCollection } = useCollectionSettings(sectionType);
  const uniqueCollections = React.useMemo(() => {
    const fromSettings = Object.keys(collectionSettings);
    const fromEvents = events.flatMap(e => e.collections || []);
    return Array.from(new Set([...fromSettings, ...fromEvents].filter(Boolean)));
  }, [collectionSettings, events]);
  const [showBulkCollectionPopover, setShowBulkCollectionPopover] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const bulkSaveBtnRef = useRef<HTMLButtonElement>(null);
  const bulkSavePopoverRef = useRef<HTMLDivElement>(null);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBulkCollectionPopover]);

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const eventDatesSet = useMemo(() => {
    const dates = new Set<string>();
    events.forEach(e => {
      if (e.timestamp) {
        const d = new Date(e.timestamp);
        dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    });
    return dates;
  }, [events]);

  const eventMonthsSet = useMemo(() => {
    const months = new Set<string>();
    events.forEach(e => {
      if (e.timestamp) {
        const d = new Date(e.timestamp);
        months.add(`${d.getFullYear()}-${d.getMonth()}`);
      }
    });
    return months;
  }, [events]);

  const nextMonth = () => {
    setSelectedDateFilter(null);
    setSelectedMonthFilter(null);
    if (calendarView === 'week') setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() + 7));
    else if (calendarView === 'year') setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
    else setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setSelectedDateFilter(null);
    setSelectedMonthFilter(null);
    if (calendarView === 'week') setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() - 7));
    else if (calendarView === 'year') setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
    else setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const filteredEventsForView = useMemo(() => {
    let filtered = events;
    if (calendarView === 'day') {
      if (!selectedDateFilter) return [];
      filtered = events.filter(e => {
        if (!e.timestamp) return false;
        const d = new Date(e.timestamp);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === selectedDateFilter;
      });
    } else if (calendarView === 'week') {
      const startOfWeek = new Date(currentMonth);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      filtered = events.filter(e => {
        if (!e.timestamp) return false;
        const d = new Date(e.timestamp);
        if (d < startOfWeek || d > endOfWeek) return false;
        if (selectedDateFilter) {
           return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === selectedDateFilter;
        }
        return true;
      });
    } else if (calendarView === 'month') {
      filtered = events.filter(e => {
        if (!e.timestamp) return false;
        const d = new Date(e.timestamp);
        return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
      });
    } else if (calendarView === 'year') {
      filtered = events.filter(e => {
        if (!e.timestamp) return false;
        const d = new Date(e.timestamp);
        if (d.getFullYear() !== currentMonth.getFullYear()) return false;
        if (selectedMonthFilter !== null) {
           return d.getMonth() === selectedMonthFilter;
        }
        return true;
      });
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) || 
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [events, calendarView, currentMonth, selectedDateFilter, searchQuery]);

  const handleGenerateSummary = async () => {
    const eventsToSummarize = selectedIds.size > 0 
      ? filteredEventsForView.filter(e => selectedIds.has(e.id))
      : filteredEventsForView;

    if (eventsToSummarize.length === 0) return;
    setShowSummaryModal(true);
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/timeline/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSummarize.slice(0, 50) }) // Limit for API
      });
      const data = await res.json();
      if (data.success) {
        setSummaryText(data.data);
      } else {
        setSummaryText('Failed to generate summary.');
      }
    } catch (e) {
      setSummaryText('Error generating summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleBulkSaveToCollection = async (collectionName: string) => {
    if (!user || selectedIds.size === 0) return;

    const itemsToAdd = Array.from(selectedIds).map(id => {
       const event = events.find(e => e.id === id);
       return { id, type: event?.type || 'unknown' };
    });
    
    await fetch('/api/user/timeline/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid, collectionName, items: itemsToAdd })
    });
    
    setShowBulkCollectionPopover(false);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const togglePin = (id: string) => {
    const newSet = new Set(pinnedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setPinnedIds(newSet);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (onDeleteEvent) {
      await onDeleteEvent(id);
    } else {
      await fetch(`/api/user/faith-events/${id}?userId=${user.uid}`, { method: 'DELETE' });
    }
    setEvents(events.filter(e => e.id !== id));
    setEventToDelete(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getIcon = (type: string, version?: string) => {
    switch (type) {
      case 'prayer': return <Heart size={20} className="text-[#c2094c]" />;
      case 'note': return <PenTool size={20} className="text-[#64748b]" />;
      case 'verse': return version === 'FAITH_GUIDE' ? <BookHeart size={20} className="text-[#c2094c]" /> : <HeartHandshake size={20} className="text-[#10b981]" />;
      case 'bookmark': return <PinIcon size={20} className="text-blue-500" />;
      case 'prayer_answered': return <Heart size={20} className="text-[#c2094c]" />;
      case 'plan_completed': return <BookOpen size={20} className="text-blue-500" />;
      default: return <Signpost size={20} className="text-teal-500" />; 
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'prayer': return 'bg-red-50 text-[#c2094c] border-red-100';
      case 'note': return 'bg-slate-50 text-[#64748b] border-slate-200';
      case 'verse': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'bookmark': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'prayer_answered': return 'bg-red-50 text-[#c2094c] border-red-100';
      case 'plan_completed': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-teal-50 text-teal-600 border-teal-100';
    }
  };
  
  const handleItemClick = (type: string, item_id: string, text?: string) => {
      if (type === 'bookmark') return;
      if (onEditEvent) {
          onEditEvent(item_id);
          return;
      }
      if (!onNavigate) return;
      if (type === 'verse') {
          onNavigate('faith_verses', { verse: text });
      } else if (type === 'prayer') {
          onNavigate('soul_search', { prayerId: item_id }); 
      } else if (type === 'note') {
          onNavigate('sermon_notes', { noteId: item_id });
      } else {
          onNavigate('home');
      }
  };

  const groupedEvents = filteredEventsForView.reduce((acc, event) => {
    const dateStr = new Date(event.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  Object.keys(groupedEvents).forEach(dateStr => {
     groupedEvents[dateStr].sort((a, b) => {
        const aPinned = pinnedIds.has(a.id);
        const bPinned = pinnedIds.has(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        const timeDiff = b.timestamp - a.timestamp;
        return sortOrder === 'desc' ? timeDiff : -timeDiff;
     });
  });

  const sortedGroupedKeys = Object.keys(groupedEvents).sort((a, b) => {
    const timeDiff = new Date(b).getTime() - new Date(a).getTime();
    return sortOrder === 'desc' ? timeDiff : -timeDiff;
  });

  const innerContent = (
    <div className={`max-w-4xl mx-auto w-full flex flex-col min-h-full relative shrink-0 ${isEmbedded ? '' : ''}`}>
      
      {/* --- Top Toggle Buttons --- */}
      {!hideTabs && (
        <div className="flex justify-center mb-8">
          <div className="bg-stone-100 p-1 rounded-2xl flex flex-wrap justify-center gap-1 shadow-inner">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'timeline' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <IconComponent size={16} /> {sectionType === 'faith_verses' ? 'Faith Verse' : title}
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'calendar' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Calendar size={16} /> {sectionType === 'faith_verses' ? 'Verse Calendar' : (sectionType === 'note' ? 'Diary Calendar' : 'Calendar')}
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'collections' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <FolderOpen size={16} /> {sectionType === 'faith_verses' ? 'Verse collection' : title.replace('Faith ', '') + ' Collections'}
            </button>
          </div>
        </div>
      )}

      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center shrink-0" style={{ color: iconColor }}>
              <IconComponent size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-serif text-slate-900">{title}</h2>
              <p className="text-stone-500 text-sm font-medium tracking-wide">{subtitle}</p>
            </div>
          </div>
        </div>
      )}

        {forcedTab === 'collections' || viewMode === 'collections' || activeTab === 'collections' ? (
              <Collections 
                events={events} 
                sectionType={sectionType} 
                collectionSettings={collectionSettings} 
                updateCollectionSetting={updateCollectionSetting} 
                deleteCollection={deleteCollection}
                renameCollection={renameCollection}
                onNavigate={onNavigate}
                onEditEvent={onEditEvent}
                onDeleteEvent={onDeleteEvent}
              />
        ) : (
          <>
            {/* --- Action Bar --- */}
            <div className="bg-white/80 backdrop-blur-md border border-stone-200 rounded-2xl p-4 shadow-sm mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
              <div className="relative flex-1 w-full max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="Search timeline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#c2094c] focus:ring-1 focus:ring-[#c2094c]/20 transition-all"
            />
            {searchQuery !== '' && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 group/btn">
                <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-600 flex items-center justify-center p-1">
                  <X size={16} />
                </button>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Clear
                </span>
              </div>
            )}
          </div>

        <div className="flex items-center justify-center w-full sm:w-auto gap-2 sm:gap-3 flex-wrap">
            {customToolbarActions}
            {selectedIds.size > 0 && (
               <div className="relative">
                 <button 
                  ref={bulkSaveBtnRef}
                  onClick={() => setShowBulkCollectionPopover(!showBulkCollectionPopover)}
                  className="bg-[#f43f5e] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-sm flex items-center gap-2 border-none outline-none focus:ring-2 focus:ring-[#f43f5e]/50"
                 >
                  <FolderPlus size={16} /> Save {selectedIds.size} Items
                 </button>
                 {/* Bulk Save Popover */}
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

            {primaryAction && (
              <button 
                onClick={primaryAction.onClick}
                className="bg-[#c2094c] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#a1073e] transition-colors flex items-center gap-2 shadow-sm shadow-[#c2094c]/20 border-none outline-none focus:ring-2 focus:ring-[#c2094c]/50"
              >
                <primaryAction.icon size={16} /> {primaryAction.label}
              </button>
            )}
            <button 
              onClick={onGenerateSummary || handleGenerateSummary}
              className="bg-[#c2094c] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#a1073e] transition-colors flex items-center gap-2 shadow-sm shadow-[#c2094c]/20 border-none outline-none focus:ring-2 focus:ring-[#c2094c]/50"
            >
              <Sparkles size={16} /> AI Pastoral Summary
            </button>
            
            <div className="relative group/btn">
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-slate-700 hover:border-stone-300 transition-colors shadow-sm"
              >
                <ArrowDownUp size={18} className={sortOrder === 'desc' ? '' : 'rotate-180'} />
              </button>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {sortOrder === 'desc' ? 'Sort Oldest' : 'Sort Newest'}
              </span>
            </div>
            
            {!hideViewToggle && (
              <div className="flex bg-stone-100 p-1 rounded-xl shrink-0">
                <div className="relative group/btn">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    Grid
                  </span>
                </div>
                <div className="relative group/btn">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <ListIcon size={18} />
                  </button>
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    List
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {heroContent && activeTab === 'timeline' && (
          <div className="mb-12">
            {heroContent}
          </div>
        )}

        {/* The Calendar only shows in Timeline tab when searching is empty AND there is no dedicated calendar tab, OR in the Calendar tab */}
        {(activeTab === 'calendar' || (activeTab === 'timeline' && searchQuery === '' && !hideTabs && sectionType !== 'verse' && sectionType !== 'faith_verses' && sectionType !== 'note')) && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-12 relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
             {/* Calendar Header */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative z-10">
               <div>
                 <h3 className="font-serif text-xl text-slate-800">Your Activity</h3>
                 <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mt-1">Select a timeframe to view</p>
               </div>
               <div className="flex bg-stone-100 p-1 rounded-xl shrink-0">
                 {['day', 'week', 'month', 'year'].map((view) => (
                   <button
                     key={view}
                     onClick={() => { setCalendarView(view as any); setSelectedDateFilter(null); }}
                     className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${calendarView === view ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                   >
                     {view}
                   </button>
                 ))}
               </div>
             </div>
             
             {/* Calendar Nav */}
             <div className="flex items-center justify-between mb-6 relative z-10">
               <button onClick={prevMonth} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"><ChevronLeft size={18}/></button>
               <span className="font-bold text-stone-600 text-sm whitespace-nowrap px-4 text-center uppercase tracking-widest">
                 {calendarView === 'year' 
                   ? currentMonth.getFullYear() 
                   : currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
               </span>
               <button onClick={nextMonth} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"><ChevronRight size={18}/></button>
             </div>
             {/* Calendar Body */}
             <div className="relative z-10">
                {(calendarView === 'month' || calendarView === 'day') && (
                  <div className="grid grid-cols-7 gap-y-2 gap-x-1 sm:gap-x-2 max-w-md mx-auto">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={`header-${i}`} className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest py-1">{day}</div>
                    ))}
                    {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-8 h-8 sm:w-10 sm:h-10 mx-auto bg-transparent"></div>
                    ))}
                    {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}`;
                      const hasEvent = eventDatesSet.has(dateStr);
                      const isSelected = selectedDateFilter === dateStr;
                      const isToday = new Date().getFullYear() === currentMonth.getFullYear() && new Date().getMonth() === currentMonth.getMonth() && new Date().getDate() === day;
                      
                      const isSelectable = calendarView === 'day';
                      const btnClass = `relative w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all ${
                        (isSelected && isSelectable) ? 'bg-[#c2094c] text-white shadow-md shadow-[#c2094c]/20 scale-105 z-10' :
                        isToday && !hasEvent ? `border border-[#c2094c] text-[#c2094c] ${isSelectable ? 'hover:bg-stone-50 cursor-pointer' : ''}` :
                        hasEvent ? `bg-red-50 text-[#c2094c] ${isSelectable ? 'hover:bg-red-100 hover:scale-105 cursor-pointer' : ''}` :
                        'bg-stone-50 text-stone-400'
                      }`;
                      return (
                        <button
                          key={day}
                          onClick={() => isSelectable && hasEvent && setSelectedDateFilter(isSelected ? null : dateStr)}
                          disabled={!isSelectable}
                          className={btnClass}
                        >
                          {day}
                          {hasEvent && !(isSelected && isSelectable) && <div className="absolute w-1 h-1 bg-[#c2094c] rounded-full bottom-1 sm:bottom-1.5"></div>}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {calendarView === 'year' && (
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
                    {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((monthStr, i) => {
                      const dateStr = `${currentMonth.getFullYear()}-${i}`;
                      const hasEvent = eventMonthsSet.has(dateStr);
                      const isSelected = selectedMonthFilter === i;
                      
                      const btnClass = `relative w-full aspect-square rounded-2xl flex flex-col items-center justify-center text-xs font-bold tracking-widest transition-all ${
                        hasEvent ? 'bg-red-50 text-[#c2094c]' :
                        'bg-stone-50 text-stone-400'
                      }`;
                      return (
                        <button
                          key={monthStr}
                          disabled={true}
                          className={btnClass}
                        >
                          {monthStr}
                          {hasEvent && <div className="absolute w-1 h-1 bg-[#c2094c] rounded-full bottom-2 sm:bottom-3"></div>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {calendarView === 'week' && (() => {
                  const startOfWeek = new Date(currentMonth);
                  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                  
                  return (
                    <div className="flex justify-between max-w-md mx-auto">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayStr, i) => {
                        const d = new Date(startOfWeek);
                        d.setDate(d.getDate() + i);
                        const day = d.getDate();
                        const dateStr = `${d.getFullYear()}-${d.getMonth()}-${day}`;
                        const hasEvent = eventDatesSet.has(dateStr);
                        
                        const btnClass = `relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all ${
                          hasEvent ? 'bg-red-50 text-[#c2094c]' :
                          'bg-stone-50 text-stone-400'
                        }`;
                        
                        return (
                          <div key={`week-day-${i}`} className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{dayStr}</span>
                            <button
                              disabled={true}
                              className={btnClass}
                            >
                              {day}
                              {hasEvent && <div className="absolute w-1 h-1 bg-[#c2094c] rounded-full bottom-1 sm:bottom-1.5"></div>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
             </div>
          </div>
        )}

        {/* Activity Feed */}
        {(activeTab === 'timeline' || activeTab === 'calendar') && (
        <div className="mt-8">
        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#c2094c]/20 border-t-[#c2094c] rounded-full animate-spin"></div>
          </div>
        ) : filteredEventsForView.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center shadow-sm flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <Signpost size={48} className="text-stone-300 mb-4 mx-auto" />
            <h3 className="text-xl font-serif text-slate-700 mb-2">No activity found</h3>
            <p className="text-stone-500 mb-6 max-w-md mx-auto">
              {searchQuery !== '' 
                ? "No items match your search." 
                : "Select a highlighted day on the calendar to see your activity."}
            </p>
          </div>
        ) : (
          <div className="space-y-12 pb-24 relative">
            {viewMode === 'list' && <div className="absolute left-6 sm:left-[39px] top-4 bottom-0 w-1 bg-stone-100 rounded-full"></div>}
            
            {sortedGroupedKeys.map((dateStr) => (
              <div key={dateStr} className="relative">
                <div className="sticky top-[80px] z-30 py-4 bg-[#faf9f8]/90 backdrop-blur-md">
                  <h3 className={`inline-block bg-white text-slate-800 font-bold px-4 py-1.5 rounded-full border border-stone-200 shadow-sm text-sm ${viewMode === 'list' ? 'ml-12 sm:ml-20' : ''}`}>
                    {dateStr}
                  </h3>
                </div>
                
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mt-4" : "space-y-8 mt-4"}>
                  {groupedEvents[dateStr].map((event, idx) => {
                    const EventCard = (() => {
                    const timeStr = new Date(event.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    const isSelected = selectedIds.has(event.id);
                    const isPinned = pinnedIds.has(event.id);
                    
                    const ActionMenu = () => (
                      <div className="flex items-center gap-1 sm:gap-2 text-stone-400">
                        <div className="relative group/btn">
                          <button onClick={(e) => { e.stopPropagation(); togglePin(event.id); }} className={`p-1.5 hover:bg-stone-100 rounded-md transition-colors ${isPinned ? 'text-blue-500' : 'hover:text-slate-600'}`}>
                            <PinIcon size={16} className={isPinned ? 'fill-current' : ''} />
                          </button>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                            {isPinned ? 'Unpin' : 'Pin'}
                          </span>
                        </div>
                        <div className="relative group/btn">
                          <button onClick={(e) => { e.stopPropagation(); handleCopy(event.description || event.title); }} className="p-1.5 hover:bg-stone-100 rounded-md transition-colors hover:text-slate-600">
                            <Copy size={16} />
                          </button>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                            Copy
                          </span>
                        </div>
                        {onEditEvent && (
                          <div className="relative group/btn">
                            <button onClick={(e) => { e.stopPropagation(); onEditEvent(event.id); }} className="p-1.5 hover:bg-stone-100 rounded-md transition-colors hover:text-[#c2094c]">
                              <PenTool size={16} />
                            </button>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#c2094c]/90 backdrop-blur-md border border-[#c2094c]/50 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                              Edit
                            </span>
                          </div>
                        )}
                        <div className="relative group/btn">
                          <button onClick={(e) => { e.stopPropagation(); setEventToDelete(event.id); }} className="p-1.5 hover:bg-red-50 rounded-md transition-colors hover:text-red-500">
                            <Trash size={16} />
                          </button>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md border border-red-500/50 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                            Delete
                          </span>
                        </div>
                      </div>
                    );

                    if (viewMode === 'grid') {
                      if (event.type === 'verse') {
                        return (
                          <div key={event.id} onClick={() => handleItemClick(event.type, event.id, event.title)} className={`bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col cursor-pointer ${isSelected ? 'border-[#c2094c] ring-1 ring-[#c2094c]/20' : 'border-stone-200'}`}>
                            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                              <button onClick={(e) => { e.stopPropagation(); toggleSelection(event.id); }} className="text-stone-300 hover:text-[#c2094c] transition-colors shrink-0 bg-white/50 backdrop-blur-sm rounded-full p-1">
                                {isSelected ? <CheckCircle2 size={20} className="text-[#c2094c] fill-[#c2094c]/10" /> : <Circle size={20} />}
                              </button>
                              <div className="bg-white/80 backdrop-blur-md rounded-full shadow-sm"><ActionMenu /></div>
                            </div>
                            
                            <div className="p-6 sm:p-8 bg-white text-slate-800 relative flex flex-col justify-center border-b border-stone-100 flex-1">
                               <div className="flex items-center gap-3 mb-4 relative z-10">
                                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${event.version === 'DAILY_VERSE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : event.version === 'FAITH_GUIDE' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {event.version === 'DAILY_VERSE' ? 'DAILY VERSE' : event.version === 'FAITH_GUIDE' ? 'FAITH GUIDE' : 'FAITH VERSE'}
                                  </span>
                                 <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{timeStr}</span>
                               </div>

                                <p className="font-serif leading-relaxed mb-4 text-slate-800 text-lg relative z-10 line-clamp-4">
                                  {renderCustomHTML(event.description)}
                                </p>
                                <p className="text-stone-500 font-medium tracking-wide text-xs relative z-10">
                                  — {event.title}
                                </p>
                             </div>

                             {event.note && (
                               <div className="p-6 sm:px-8 sm:py-5 flex flex-col bg-stone-50/50">
                                  <h4 className="font-bold uppercase tracking-[0.2em] text-stone-400 mb-2 flex items-center gap-2 text-[10px]">
                                    <Sparkles size={12} className="text-[#c2094c]" />
                                    Make it happen
                                  </h4>
                                  <div 
                                    className="text-stone-600 leading-relaxed text-xs line-clamp-3 whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{ __html: event.note }}
                                  />
                               </div>
                             )}

                             {event.collections && event.collections.length > 0 && (
                                <div className="px-6 sm:px-8 pb-6 flex flex-wrap gap-1 bg-stone-50/50">
                                  {event.collections.map((c) => {
                                    const cColor = collectionSettings[c]?.color || '#c2094c';
                                    return (
                                      <span key={c} className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" style={{ color: cColor, backgroundColor: `${cColor}1A` }}>
                                        {c}
                                      </span>
                                    );
                                  })}
                                </div>
                             )}
                           </div>
                         );
                       }

                       return (
                          <div key={event.id} onClick={() => handleItemClick(event.type, event.id, event.title)} className={`bg-white border p-6 rounded-3xl shadow-sm hover:shadow-md transition-all relative flex flex-col ${event.type === 'bookmark' ? 'cursor-default group/bmk' : 'cursor-pointer'} ${isSelected ? 'border-[#f43f5e] ring-2 ring-[#f43f5e]/20' : 'border-stone-200'}`}>
                            {event.type === 'bookmark' && (
                              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#c2094c] text-white font-bold px-4 py-1.5 rounded-full shadow-sm text-sm opacity-0 group-hover/bmk:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                NO ACTION AVAILABLE
                              </span>
                            )}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); toggleSelection(event.id); }} className="text-stone-300 hover:text-[#f43f5e] transition-colors shrink-0">
                                  {isSelected ? <CheckCircle2 size={20} className="text-[#f43f5e] fill-[#f43f5e]/10" /> : <Circle size={20} />}
                                </button>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border inline-block whitespace-nowrap ${getBadgeColor(event.type)}`}>
                                  {event.type === 'verse' ? (event.version === 'DAILY_VERSE' ? 'Daily Verse' : 'Faith Verses') : (event.type === 'prayer' ? 'Faith Prayer' : event.type.replace('_', ' '))}
                                </span>
                              </div>
                              <ActionMenu />
                            </div>
                            
                            <div className="flex items-start gap-4 flex-1">
                               <div onClick={() => handleItemClick(event.type, event.id, event.title)} className={`w-10 h-10 rounded-full bg-white border-2 shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 border-stone-100 ${event.type === 'bookmark' ? 'cursor-default' : 'cursor-pointer hover:scale-110 hover:border-[#c2094c]/20'}`}>
                                 {getIcon(event.type, event.version)}
                               </div>
                               <div className="flex-1">
                                 <h4 className="text-lg font-serif text-slate-900 mb-2">{event.title}</h4>
                                 {event.description && (
                                   event.type === 'note' ? (
                                     <div 
                                       className="text-stone-600 leading-relaxed text-sm line-clamp-4 whitespace-pre-wrap"
                                       dangerouslySetInnerHTML={{ __html: event.description }}
                                     />
                                   ) : (
                                     <p className="text-stone-600 leading-relaxed text-sm line-clamp-4 whitespace-pre-wrap italic">
                                       {renderCustomHTML(event.description)}
                                     </p>
                                   )
                                 )}
                                {event.note && event.type === 'verse' && (
                                  <div className="pt-4 border-t border-stone-100 mt-4">
                                    <h4 className="font-bold uppercase tracking-[0.2em] text-stone-400 mb-2 flex items-center gap-2 text-[10px]">
                                      Make it happen
                                    </h4>
                                    <div 
                                      className="text-stone-600 leading-relaxed text-sm whitespace-pre-wrap"
                                      dangerouslySetInnerHTML={{ __html: event.note.length > 200 && !searchQuery ? event.note.substring(0, 200) + '...' : event.note }}
                                    />
                                  </div>
                                )}
                                {event.collections && event.collections.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-4">
                                    {event.collections.map((c: string) => {
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
                              <div className="text-xs text-stone-400 font-bold uppercase tracking-widest">{timeStr}</div>
                           </div>
                         </div>
                      );
                    }
                    
                    // List View
                    if (event.type === 'verse') {
                      return (
                        <div key={event.id} className="relative flex items-start gap-6 sm:gap-8 group">
                          <div className="absolute left-6 sm:left-[39px] top-6 w-8 h-px bg-stone-200 -z-10"></div>
                          
                          <div className="flex-1 flex items-start gap-4">
                            <button onClick={(e) => { e.stopPropagation(); toggleSelection(event.id); }} className="mt-4 text-stone-300 hover:text-[#c2094c] transition-colors shrink-0">
                               {isSelected ? <CheckCircle2 size={22} className="text-[#c2094c] fill-[#c2094c]/10" /> : <Circle size={22} />}
                            </button>
                            
                            <div onClick={(e) => { e.stopPropagation(); handleItemClick(event.type, event.id, event.title); }} className={`w-12 h-12 rounded-full bg-white border-[3px] shadow-sm flex items-center justify-center shrink-0 mt-1 relative z-10 transition-transform duration-300 border-stone-100 cursor-pointer hover:scale-110 hover:border-[#c2094c]/20`}>
                              {getIcon(event.type, event.version)}
                            </div>
                            
                            <div onClick={() => handleItemClick(event.type, event.id, event.title)} className={`flex-1 bg-white border-0 rounded-3xl shadow-md hover:shadow-lg transition-all relative overflow-hidden flex flex-col cursor-pointer ${isSelected ? 'ring-2 ring-[#c2094c]/30' : 'ring-1 ring-stone-200/50'}`}>
                               
                               <div className="p-6 sm:p-8 bg-gradient-to-br from-white to-stone-50/50 text-slate-800 relative flex flex-col justify-center border-b border-stone-100/50">
                                  
                                   <div className="flex items-center justify-between mb-4 relative z-10">
                                     <div className="flex items-center gap-3">
                                       <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${event.version === 'DAILY_VERSE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : event.version === 'FAITH_GUIDE' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                         {event.version === 'DAILY_VERSE' ? 'DAILY VERSE' : event.version === 'FAITH_GUIDE' ? 'FAITH GUIDE' : 'FAITH VERSE'}
                                       </span>
                                      <span className="text-stone-400 text-sm font-bold uppercase tracking-widest">{timeStr}</span>
                                    </div>
                                    <ActionMenu />
                                  </div>

                                  <p className="font-serif leading-relaxed mb-6 text-slate-900 text-lg sm:text-2xl relative z-10 tracking-wide">
                                    {renderCustomHTML(event.description)}
                                  </p>
                                  <p className="text-stone-500 font-bold tracking-widest text-xs relative z-10 uppercase">
                                    — {event.title}
                                  </p>
                               </div>

{event.note && (
                                  <div className="p-6 sm:px-8 sm:py-6 flex flex-col bg-[#fdf8fa]/50">
                                     <h4 className="font-bold uppercase tracking-[0.2em] text-[#c2094c]/60 mb-3 flex items-center gap-2 text-[10px]">
                                       Make it happen
                                     </h4>
                                     <div 
                                       className="text-slate-700 leading-relaxed text-sm"
                                       dangerouslySetInnerHTML={{ __html: event.note }}
                                     />
                                  </div>
                                )}

                               {event.collections && event.collections.length > 0 && (
                                  <div className="px-6 sm:px-8 pb-6 flex flex-wrap gap-1 bg-[#fdf8fa]/50">
                                    {event.collections.map((c) => {
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
                    }

                    return (
                      <div key={event.id} className="relative flex items-start gap-6 sm:gap-8 group">
                        <div className="absolute left-6 sm:left-[39px] top-6 w-8 h-px bg-stone-200 -z-10"></div>
                        
                        <div className="flex-1 flex items-start gap-4">
                          <button onClick={(e) => { e.stopPropagation(); toggleSelection(event.id); }} className="mt-4 text-stone-300 hover:text-[#f43f5e] transition-colors shrink-0">
                             {isSelected ? <CheckCircle2 size={22} className="text-[#f43f5e] fill-[#f43f5e]/10" /> : <Circle size={22} />}
                          </button>
                          
                          <div onClick={(e) => { e.stopPropagation(); handleItemClick(event.type, event.id, event.title); }} className={`w-12 h-12 rounded-full bg-white border-[3px] shadow-sm flex items-center justify-center shrink-0 mt-1 relative z-10 transition-transform duration-300 border-stone-100 ${event.type === 'bookmark' ? 'cursor-default' : 'cursor-pointer hover:scale-110 hover:border-[#c2094c]/20'}`}>
                            {getIcon(event.type, event.version)}
                          </div>
                          
                          <div onClick={() => handleItemClick(event.type, event.id, event.title)} className={`flex-1 bg-white border p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative ${event.type === 'bookmark' ? 'cursor-default group/bmk' : 'cursor-pointer'} ${isSelected ? 'border-[#f43f5e] ring-1 ring-[#f43f5e]/20' : 'border-stone-200'}`}>
                            {event.type === 'bookmark' && (
                              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#c2094c] text-white font-bold px-4 py-1.5 rounded-full shadow-sm text-sm opacity-0 group-hover/bmk:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                NO ACTION AVAILABLE
                              </span>
                            )}
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-4">
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${getBadgeColor(event.type)}`}>
                                  {event.type === 'verse' ? (event.version === 'DAILY_VERSE' ? 'Daily Verse' : 'Faith Verses') : (event.type === 'prayer' ? 'Faith Prayer' : event.type.replace('_', ' '))}
                                </span>
                                <span className="text-stone-400 text-sm font-bold uppercase tracking-widest">{timeStr}</span>
                              </div>
                              <ActionMenu />
                            </div>
                            <h4 className="text-xl font-serif text-slate-900 mb-2">{event.title}</h4>
                            {event.description && (
                              event.type === 'note' ? (
                                <div 
                                  className="text-stone-600 leading-relaxed text-sm whitespace-pre-wrap"
                                  dangerouslySetInnerHTML={{ __html: event.description.length > 200 && !searchQuery ? event.description.substring(0, 200) + '...' : event.description }}
                                />
                              ) : (
                                <p className="text-stone-600 leading-relaxed text-sm whitespace-pre-wrap italic">
                                  {renderCustomHTML(event.description.length > 200 && !searchQuery ? event.description.substring(0, 200) + '...' : event.description)}
                                </p>
                              )
                            )}
                            {event.note && event.type === 'verse' && (
                              <div className="pt-4 border-t border-stone-100 mt-4">
                                <h4 className="font-bold uppercase tracking-[0.2em] text-[#f43f5e] mb-2 flex items-center gap-2 text-[10px]">
                                  <Sparkles size={14} className="text-[#f43f5e]" />
                                  Make it happen
                                </h4>
                                <div 
                                  className="text-stone-600 leading-relaxed text-sm whitespace-pre-wrap"
                                  dangerouslySetInnerHTML={{ __html: event.note.length > 200 && !searchQuery ? event.note.substring(0, 200) + '...' : event.note }}
                                />
                              </div>
                            )}
                            {event.collections && event.collections.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-4">
                                {event.collections.map((c: string) => {
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
                    })();

                    return (
                      <React.Fragment key={event.id}>
                        {EventCard}
                        {idx > 0 && (idx + 1) % 10 === 0 && (
                          <div className={viewMode === 'grid' ? "col-span-1 sm:col-span-2 lg:col-span-2 mt-4 mb-4" : "mt-4 mb-4"}>
                            <AdBanner dataAdSlot="faith_timeline_in_feed" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        )}
      
      {activeTab === 'timeline' && events.length > 0 && (
          <div className="mt-8 pb-12">
            <AdBanner dataAdSlot="faith_timeline_bottom" />
          </div>
        )}

      {activeTab === 'collections' && (
          <div className="mt-8 pb-12">
            <AdBanner dataAdSlot="faith_timeline_bottom" />
          </div>
        )}

      {/* AI Summary Modal */}
      </>
      )}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl text-slate-800 flex items-center gap-2">
                <Sparkles className="text-[#c2094c]" /> Pastoral Summary
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(summaryText);
                    setSummaryCopied(true);
                    setTimeout(() => setSummaryCopied(false), 2000);
                  }}
                  disabled={!summaryText || summaryLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {summaryCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  {summaryCopied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={() => setShowSummaryModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {summaryLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-[#c2094c]/20 border-t-[#c2094c] rounded-full animate-spin"></div>
                <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">Generating your summary...</p>
              </div>
            ) : (
              <div className="prose prose-stone max-w-none max-h-[60vh] overflow-y-auto pr-2">
                {summaryText.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="text-stone-700 leading-relaxed">{paragraph}</p>
                ))}
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="bg-stone-100 text-stone-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-stone-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Event Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-xl font-serif font-bold mb-3">Delete Event?</h4>
            <p className="text-sm text-stone-600 mb-8 leading-relaxed">
              Are you sure you want to delete this item? This action cannot be undone. It will be permanently removed <strong className="text-red-600">site-wide</strong>, including from your timeline, all collections, and all feature areas.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setEventToDelete(null)}
                className="flex-1 px-4 py-3 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(eventToDelete)}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                Yes, Delete It
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );

  if (isEmbedded) {
    return innerContent;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#faf9f8] p-4 sm:p-8 md:p-12 animate-in fade-in duration-700 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {innerContent}
    </div>
  );
}

