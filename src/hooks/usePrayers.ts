import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface Prayer {
  id: string;
  title: string;
  text: string;
  answered: boolean;
  timestamp: number;
  collections?: string[];
  isPinned?: boolean;
  reflection?: string;
}

const LOCAL_STORAGE_KEY = 'imf_prayers';

export function usePrayers() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Load from local storage
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          setPrayers(JSON.parse(local));
        } else {
          setPrayers([]);
        }
      } catch (e) {
        setPrayers([]);
      }
      return;
    }

    let isMounted = true;
    const fetchPrayers = async () => {
      try {
        const res = await fetch(`/api/get_prayers.php?userId=${user.uid}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setPrayers(data.data.map((p: any) => ({
            ...p,
            collections: p.collections || []
          })));
        }
      } catch (e) {
        console.error("Failed to fetch prayers", e);
      }
    };
    
    fetchPrayers();
    return () => { isMounted = false; };
  }, [user, loading]);

  const savePrayer = async (prayer: Prayer, sourceSection: string = 'soul_search') => {
    if (!user) {
      // Save to local storage
      setPrayers(prev => {
        const existing = prev.findIndex(p => p.id === prayer.id);
        let newPrayers;
        if (existing >= 0) {
          newPrayers = [...prev];
          newPrayers[existing] = prayer;
        } else {
          newPrayers = [prayer, ...prev].sort((a, b) => b.timestamp - a.timestamp);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPrayers));
        return newPrayers;
      });
      return;
    }

    try {
      await fetch('/api/save_prayer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, prayer, sourceSection })
      });
      
      const res = await fetch(`/api/get_prayers.php?userId=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setPrayers(data.data.map((p: any) => ({
          ...p,
          collections: p.collections || []
        })));
      }
    } catch (e) {
      console.error("Failed to save prayer", e);
    }
  };

  const removePrayer = async (prayerId: string) => {
    if (!user) {
      // Remove from local storage
      setPrayers(prev => {
        const newPrayers = prev.filter(p => p.id !== prayerId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPrayers));
        return newPrayers;
      });
      return;
    }

    try {
      await fetch(`/api/delete_prayer.php?prayerId=${prayerId}&userId=${user.uid}`, {
        method: 'DELETE'
      });
      setPrayers(prev => prev.filter(p => p.id !== prayerId));
    } catch (e) {
      console.error("Failed to remove prayer", e);
    }
  };

  const toggleAnswered = async (prayer: Prayer) => {
    const updated = { ...prayer, answered: !prayer.answered };
    await savePrayer(updated);
  };

  const togglePrayerPin = (prayer: Prayer) => {
    savePrayer({ ...prayer, isPinned: !prayer.isPinned });
  };

  const togglePrayerCollection = async (prayer: Prayer, collectionName: string) => {
    let newCollections = prayer.collections || [];
    if (newCollections.includes(collectionName)) {
      newCollections = newCollections.filter(c => c !== collectionName);
    } else {
      newCollections = [...newCollections, collectionName];
    }
    const updated = { ...prayer, collections: newCollections };
    await savePrayer(updated);
  };

  const renameCollectionInItems = (oldName: string, newName: string) => {
    setPrayers(prev => prev.map(p => {
      if (p.collections && p.collections.includes(oldName)) {
        return {
          ...p,
          collections: p.collections.map(c => c === oldName ? newName : c)
        };
      }
      return p;
    }));
  };

  return { prayers, loading, savePrayer, removePrayer, toggleAnswered, togglePrayerPin, togglePrayerCollection, renameCollectionInItems };
}
