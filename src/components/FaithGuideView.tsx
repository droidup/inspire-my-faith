import React from 'react';
import FaithAreaLayout from './shared/FaithAreaLayout';
import { useFaithGuide } from '../hooks/useFaithGuide';
import { BookHeart } from 'lucide-react';

interface FaithGuideViewProps {
  onNavigate?: (view: string, data?: any) => void;
  onEditEvent?: (id: string) => void;
  isEmbedded?: boolean;
  forcedTab?: 'timeline' | 'collections' | 'calendar';
}

export default function FaithGuideView({ onNavigate, onEditEvent, isEmbedded, forcedTab }: FaithGuideViewProps) {
  const { events, loading, setEvents, removeVerse } = useFaithGuide();
  
  const handleDelete = async (id: string) => {
    await removeVerse(id);
  };

  return (
    <FaithAreaLayout
      title="Faith Guide"
      subtitle="Your saved verses, scriptures, and divine guidance."
      icon={BookHeart}
      iconColor="#c2094c" // Maybe a different color for Faith Guide? The user can customize this later.
      events={events}
      setEvents={setEvents}
      loading={loading}
      sectionType="verse"
      onNavigate={onNavigate}
      onEditEvent={onEditEvent}
      onDeleteEvent={handleDelete}
      isEmbedded={isEmbedded}
      forcedTab={forcedTab}
      hideTabs={true}
    />
  );
}
