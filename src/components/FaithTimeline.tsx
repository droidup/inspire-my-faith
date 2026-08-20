import React, { useState } from 'react';
import FaithAreaLayout from './shared/FaithAreaLayout';
import { useFaithTimeline } from '../hooks/useFaithTimeline';
import { Signpost, FolderOpen, Calendar, ArrowRight, Edit, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TimelineEvent } from '../hooks/useFaithTimeline';

import PrayerEditModal from './PrayerEditModal';
import SermonNoteEditModal from './SermonNoteEditModal';
import PromptEditModal from './PromptEditModal';
import FaithVerseEditModal from './FaithVerseEditModal';
import StudyGuideModal from './StudyGuideModal';

import { useFaithVerses } from '../hooks/useFaithVerses';
import { useSavedVerses } from '../hooks/useSavedVerses';
import { usePrayers } from '../hooks/usePrayers';
import { useSermonNotes } from '../hooks/useSermonNotes';
import { useSavedPrompts } from '../hooks/useSavedPrompts';

import { useCollectionSettings } from '../hooks/useCollectionSettings';

interface FaithTimelineProps {
  onNavigate?: (view: string, data?: any) => void;
}

export default function FaithTimeline({ onNavigate }: FaithTimelineProps) {
  const { events, loading, setEvents } = useFaithTimeline();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'timeline' | 'calendar' | 'collections'>('timeline');
  const [intermediaryEvent, setIntermediaryEvent] = useState<TimelineEvent | null>(null);

  const { faithVerses, removeVerse: deleteFaithVerse, saveVerse: saveFaithVerse } = useFaithVerses();
  const { savedVerses, removeVerse: deleteSavedVerse, saveVerse: saveSavedVerse } = useSavedVerses();
  const { prayers, savePrayer, removePrayer } = usePrayers();
  const { notes, saveNote, removeNote } = useSermonNotes();
  const { prompts, savePrompt, removePrompt } = useSavedPrompts();

  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingVerseId, setEditingVerseId] = useState<string | null>(null);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  
  // Use explicit collection settings for the timeline instead of flatmapping events
  const { collectionSettings, updateCollectionSetting } = useCollectionSettings('timeline');
  const timelineCollections = Object.keys(collectionSettings).sort();

  const handleCollectionsUpdate = (collections?: string[] | string) => {
    if (!collections) return;
    const colArray = typeof collections === 'string' ? collections.split('|||') : collections;
    colArray.forEach(c => {
      if (!timelineCollections.includes(c)) {
        updateCollectionSetting(c, { color: '#c2094c', isPinned: false });
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await fetch(`/api/user/faith-events/${id}?userId=${user.uid}`, { method: 'DELETE' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#faf9f8] p-4 sm:p-8 md:p-12 animate-in fade-in duration-700 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="max-w-4xl mx-auto w-full flex flex-col relative shrink-0">
        {/* Top Centered Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-stone-100 p-1 rounded-2xl w-fit shrink-0 shadow-inner">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'timeline' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Signpost size={16} /> Faith Timeline
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'calendar' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Calendar size={16} /> Timeline Calendar
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'collections' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <FolderOpen size={16} /> Timeline Collections
            </button>
          </div>
        </div>

        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center text-[#c2094c]">
              <Signpost size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-serif text-slate-900">Faith Timeline</h2>
              <p className="text-stone-500 text-sm font-medium tracking-wide">Your spiritual journey in chronological order.</p>
            </div>
          </div>
        </div>
      </div>

      <FaithAreaLayout
        title="Faith Timeline"
        subtitle="Your spiritual journey in chronological order."
        icon={Signpost}
        iconColor="#c2094c"
        events={events}
        setEvents={setEvents}
        loading={loading}
        sectionType="timeline"
        onNavigate={onNavigate}
        onDeleteEvent={handleDelete}
        onEditEvent={(id) => {
          const event = events.find(e => e.id === id);
          if (event && event.type !== 'bookmark') {
            setIntermediaryEvent(event);
          }
        }}
        isEmbedded={true}
        forcedTab={activeTab}
        hideTabs={true}
      />

      {/* Intermediary Modal */}
      {intermediaryEvent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-stone-100 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-stone-100">
              <h3 className="text-xl font-serif text-slate-900">
                {intermediaryEvent.type === 'verse' 
                  ? (intermediaryEvent.version === 'DAILY_VERSE' ? 'Daily Verse' 
                    : intermediaryEvent.version === 'FAITH_GUIDE' ? 'Faith Guide' 
                    : 'Faith Verses') 
                  : intermediaryEvent.type.replace('_', ' ')}
              </h3>
              <p className="text-sm text-stone-500 mt-2">Choose an action for this item</p>
            </div>
            <div className="p-4 flex flex-col gap-3 bg-[#faf9f8]">
              <button
                onClick={() => {
                  if (!onNavigate) return;
                  if (intermediaryEvent.type === 'prayer') onNavigate('soul_search', { prayerId: intermediaryEvent.id });
                  else if (intermediaryEvent.type === 'note') onNavigate('sermon_notes', { noteId: intermediaryEvent.id });
                  else if (intermediaryEvent.type === 'verse') onNavigate('faith_verses', { verseId: intermediaryEvent.id });
                  else if (intermediaryEvent.type === 'prompt') onNavigate('prompt_builder', { promptId: intermediaryEvent.id });
                  setIntermediaryEvent(null);
                }}
                className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-[#c2094c] hover:shadow-md transition-all group"
              >
                <span className="font-bold text-slate-900 group-hover:text-[#c2094c] transition-colors">Go to Area</span>
                <ArrowRight size={18} className="text-stone-400 group-hover:text-[#c2094c] transition-colors" />
              </button>
              
              <button
                  onClick={() => {
                    if (intermediaryEvent.type === 'prayer') setEditingPrayerId(intermediaryEvent.id);
                    else if (intermediaryEvent.type === 'note') setEditingNoteId(intermediaryEvent.id);
                    else if (intermediaryEvent.type === 'verse') {
                      if (intermediaryEvent.version === 'FAITH_GUIDE') setEditingGuideId(intermediaryEvent.id);
                      else setEditingVerseId(intermediaryEvent.id);
                    }
                    else if (intermediaryEvent.type === 'prompt') setEditingPromptId(intermediaryEvent.id);
                    setIntermediaryEvent(null);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-[#c2094c] hover:shadow-md transition-all group"
                >
                <span className="font-bold text-slate-900 group-hover:text-[#c2094c] transition-colors">Edit in Timeline</span>
                <Edit size={18} className="text-stone-400 group-hover:text-[#c2094c] transition-colors" />
              </button>
            </div>
            <div className="p-4 bg-white border-t border-stone-100">
              <button
                onClick={() => setIntermediaryEvent(null)}
                className="w-full py-3 text-stone-500 font-bold uppercase tracking-widest text-xs hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Edit Modals */}
        <FaithVerseEditModal
          isOpen={!!editingVerseId}
          onClose={() => setEditingVerseId(null)}
          verse={
            (() => {
              if (!editingVerseId) return null;
              const event = events.find(e => e.id === editingVerseId);
              if (event?.source === 'saved') return savedVerses.find(v => v.id === editingVerseId) || null;
              return faithVerses.find(v => v.id === editingVerseId) || null;
            })()
          }
          onUpdate={(v, sourceSection) => { 
            const event = events.find(e => e.id === v.id);
            if (event?.source === 'saved') {
              saveSavedVerse(v, sourceSection);
            } else {
              saveFaithVerse(v, sourceSection);
            }
            handleCollectionsUpdate(v.collections);
            setEvents(prev => prev.map(e => e.id === v.id ? { ...e, description: v.text, collections: v.collections } : e));
            setEditingVerseId(null); 
          }}
          onDelete={(id) => {
            const event = events.find(e => e.id === id);
            if (event?.source === 'saved') deleteSavedVerse(id);
            else deleteFaithVerse(id);
            setEvents(prev => prev.filter(e => e.id !== id));
            setEditingVerseId(null);
          }}
          availableCollections={timelineCollections}
          sourceSection="timeline"
        />
        <PrayerEditModal
          isOpen={!!editingPrayerId}
          onClose={() => setEditingPrayerId(null)}
          prayer={prayers.find(p => p.id === editingPrayerId) || null}
          onUpdate={(p, sourceSection) => { 
            savePrayer(p, sourceSection);
            handleCollectionsUpdate(p.collections);
            setEvents(prev => prev.map(e => e.id === p.id ? { ...e, description: p.text, collections: p.collections } : e));
            setEditingPrayerId(null); 
          }}
          onDelete={(id) => {
            removePrayer(id);
            setEvents(prev => prev.filter(e => e.id !== id));
            setEditingPrayerId(null);
          }}
          availableCollections={timelineCollections}
          sourceSection="timeline"
        />
        <SermonNoteEditModal
          isOpen={!!editingNoteId}
          onClose={() => setEditingNoteId(null)}
          note={notes.find(n => n.id === editingNoteId) || null}
          onUpdate={(n, sourceSection) => { 
            saveNote(n, sourceSection);
            handleCollectionsUpdate(n.collections);
            setEvents(prev => prev.map(e => e.id === n.id ? { ...e, description: n.notes, collections: n.collections } : e));
            setEditingNoteId(null); 
          }}
          onDelete={(id) => {
            removeNote(id);
            setEvents(prev => prev.filter(e => e.id !== id));
            setEditingNoteId(null);
          }}
          availableCollections={timelineCollections}
          sourceSection="timeline"
        />
        <PromptEditModal
          isOpen={!!editingPromptId}
          onClose={() => setEditingPromptId(null)}
          prompt={prompts.find(p => p.id === editingPromptId) || null}
          onUpdate={(p, sourceSection) => { 
            savePrompt(p, sourceSection);
            handleCollectionsUpdate(p.collections);
            setEvents(prev => prev.map(e => e.id === p.id ? { ...e, description: p.text, collections: p.collections } : e));
            setEditingPromptId(null); 
          }}
          onDelete={(id) => {
            removePrompt(id);
            setEvents(prev => prev.filter(e => e.id !== id));
            setEditingPromptId(null);
          }}
          availableCollections={timelineCollections}
          sourceSection="timeline"
        />
        <StudyGuideModal
          isOpen={!!editingGuideId}
          onClose={() => setEditingGuideId(null)}
          verse={savedVerses.find(v => v.id === editingGuideId) || null}
          onUpdateNote={(id, note) => {
            const verse = savedVerses.find(v => v.id === id);
            if (verse) saveSavedVerse({ ...verse, note }, "timeline");
            setEvents(prev => prev.map(e => e.id === id ? { ...e, note } : e));
          }}
          onUpdateCollections={(collections, sourceSection) => {
            if (!editingGuideId) return;
            const verse = savedVerses.find(v => v.id === editingGuideId);
            if (verse) saveSavedVerse({ ...verse, collections }, sourceSection);
            setEvents(prev => prev.map(e => e.id === editingGuideId ? { ...e, collections } : e));
          }}
          onDelete={(id) => {
            deleteSavedVerse(id);
            setEvents(prev => prev.filter(e => e.id !== id));
            setEditingGuideId(null);
          }}
          availableCollections={timelineCollections}
          sourceSection="timeline"
        />
    </div>
  );
}

