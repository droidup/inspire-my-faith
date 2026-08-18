import { useMemo } from 'react';
import { useSavedVerses } from './useSavedVerses';
import { TimelineEvent } from './useFaithTimeline';

export function useFaithGuide() {
  const { savedVerses, removeVerse } = useSavedVerses();

  const events: TimelineEvent[] = useMemo(() => {
    return savedVerses.map(verse => ({
      id: verse.id,
      type: 'verse',
      title: `${verse.bookName} ${verse.chapter}:${verse.verseNum}`,
      description: verse.text || '',
      note: verse.note || '',
      collections: verse.collections || [],
      timestamp: verse.savedAt,
      version: 'FAITH_GUIDE',
    }));
  }, [savedVerses]);

  const setEvents = () => {};

  return { 
    events, 
    setEvents, 
    loading: false,
    removeVerse
  };
}
