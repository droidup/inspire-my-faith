import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface FaithEvent {
  id: string;
  eventType: string; // 'prayer_answered', 'plan_completed', 'custom'
  title: string;
  description: string;
  timestamp: number;
}

export function useFaithEvents() {
  const [events, setEvents] = useState<FaithEvent[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/user_faith_events.php?userId=${user.uid}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setEvents(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch faith events", e);
      }
    };
    
    fetchEvents();
    return () => { isMounted = false; };
  }, [user]);

  const saveEvent = async (event: FaithEvent) => {
    if (!user) return;
    try {
      await fetch('/api/user_faith_events.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, event })
      });
      setEvents(prev => {
        const existing = prev.findIndex(e => e.id === event.id);
        if (existing >= 0) {
          const newEvents = [...prev];
          newEvents[existing] = event;
          return newEvents;
        }
        return [event, ...prev].sort((a, b) => b.timestamp - a.timestamp);
      });
    } catch (e) {
      console.error("Failed to save event", e);
    }
  };

  const removeEvent = async (eventId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/user_faith_events.php?eventId=${eventId}&userId=${user.uid}`, {
        method: 'DELETE'
      });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (e) {
      console.error("Failed to remove event", e);
    }
  };

  return { events, saveEvent, removeEvent };
}
