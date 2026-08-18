import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface TimelineEvent {
  id: string;
  type: string; // 'prayer', 'note', 'verse', 'bookmark', 'custom', 'prayer_answered', 'plan_completed'
  title: string;
  description: string;
  collections?: string[];
  timestamp: number;
  note?: string;
  version?: string;
}

export function useFaithTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchTimeline = async () => {
      try {
        // Fetch both timeline events and saved verses
        const [timelineRes, versesRes] = await Promise.all([
          fetch(`/api/user/timeline/${user.uid}`),
          fetch(`/api/user/verses/${user.uid}`)
        ]);
        
        const timelineData = await timelineRes.json();
        const versesData = await versesRes.json();
        
        if (!isMounted) return;
        
        // Convert saved verses to TimelineEvent format
        const verseEvents: TimelineEvent[] = (versesData.success ? versesData.data : []).map((verse: any) => ({
          id: verse.id,
          type: 'verse',
          title: `${verse.bookName} ${verse.chapter}:${verse.verseNum}`,
          description: verse.text || '',
          collections: verse.collections || [],
          timestamp: verse.savedAt,
          note: verse.note || '',
          version: verse.version || 'BIBLE',
        }));
        
        // Merge timeline events with verse events
        const allEvents = [...(timelineData.success ? timelineData.data : []), ...verseEvents];
        
        // Remove duplicates (same id) and sort by timestamp
        const uniqueMap = new Map<string, TimelineEvent>();
        allEvents.forEach(event => {
          uniqueMap.set(event.id, event);
        });
        
        setEvents(Array.from(uniqueMap.values()).sort((a, b) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("Failed to fetch timeline", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchTimeline();
    return () => { isMounted = false; };
  }, [user]);

  return { events, loading, setEvents };
}
