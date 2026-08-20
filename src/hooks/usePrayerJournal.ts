import { useMemo } from 'react';
import { usePrayers } from './usePrayers';
import { TimelineEvent } from './useFaithTimeline';

export function usePrayerJournal() {
  const { prayers, savePrayer, removePrayer, toggleAnswered, togglePrayerPin, renameCollectionInItems } = usePrayers();

  const events: TimelineEvent[] = useMemo(() => {
    return prayers.map(prayer => ({
      id: prayer.id,
      type: prayer.answered ? 'prayer_answered' : 'prayer',
      title: prayer.title || 'Untitled Prayer',
      description: prayer.text || '',
      collections: prayer.collections || [],
      timestamp: prayer.timestamp,
    }));
  }, [prayers]);

  const setEvents = () => {};

  return { 
    events, 
    setEvents, 
    loading: false,
    savePrayer,
    removePrayer,
    renameCollectionInItems
  };
}
