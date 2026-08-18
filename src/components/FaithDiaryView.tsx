import React from 'react';
import FaithAreaLayout from './shared/FaithAreaLayout';
import { useFaithDiary } from '../hooks/useFaithDiary';
import { PenTool } from 'lucide-react';

interface FaithDiaryViewProps {
  onNavigate?: (view: string, data?: any) => void;
  onEditEvent?: (id: string) => void;
  primaryAction?: { label: string; icon: any; onClick: () => void };
  isEmbedded?: boolean;
  onGenerateSummary?: () => void;
}

export default function FaithDiaryView({ onNavigate, onEditEvent, primaryAction, isEmbedded, onGenerateSummary }: FaithDiaryViewProps) {
  const { events, loading, setEvents, removeNote } = useFaithDiary();
  
  const handleDelete = async (id: string) => {
    await removeNote(id);
  };

  return (
    <FaithAreaLayout
      title="Faith Diary"
      subtitle="Reflect on sermons, teachings, and your personal thoughts."
      icon={PenTool}
      iconColor="#64748b"
      events={events}
      setEvents={setEvents}
      loading={loading}
      sectionType="note"
      onNavigate={onNavigate}
      onDeleteEvent={handleDelete}
      onEditEvent={onEditEvent}
      primaryAction={primaryAction}
      isEmbedded={isEmbedded}
      onGenerateSummary={onGenerateSummary}
    />
  );
}
