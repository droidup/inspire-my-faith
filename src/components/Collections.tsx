import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PenTool, Plus, BookOpen, Trash2, Calendar as CalendarIcon, CheckCircle2, Circle, Copy, FolderOpen, Sparkles, X, ChevronLeft, ChevronRight, Check, AlertTriangle, Loader2, Bookmark, Heart, BookHeart, Flag, Map, Sun, Crosshair, Star, Pin, PinOff, LayoutGrid, List, Settings, Compass, Moon, Cloud, Flame, Leaf, Wind, Zap, Shield, Anchor, Key, Bell, Crown, Gem, Home, Search, Info, Minus, Church, Cross, Bird, HeartHandshake, Hand, HandHeart, Droplet, Snowflake, Mountain, Trees, Waves, Sword, Clock, Camera, Coffee, Gift, Umbrella, Users, User, Smile, Frown, Meh, Eye, HeartCrack, Activity, Trash, Library, Signpost, BookPlus, ArrowDownUp } from 'lucide-react';
import { TimelineEvent } from '../hooks/useFaithTimeline';
import { useCollectionSettings, CollectionSettings } from '../hooks/useCollectionSettings';
import StandardToolbar from './shared/StandardToolbar';
import CollectionHeader from './shared/CollectionHeader';

const ICON_MAP: Record<string, React.ElementType> = {
  FolderOpen, Bookmark, Star, Heart, Map, Flag, CheckCircle2, Compass, Home, Settings, Search, Bell, AlertTriangle, Info, Plus, Minus, X, Check, Copy, LayoutGrid, List, Library, Signpost,
  BookOpen, BookHeart, Church, Cross, Sparkles, Flame, Sun, Bird, HeartHandshake, Hand, HandHeart,
  Moon, Cloud, Leaf, Wind, Zap, Droplet, Snowflake, Mountain, Trees, Waves,
  Shield, Anchor, Key, Crown, Gem, Sword, Clock, PenTool, Camera, Coffee, Gift, Umbrella,
  Users, User, Smile, Frown, Meh, Eye, HeartCrack, Activity, Trash, Trash2, CalendarIcon, Circle, ChevronLeft, ChevronRight, Loader2, Crosshair, Pin, PinOff, BookPlus, ArrowDownUp
};
const ICON_CATEGORIES = [
  { name: 'Essentials', icons: ['FolderOpen', 'Bookmark', 'Star', 'Heart', 'Map', 'Flag', 'Compass', 'Settings', 'Search', 'Bell', 'AlertTriangle', 'Info', 'Copy', 'LayoutGrid', 'List'] },
  { name: 'Faith', icons: ['BookHeart', 'Church', 'Cross', 'Sparkles', 'Flame', 'Sun', 'Bird', 'HeartHandshake', 'Hand', 'HandHeart'] },
  { name: 'Nature', icons: ['Moon', 'Cloud', 'Leaf', 'Wind', 'Zap', 'Droplet', 'Snowflake', 'Mountain', 'Trees', 'Waves'] },
  { name: 'Objects', icons: ['Shield', 'Anchor', 'Key', 'Crown', 'Gem', 'Sword', 'Clock', 'Camera', 'Coffee', 'Gift', 'Umbrella'] },
  { name: 'People', icons: ['Users', 'User', 'Smile', 'Frown', 'Meh', 'Eye', 'HeartCrack', 'Activity'] },
  { name: 'Study', icons: ['BookOpen', 'PenTool', 'Library', 'BookPlus', 'Search'] },
  { name: 'Action', icons: ['Plus', 'Minus', 'X', 'Check', 'CheckCircle2', 'Trash', 'Trash2', 'ArrowDownUp', 'Crosshair', 'ChevronLeft', 'ChevronRight', 'Pin', 'PinOff'] },
  { name: 'Places', icons: ['Home', 'Church', 'Mountain', 'Trees', 'Signpost'] }
];
const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#c2094c',
  '#b91c1c', '#c2410c', '#b45309', '#4d7c0f', '#047857', '#1d4ed8', '#6d28d9', '#be185d', '#334155'
];

interface CollectionsProps {
  onNavigate?: (view: string, data?: any) => void;
  onEditEvent?: (id: string) => void;
  onDeleteEvent?: (id: string) => void;
  collectionSettings: Record<string, CollectionSettings>;
  updateCollectionSetting: (collectionName: string, settings: Partial<CollectionSettings>) => void;
  deleteCollection: (collectionName: string) => void;
  renameCollection?: (oldName: string, newName: string) => Promise<{success: boolean, reason?: string}>;
  sectionType: string;
  events: TimelineEvent[];
}

export default function Collections({ onNavigate, onEditEvent, onDeleteEvent, collectionSettings, updateCollectionSetting, deleteCollection, renameCollection, sectionType, events }: CollectionsProps) {
  const { user } = useAuth();
  const uniqueCollections = React.useMemo(() => {
    const fromSettings = Object.keys(collectionSettings);
    if (sectionType === 'timeline') {
      return Array.from(new Set(fromSettings.filter(Boolean)));
    }
    const fromEvents = events.flatMap(e => e.collections || []);
    return Array.from(new Set([...fromSettings, ...fromEvents].filter(Boolean)));
  }, [collectionSettings, events, sectionType]);
  
  const getSectionTitle = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'timeline': return 'Faith Timeline Collections';
      case 'note': return 'Faith Diary Collections';
      case 'verse': return 'Faith Guide Collections';
      case 'faith_verses': return 'Faith Verses Collections';
      case 'prayer': return 'Faith Search Collections';
      default: return 'Faith Collections';
    }
  };
  
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  
  const [collectionItems, setCollectionItems] = useState<{id: string, type: string}[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [outerViewMode, setOuterViewMode] = useState<'grid' | 'list'>('grid');
  const [innerViewMode, setInnerViewMode] = useState<'grid' | 'list'>('grid');
  const [outerSortOrder, setOuterSortOrder] = useState<'az' | 'za' | 'newest' | 'oldest'>('az');
  const [innerSortOrder, setInnerSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showOuterSortMenu, setShowOuterSortMenu] = useState(false);
  const outerSortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (outerSortMenuRef.current && !outerSortMenuRef.current.contains(event.target as Node)) {
        setShowOuterSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());


  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  
  const collectionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
       if (e.collections) {
          const cols = Array.isArray(e.collections) ? e.collections : [e.collections];
          cols.forEach((c: any) => {
             if (typeof c === 'string') {
               counts[c] = (counts[c] || 0) + 1;
             }
          });
       }
    });
    return counts;
  }, [events]);

  const [selectedOuterCollections, setSelectedOuterCollections] = useState<Set<string>>(new Set());

  const toggleOuterSelection = (colName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedOuterCollections);
    if (newSet.has(colName)) newSet.delete(colName);
    else newSet.add(colName);
    setSelectedOuterCollections(newSet);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleOuterPin = (colName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = collectionSettings[colName] || { color: '#c2094c', icon: 'FolderOpen', isPinned: false };
    updateCollectionSetting(colName, { isPinned: !current.isPinned });
  };

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'color' | 'icons'>('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#c2094c');
  const [editIcon, setEditIcon] = useState('FolderOpen');
  const [editDescription, setEditDescription] = useState('');
  const [activeIconTab, setActiveIconTab] = useState('General');

  const openCustomizeModal = (colName: string) => {
    const settings = collectionSettings[colName] || { color: '#c2094c', icon: 'FolderOpen', description: '', isPinned: false };
    setEditName(colName);
    setEditColor(settings.color || '#c2094c');
    setEditIcon(settings.icon || 'FolderOpen');
    setEditDescription(settings.description || '');
    setShowDeleteConfirm(false);
    setIsCustomizeModalOpen(true);
  };

  const handleSaveSettings = async () => {
    if (activeCollection && editName.trim()) {
      const newName = editName.trim();
      let targetName = activeCollection;

      if (newName !== activeCollection && renameCollection) {
        const result = await renameCollection(activeCollection, newName);
        if (result.success) {
          targetName = newName;
          setActiveCollection(newName);
        } else {
          alert(`Rename failed: ${result.reason}`);
          return;
        }
      }

      updateCollectionSetting(targetName, {
        color: editColor,
        icon: editIcon,
        description: editDescription
      });
      setIsCustomizeModalOpen(false);
    }
  };
  const openCollection = async (colName: string) => {
    setActiveCollection(colName);
    setItemsLoading(true);
    try {
      const res = await fetch(`/api/collection_items.php?sectionType=${sectionType}&collectionName=${encodeURIComponent(colName)}&userId=${user?.uid}`);
      const data = await res.json();
      if (data.success) {
        setCollectionItems(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch items", e);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!user || newCollectionName.trim() === '') return;
    updateCollectionSetting(newCollectionName.trim(), {});
    setShowNewCollectionModal(false);
    setNewCollectionName('');
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'prayer': return 'border-rose-200 text-rose-600 bg-rose-50';
      case 'note': return 'border-amber-200 text-amber-600 bg-amber-50';
      case 'verse': 
        if (sectionType === 'faith_verses') return 'border-rose-200 text-rose-600 bg-rose-50';
        return 'border-blue-200 text-blue-600 bg-blue-50';
      case 'bookmark': return 'border-indigo-200 text-indigo-600 bg-indigo-50';
      default: return 'border-[#c2094c]/20 text-[#c2094c] bg-[#c2094c]/5';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'prayer': return Heart;
      case 'note': return PenTool;
      case 'verse': 
        if (sectionType === 'faith_verses') return HeartHandshake;
        return BookPlus;
      case 'bookmark': return Pin;
      case 'prayer_answered': return Heart;
      case 'plan_completed': return BookOpen;
      default: return Signpost; 
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'prayer': return "text-[#c2094c]";
      case 'note': return "text-[#64748b]";
      case 'verse': 
        if (sectionType === 'faith_verses') return "text-rose-500";
        return "text-purple-500";
      case 'bookmark': return "text-blue-500";
      case 'prayer_answered': return "text-[#c2094c]";
      case 'plan_completed': return "text-blue-500";
      default: return "text-teal-500"; 
    }
  };



  const togglePin = (id: string) => {
    const newSet = new Set(pinnedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setPinnedIds(newSet);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleOuterGenerateSummary = async () => {
    if (selectedOuterCollections.size === 0) {
      return handleGenerateSummary(events || []);
    }
    const itemsToSummarize: any[] = [];
    setSummaryLoading(true);
    setShowSummaryModal(true);
    setSummaryText('Gathering items from selected folders...');
    try {
      const safeEvents = events || [];
      for (const col of selectedOuterCollections) {
         const itemsInCol = safeEvents.filter(e => {
            if (!e || !e.collections) return false;
            const cols = Array.isArray(e.collections) ? e.collections : [e.collections];
            return cols.includes(col);
         });
         itemsToSummarize.push(...itemsInCol);
      }
      const uniqueItems = Array.from(new globalThis.Map(itemsToSummarize.map(item => [item?.id || Math.random().toString(), item])).values());
      if (uniqueItems.length === 0) {
        setSummaryText('No items found in selected collections.');
        setSummaryLoading(false);
        return;
      }
      handleGenerateSummary(uniqueItems);
    } catch (e: any) {
      console.error("Outer generate summary error:", e);
      setSummaryText(`Error fetching items for summary: ${e?.message || 'Unknown error'}`);
      setSummaryLoading(false);
    }
  };

  const handleInnerGenerateSummary = () => {
    if (selectedIds.size > 0) {
      handleGenerateSummary(searchFilteredEvents.filter(e => selectedIds.has(e.id)));
    } else {
      handleGenerateSummary(searchFilteredEvents);
    }
  };

  const handleGenerateSummary = async (eventsToSummarize: any[]) => {
    if (eventsToSummarize.length === 0) return;
    setShowSummaryModal(true);
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/timeline_summary.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSummarize.slice(0, 50) })
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


  const handleItemClick = (type: string, item_id: string, text?: string) => {
      if (onEditEvent) {
          onEditEvent(item_id);
          return;
      }
      if (!onNavigate) return;
      if (type === 'verse' || type === 'bookmark') {
          onNavigate('bible', { verse: text });
      } else if (type === 'prayer') {
          onNavigate('soul_search', { prayerId: item_id }); 
      } else if (type === 'note') {
          onNavigate('sermon_notes', { noteId: item_id });
      } else {
          onNavigate('home');
      }
  };

  const filteredCollections = uniqueCollections.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => {
    const pinA = collectionSettings[a]?.isPinned ? 1 : 0;
    const pinB = collectionSettings[b]?.isPinned ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    
    if (outerSortOrder === 'az') return a.localeCompare(b);
    if (outerSortOrder === 'za') return b.localeCompare(a);
    
    const timeA = new Date(collectionSettings[a]?.createdAt || 0).getTime();
    const timeB = new Date(collectionSettings[b]?.createdAt || 0).getTime();
    if (outerSortOrder === 'newest') return timeB - timeA;
    return timeA - timeB; // oldest
  });

  const mappedEvents = collectionItems.map(cItem => (events || []).find(e => e.id === cItem.id && e.type === cItem.type)).filter(Boolean) as TimelineEvent[];
  const sortedEvents = mappedEvents.sort((a, b) => {
    const pinA = pinnedIds.has(a.id) ? 1 : 0;
    const pinB = pinnedIds.has(b.id) ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    return innerSortOrder === 'desc' ? timeDiff : -timeDiff;
  });

  const searchFilteredEvents = sortedEvents.filter(e => {
    if (searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase();
    return (e.title && e.title.toLowerCase().includes(q)) || (e.description && e.description.toLowerCase().includes(q));
  });

  const groupedEvents = searchFilteredEvents.reduce((acc, event) => {
    const dateStr = new Date(event.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const sortedGroupedKeys = Object.keys(groupedEvents).sort((a, b) => {
    const timeDiff = new Date(b).getTime() - new Date(a).getTime();
    return innerSortOrder === 'desc' ? timeDiff : -timeDiff;
  });

  const activeFolderColor = activeCollection ? (collectionSettings[activeCollection]?.color || '#c2094c') : '#c2094c';

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#faf9f8]">
        <h2 className="text-2xl font-serif text-slate-800 mb-4">Please sign in to view Collections</h2>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="w-full">
        
        {/* Universal Toolbar */}
        <StandardToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder={activeCollection ? `Search inside ${activeCollection}...` : "Search collections..."}
        >
          {activeCollection ? (
            <>
              <button 
                onClick={() => handleInnerGenerateSummary()}
                className="text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm border-none outline-none focus:ring-2 opacity-90 hover:opacity-100"
                style={{ backgroundColor: activeFolderColor }}
              >
                <Sparkles size={16} /> AI Pastoral Summary
              </button>
              <div className="relative group/btn flex items-center">
                <button
                  onClick={() => setInnerSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-slate-700 hover:border-stone-300 transition-colors shadow-sm opacity-90 hover:opacity-100"
                >
                  <ArrowDownUp size={18} className={innerSortOrder === 'desc' ? '' : 'rotate-180'} />
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {innerSortOrder === 'desc' ? 'Sort Oldest' : 'Sort Newest'}
                </span>
              </div>
              <div className="relative group/btn flex items-center">
                <button 
                  onClick={() => openCustomizeModal(activeCollection)}
                  className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-slate-700 hover:border-stone-300 transition-colors shadow-sm"
                >
                  <Settings size={18} />
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Settings
                </span>
              </div>
              <div className="flex bg-stone-100 p-1 rounded-xl shrink-0">
                <div className="relative group/btn">
                  <button
                    onClick={() => setInnerViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${innerViewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    Grid
                  </span>
                </div>
                <div className="relative group/btn">
                  <button
                    onClick={() => setInnerViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${innerViewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <List size={18} />
                  </button>
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    List
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => handleOuterGenerateSummary()}
                className="bg-[#c2094c] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#a0073e] transition-colors shadow-sm flex items-center gap-2"
              >
                <Sparkles size={16} /> AI Pastoral Summary
              </button>
              <div className="relative group/btn flex items-center" ref={outerSortMenuRef}>
                <button
                  onClick={() => setShowOuterSortMenu(!showOuterSortMenu)}
                  className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-slate-700 hover:border-stone-300 transition-colors shadow-sm"
                >
                  <ArrowDownUp size={18} />
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Sort
                </span>
                {showOuterSortMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden">
                    {[
                      { id: 'az', label: 'A to Z' },
                      { id: 'za', label: 'Z to A' },
                      { id: 'newest', label: 'Newest First' },
                      { id: 'oldest', label: 'Oldest First' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setOuterSortOrder(opt.id as any);
                          setShowOuterSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${outerSortOrder === opt.id ? 'bg-[#c2094c]/10 text-[#c2094c] font-bold' : 'text-stone-600 hover:bg-stone-50'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewCollectionModal(true)}
                  className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-slate-700 hover:border-stone-300 transition-colors shadow-sm"
                  title="Add Collection"
                >
                  <Plus size={18} />
                </button>
                <div className="flex bg-stone-100 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setOuterViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${outerViewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setOuterViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${outerViewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </StandardToolbar>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!activeCollection ? (
        <div className="flex flex-col gap-8 pb-32">
          <CollectionHeader 
            title={getSectionTitle(sectionType)}
            count={filteredCollections.length}
          />

          <div className={outerViewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}>
            {filteredCollections.map(colName => {
              const colSettings = collectionSettings[colName] || { color: '#c2094c', icon: 'FolderOpen', isPinned: false, createdAt: '' };
              const IconComponent = ICON_MAP[colSettings.icon || 'FolderOpen'] || FolderOpen;
              const count = collectionCounts[colName] || 0;
              const isOuterSelected = selectedOuterCollections.has(colName);
              const dateStr = colSettings.createdAt ? new Date(colSettings.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
              return outerViewMode === 'grid' ? (
                <div 
                  key={colName}
                  onClick={() => openCollection(colName)}
                  className={`bg-white rounded-[24px] pt-8 pb-6 px-6 border shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col items-center text-center relative group overflow-hidden ${isOuterSelected ? 'ring-2 ring-offset-2' : 'border-stone-200'}`}
                  style={{ '--tw-ring-color': colSettings.color } as React.CSSProperties}
                >
                  <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ backgroundColor: colSettings.color }}></div>
                  <button onClick={(e) => toggleOuterSelection(colName, e)} className="absolute top-4 left-4 text-stone-300 hover:text-slate-600 transition-colors z-10">
                    {isOuterSelected ? <CheckCircle2 size={20} style={{ color: colSettings.color, fill: `${colSettings.color}1A` }} /> : <Circle size={20} />}
                  </button>
                  <button onClick={(e) => toggleOuterPin(colName, e)} className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors z-10 ${colSettings.isPinned ? 'bg-red-50 text-red-500' : 'opacity-0 group-hover:opacity-100 hover:bg-stone-100 text-stone-300'}`}>
                    <Pin size={14} className={colSettings.isPinned ? 'fill-current' : ''} />
                  </button>
                  <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 transition-transform group-hover:scale-105" style={{ backgroundColor: `${colSettings.color}1A`, color: colSettings.color }}>
                    <IconComponent size={28} />
                  </div>
                  <h3 className="font-serif text-[17px] font-bold text-slate-900 mb-1.5">{colName}</h3>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400">
                    {count} ITEM{count === 1 ? '' : 'S'} {dateStr ? ` • ${dateStr}` : ''}
                  </p>
                </div>
              ) : (
                <div 
                  key={colName}
                  onClick={() => openCollection(colName)}
                  className={`bg-white rounded-[20px] py-4 pr-4 pl-5 border shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group overflow-hidden relative ${isOuterSelected ? 'ring-2 ring-offset-1' : 'border-stone-100'}`}
                  style={{ '--tw-ring-color': colSettings.color } as React.CSSProperties}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: colSettings.color }}></div>
                  
                  <div className="flex items-center gap-5">
                    <button onClick={(e) => toggleOuterSelection(colName, e)} className="text-stone-300 hover:text-slate-600 transition-colors z-10 -ml-1">
                      {isOuterSelected ? <CheckCircle2 size={20} style={{ color: colSettings.color, fill: `${colSettings.color}1A` }} /> : <Circle size={20} />}
                    </button>
                    
                    <div className="w-14 h-14 rounded-[18px] flex items-center justify-center transition-transform group-hover:scale-105" style={{ backgroundColor: `${colSettings.color}1A`, color: colSettings.color }}>
                      <IconComponent size={24} />
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-[17px] font-bold text-slate-900 leading-none">{colName}</h3>
                        {colSettings.isPinned && (
                          <Pin size={12} className="text-stone-300" />
                        )}
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 leading-none mt-1">
                        {count} ITEM{count === 1 ? '' : 'S'} {dateStr ? ` • ${dateStr}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <button onClick={(e) => toggleOuterPin(colName, e)} className={`p-2 rounded-xl transition-colors z-10 flex-shrink-0 ${colSettings.isPinned ? 'bg-orange-50 text-orange-400 hover:bg-orange-100' : 'opacity-0 group-hover:opacity-100 bg-stone-50 hover:bg-stone-100 text-stone-400'}`}>
                    {colSettings.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>
                </div>
              );
            })}
            {filteredCollections.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-stone-400 bg-white rounded-2xl border border-dashed border-stone-200">
                <FolderOpen size={48} className="mb-4 opacity-50" />
                <p>No collections found.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setActiveCollection(null)}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-sm hover:opacity-90"
                style={{ backgroundColor: activeFolderColor }}
              >
                <ChevronLeft size={14} /> Back
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center" style={{ color: collectionSettings[activeCollection]?.color || '#c2094c' }}>
                  {React.createElement(ICON_MAP[collectionSettings[activeCollection]?.icon || 'FolderOpen'] || FolderOpen, { size: 24 })}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    {activeCollection}
                  </h1>
                  {collectionSettings[activeCollection]?.description && (
                     <p className="text-stone-500 text-sm mt-1">{collectionSettings[activeCollection].description}</p>
                  )}
                </div>
              </div>
              <div className="w-20"></div>
            </div>

            <div className="pb-32">
              {itemsLoading ? (
                <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-100">Loading items...</div>
              ) : searchFilteredEvents.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-stone-400 bg-white rounded-2xl border border-stone-100 shadow-sm">
                  <Library size={48} className="mb-4 opacity-50" />
                  <p>No items found.</p>
                </div>
              ) : innerViewMode === 'grid' ? (
                <div className="flex flex-col gap-8">
                  {sortedGroupedKeys.map(dateStr => (
                    <div key={dateStr} className="relative">
                      <div className="sticky top-[80px] z-30 py-4 bg-[#faf9f8]/90 backdrop-blur-md">
                        <h3 className="inline-block bg-white text-slate-800 font-bold px-4 py-1.5 rounded-full border border-stone-200 shadow-sm text-sm">
                          {dateStr}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                        {groupedEvents[dateStr].map(event => {
                          const isPinned = pinnedIds.has(event.id);
                          const timeStr = event.timestamp ? new Date(event.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
                          return (
                            <div key={event.id} onClick={() => handleItemClick(event.type, event.id, event.title)} className={`border overflow-hidden rounded-3xl shadow-sm hover:shadow-md transition-all relative flex flex-col cursor-pointer ${selectedIds.has(event.id) ? 'border-[#f43f5e] ring-2 ring-[#f43f5e]/20' : 'border-stone-200'} ${event.type === 'verse' && sectionType === 'faith_verses' ? 'bg-gradient-to-br from-white to-stone-50/50 p-0' : 'bg-white p-6'}`}>
                              <div className={`flex items-center justify-between mb-4 ${event.type === 'verse' && sectionType === 'faith_verses' ? 'p-6 pb-0 mb-0' : ''}`}>
                                <div className="flex items-center gap-3">
                                  <button onClick={(e) => { e.stopPropagation(); toggleSelection(event.id); }} className="text-stone-300 hover:text-[#f43f5e] transition-colors shrink-0">
                                    {selectedIds.has(event.id) ? <CheckCircle2 size={20} className="text-[#f43f5e] fill-[#f43f5e]/10" /> : <Circle size={20} />}
                                  </button>
                                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border inline-block whitespace-nowrap ${getBadgeColor(event.type)}`}>
                                    {event.type === 'verse' ? (sectionType === 'faith_verses' ? 'Faith Verse' : 'Faith Guide') : event.type === 'faith_verses' ? 'Faith Verses' : (event.type || '').replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 text-stone-400">
                                  <div className="relative group/btn">
                                    <button onClick={(e) => { e.stopPropagation(); togglePin(event.id); }} className={`p-1.5 hover:bg-stone-100 rounded-md transition-colors ${isPinned ? 'text-blue-500' : 'hover:text-slate-600'}`}>
                                      <Pin size={16} className={isPinned ? 'fill-current' : ''} />
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
                                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                        Edit
                                      </span>
                                    </div>
                                  )}
                                  {onDeleteEvent && (
                                    <div className="relative group/btn">
                                      <button onClick={(e) => { e.stopPropagation(); setEventToDelete(event.id); }} className="p-1.5 hover:bg-stone-100 rounded-md transition-colors hover:text-red-500">
                                        <Trash2 size={16} />
                                      </button>
                                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                        Delete
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {event.type === 'verse' && sectionType === 'faith_verses' ? (
                                <div className="flex flex-col flex-1">
                                  <div className="p-6 pt-4 flex-1 flex flex-col justify-center text-center">
                                    <p className="font-serif leading-relaxed mb-4 text-slate-900 text-lg sm:text-xl relative z-10 tracking-wide line-clamp-4">
                                      "{event.description}"
                                    </p>
                                    <p className="text-stone-500 font-bold tracking-widest text-[11px] relative z-10 uppercase">
                                      — {event.title}
                                    </p>
                                  </div>
                                  <div className="mt-auto px-6 py-4 border-t border-stone-100/50 bg-[#fdf8fa]/50 flex justify-between items-center">
                                    { (event as any).note ? (
                                      <div className="flex-1 overflow-hidden">
                                        <h4 className="font-bold uppercase tracking-[0.2em] text-[#c2094c]/60 mb-1 flex items-center gap-1.5 text-[10px]">
                                          Make it happen
                                        </h4>
                                        <p className="text-slate-700 leading-relaxed text-xs truncate">
                                          {(event as any).note}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex-1"></div>
                                    )}
                                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest shrink-0 ml-4">{timeStr}</div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-10 h-10 rounded-full bg-white border-2 shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 cursor-pointer border-stone-100 hover:scale-110 hover:border-[#c2094c]/20`}>
                                      {React.createElement(getIcon(event.type), { size: 18, className: getIconColor(event.type) })}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-lg font-serif text-slate-900 mb-2">{event.title}</h4>
                                      {event.description && (
                                        <p className="text-stone-600 leading-relaxed text-sm line-clamp-4 mb-4">
                                          {event.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-auto pt-4 flex justify-end">
                                    <div className="text-xs text-stone-400 font-bold uppercase tracking-widest">{timeStr}</div>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative flex flex-col gap-12">
                  {/* Continuous transparent timeline line */}
                  <div className="absolute left-6 sm:left-[39px] top-4 bottom-0 w-px bg-stone-200/40 -z-10"></div>
                  
                  {sortedGroupedKeys.map(dateStr => (
                    <div key={dateStr} className="relative">
                      {/* Sticky date pill */}
                      <div className="sticky top-[80px] z-30 py-4 bg-[#faf9f8]/90 backdrop-blur-md">
                        <h3 className="inline-block bg-white text-slate-800 font-bold px-4 py-1.5 rounded-full border border-stone-200 shadow-sm text-sm">
                          {dateStr}
                        </h3>
                      </div>
                      
                      <div className="flex flex-col mt-4">
                        {groupedEvents[dateStr].map((event, idx) => {
                          const isPinned = pinnedIds.has(event.id);
                          const timeStr = event.timestamp ? new Date(event.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
                          return (
                            <div key={event.id} className="relative flex items-start gap-6 sm:gap-8 group mb-8">
                              <div className="flex-1 flex items-start gap-4 ml-10 sm:ml-16">
                                <button onClick={() => toggleSelection(event.id)} className="mt-1 text-stone-300 hover:text-[#f43f5e] transition-colors shrink-0">
                                   {selectedIds.has(event.id) ? <CheckCircle2 size={22} className="text-[#f43f5e] fill-[#f43f5e]/10" /> : <Circle size={22} />}
                                </button>
                                <div className={`w-12 h-12 rounded-full bg-white border-[3px] shadow-sm flex items-center justify-center shrink-0 relative z-10 transition-transform duration-300 border-stone-100 group-hover:scale-110 group-hover:border-[#c2094c]/20`}>
                                  {React.createElement(getIcon(event.type), { size: 20, className: getIconColor(event.type) })}
                                </div>
                                <div onClick={() => handleItemClick(event.type, event.id, event.title)} className={`flex-1 border overflow-hidden rounded-3xl shadow-sm hover:shadow-md transition-shadow cursor-pointer ${selectedIds.has(event.id) ? 'border-[#f43f5e] ring-1 ring-[#f43f5e]/20' : 'border-stone-200'} ${event.type === 'verse' && sectionType === 'faith_verses' ? 'bg-gradient-to-br from-white to-stone-50/50 flex flex-col p-0' : 'bg-white p-6'}`}>
                                  <div className={`flex items-center justify-between mb-3 flex-wrap gap-4 ${event.type === 'verse' && sectionType === 'faith_verses' ? 'p-6 sm:p-8 pb-0 mb-0' : ''}`}>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${getBadgeColor(event.type)}`}>
                                        {event.type === 'verse' ? (sectionType === 'faith_verses' ? 'Faith Verse' : 'Faith Guide') : event.type === 'faith_verses' ? 'Faith Verses' : (event.type || '').replace('_', ' ')}
                                      </span>
                                      <span className="text-stone-400 text-sm font-bold uppercase tracking-widest">{timeStr}</span>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2 text-stone-400">
                                      <div className="relative group/btn">
                                        <button onClick={(e) => { e.stopPropagation(); togglePin(event.id); }} className={`p-1.5 hover:bg-stone-100 rounded-md transition-colors ${isPinned ? 'text-blue-500' : 'hover:text-slate-600'}`}>
                                          <Pin size={16} className={isPinned ? 'fill-current' : ''} />
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
                                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                            Edit
                                          </span>
                                        </div>
                                      )}
                                      {onDeleteEvent && (
                                        <div className="relative group/btn">
                                          <button onClick={(e) => { e.stopPropagation(); setEventToDelete(event.id); }} className="p-1.5 hover:bg-stone-100 rounded-md transition-colors hover:text-red-500">
                                            <Trash2 size={16} />
                                          </button>
                                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-stone-200/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                            Delete
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {event.type === 'verse' && sectionType === 'faith_verses' ? (
                                    <>
                                      <div className="p-6 sm:p-8 pt-4 flex-1 flex flex-col justify-center">
                                        <p className="font-serif leading-relaxed mb-6 text-slate-900 text-lg sm:text-2xl relative z-10 tracking-wide">
                                          "{event.description}"
                                        </p>
                                        <p className="text-stone-500 font-bold tracking-widest text-xs relative z-10 uppercase">
                                          — {event.title}
                                        </p>
                                      </div>
                                      {(event as any).note && (
                                        <div className="p-6 sm:px-8 sm:py-6 flex flex-col bg-[#fdf8fa]/50 border-t border-stone-100/50">
                                          <h4 className="font-bold uppercase tracking-[0.2em] text-[#c2094c]/60 mb-3 flex items-center gap-2 text-[11px]">
                                            Make it happen
                                          </h4>
                                          <p className="text-slate-700 leading-relaxed text-sm">
                                            {(event as any).note}
                                          </p>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className={event.type === 'verse' && sectionType === 'faith_verses' ? 'px-6 sm:px-8 pb-6 sm:pb-8' : ''}>
                                      <h4 className="text-xl font-serif text-slate-900 mb-2">{event.title}</h4>
                                      {event.description && (
                                        <p className="text-stone-600 leading-relaxed text-sm">
                                          {event.description}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

      {showNewCollectionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl text-slate-800">New Collection</h3>
              <button onClick={() => setShowNewCollectionModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500">
                <X size={20} />
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="e.g., Healing Scriptures"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#c2094c] focus:ring-1 focus:ring-[#c2094c]/20 transition-all mb-6"
              autoFocus
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowNewCollectionModal(false)}
                className="bg-stone-100 text-stone-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateCollection}
                disabled={newCollectionName.trim() === ''}
                className="bg-[#c2094c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#a1073e] disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

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
            
            <div className="flex border-b border-stone-100 bg-[#faf9f8] shrink-0">
              <button
                onClick={() => setActiveModalTab('details')}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  activeModalTab === 'details' ? 'text-[#c2094c] border-b-2 border-[#c2094c]' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveModalTab('color')}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  activeModalTab === 'color' ? 'text-[#c2094c] border-b-2 border-[#c2094c]' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Color
              </button>
              <button
                onClick={() => setActiveModalTab('icons')}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  activeModalTab === 'icons' ? 'text-[#c2094c] border-b-2 border-[#c2094c]' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Icon
              </button>
            </div>

            <div className="p-6 overflow-y-auto min-h-[400px]">
              {showDeleteConfirm ? (
                <div className="bg-red-50 text-red-900 p-6 rounded-xl border border-red-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <Trash2 size={32} />
                  </div>
                  <h4 className="text-lg font-bold mb-2">Delete Collection?</h4>
                  <p className="text-sm text-red-700/80 mb-6">
                    Are you sure you want to delete <strong className="font-bold">"{activeCollection}"</strong>? This will permanently remove the folder, but your items will remain safe.
                  </p>
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-3 bg-white border border-red-200 text-red-700 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (activeCollection) {
                          deleteCollection(activeCollection);
                          setIsCustomizeModalOpen(false);
                          setActiveCollection(null);
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
                  {activeModalTab === 'details' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                      <div>
                        <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 mb-3">Collection Title</label>
                        <input 
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-[#c2094c] text-sm font-bold text-slate-800 transition-colors"
                          placeholder="Name your collection..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 mb-3">Description / Notes (Optional)</label>
                        <textarea 
                          value={editDescription} 
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-[#c2094c] resize-none h-[180px] text-sm"
                          placeholder="Add a short description or notes for this collection..."
                        />
                      </div>
                    </div>
                  )}

                  {activeModalTab === 'color' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                      <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 mb-3">Theme Color</label>
                      <div className="grid grid-cols-9 gap-3">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setEditColor(color)}
                            className={`aspect-square rounded-full transition-transform ${editColor === color ? 'scale-125 shadow-md ring-2 ring-offset-2 ring-stone-300' : 'hover:scale-110'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="pt-4 border-t border-stone-100 flex items-center gap-3 mt-4">
                        <label className="text-sm font-bold uppercase tracking-widest text-stone-500">Custom Hex</label>
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="color" 
                            value={editColor} 
                            onChange={(e) => setEditColor(e.target.value)} 
                            className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"
                          />
                          <input 
                            type="text" 
                            value={editColor} 
                            onChange={(e) => setEditColor(e.target.value)} 
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#c2094c] uppercase font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModalTab === 'icons' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200 h-full flex flex-col">
                      <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 mb-1">Folder Icon</label>
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex-1 flex flex-col">
                        <div className="grid grid-cols-4 gap-x-1 gap-y-2 border-b border-stone-200 mb-4 pb-3 shrink-0">
                          {ICON_CATEGORIES.map(category => (
                            <button
                              key={category.name}
                              onClick={() => setActiveIconTab(category.name)}
                              className={`px-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors rounded-lg ${activeIconTab === category.name ? 'bg-[#c2094c] text-white shadow-sm' : 'bg-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'}`}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 max-h-[220px]">
                          {ICON_CATEGORIES.map(category => (
                            <div key={category.name} className={activeIconTab === category.name ? 'grid grid-cols-6 gap-2' : 'hidden'}>
                              {category.icons.map(iconName => {
                                const IconCmp = ICON_MAP[iconName];
                                if (!IconCmp) return null;
                                return (
                                  <button
                                    key={iconName}
                                    onClick={() => setEditIcon(iconName)}
                                    className={`aspect-square flex items-center justify-center rounded-lg transition-all ${editIcon === iconName ? 'bg-white shadow-sm scale-110 z-10' : 'hover:bg-white hover:scale-110'}`}
                                    style={editIcon === iconName ? { color: editColor, ringWidth: '2px', ringColor: editColor, ringOffset: '2px' } : { color: '#94a3b8' }}
                                  >
                                    <IconCmp size={20} />
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {!showDeleteConfirm && (
              <div className="p-6 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-stone-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
                >
                  <Trash2 size={16} /> Delete
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsCustomizeModalOpen(false)}
                    className="px-5 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveSettings}
                    className="px-5 py-2.5 bg-[#c2094c] text-white rounded-xl text-sm font-bold hover:bg-[#a1073e] transition-colors shadow-sm"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* AI Summary Modal */}
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
              Are you sure you want to delete this event? This action cannot be undone and it will be permanently removed from your timeline.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setEventToDelete(null)}
                className="flex-1 px-4 py-3 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (onDeleteEvent) onDeleteEvent(eventToDelete);
                  setEventToDelete(null);
                }}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 shadow-md shadow-red-500/20 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
