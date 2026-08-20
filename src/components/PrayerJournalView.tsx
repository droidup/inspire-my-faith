import React from 'react';
import FaithAreaLayout from './shared/FaithAreaLayout';
import { usePrayerJournal } from '../hooks/usePrayerJournal';
import { Heart } from 'lucide-react';

interface PrayerJournalViewProps {
  onNavigate?: (view: string, data?: any) => void;
  onEditEvent?: (id: string) => void;
  isEmbedded?: boolean;
  forcedTab?: 'timeline' | 'calendar' | 'collections';
  hideTabs?: boolean;
  hideViewToggle?: boolean;
}

export default function PrayerJournalView({ onNavigate, onEditEvent, isEmbedded, forcedTab, hideTabs, hideViewToggle }: PrayerJournalViewProps) {
  const { events, loading, setEvents, removePrayer, renameCollectionInItems } = usePrayerJournal();
  
  const handleDelete = async (id: string) => {
    await removePrayer(id);
  };

  return (
    <FaithAreaLayout
      title="Prayer Journal"
      subtitle="Your conversations with God, organized and easily accessible."
      icon={Heart}
      iconColor="#c2094c"
      events={events}
      setEvents={setEvents}
      loading={loading}
      sectionType="prayer"
      onNavigate={onNavigate}
      onDeleteEvent={handleDelete}
      onEditEvent={onEditEvent}
      onCollectionRenamed={renameCollectionInItems}
      isEmbedded={isEmbedded}
      forcedTab={forcedTab}
      hideTabs={hideTabs}
      hideViewToggle={hideViewToggle}
    />
  );
}
