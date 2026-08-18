import { useMemo } from 'react';
import { useSermonNotes } from './useSermonNotes';
import { TimelineEvent } from './useFaithTimeline';

export function useFaithDiary() {
  const { notes, saveNote, removeNote } = useSermonNotes();

  const events: TimelineEvent[] = useMemo(() => {
    return notes.map(note => ({
      id: note.id,
      type: 'note',
      title: note.title || 'Untitled Note',
      description: note.text || '',
      collections: note.collections || [],
      timestamp: note.timestamp,
    }));
  }, [notes]);

  const setEvents = () => {};

  return { 
    events, 
    setEvents, 
    loading: false,
    saveNote,
    removeNote
  };
}
