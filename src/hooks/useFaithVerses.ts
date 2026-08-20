import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface SavedVerse {
  id: string; // unique string e.g., 'Matthew-2-1-IMF'
  bookName: string;
  chapter: number;
  verseNum: number;
  text: string;
  version: string;
  note: string;
  savedAt: number;
  collections?: string[];
  isPinned?: boolean;
  isMemorized?: boolean;
}

export function useFaithVerses() {
  const [faithVerses, setFaithVerses] = useState<SavedVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load from local storage initially or when logged out
  useEffect(() => {
    if (!user) {
      const loaded = localStorage.getItem('imf_faith_verses');
      if (loaded) {
        try {
          setFaithVerses(JSON.parse(loaded));
        } catch (e) {
          console.error('Failed to parse saved verses');
        }
      } else {
        setFaithVerses([]);
      }
      setLoading(false);
    }
  }, [user]);

  // Load and sync from MySQL when logged in
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    const fetchVerses = async () => {
      try {
        const res = await fetch(`/api/get_faith_verses.php?userId=${user.uid}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setFaithVerses(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch verses", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchVerses();
    return () => { isMounted = false; };
  }, [user]);

  const saveFaithVerse = async (verse: SavedVerse, sourceSection: string = 'faith_verses') => {
    if (!user) return;
    try {
      await fetch('/api/save_faith_verse.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, verse, sourceSection })
      });
      
      // Reload after sync
      const res = await fetch(`/api/get_faith_verses.php?userId=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setFaithVerses(data.data);
      }
    } catch (e) {
      console.error("Failed to save faith verse", e);
    }
  };

  const syncLocalToCloud = async (localVerses: SavedVerse[]) => {
     if (!user || localVerses.length === 0) return;
     for (const verse of localVerses) {
       try {
         await fetch('/api/save_faith_verse.php', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ userId: user.uid, verse })
         });
       } catch (e) {
         console.error("Failed to sync verse", e);
       }
     }
     localStorage.removeItem('imf_faith_verses'); // Clear local once synced
     
     // Reload after sync
     const res = await fetch(`/api/get_faith_verses.php?userId=${user.uid}`);
     const data = await res.json();
     if (data.success) {
       setFaithVerses(data.data);
     }
  }
  
  // Sync local verses to cloud on login
  useEffect(() => {
    if (user) {
      const loaded = localStorage.getItem('imf_faith_verses');
      if (loaded) {
        try {
           const localVerses = JSON.parse(loaded);
           syncLocalToCloud(localVerses);
        } catch(e) {}
      }
    }
  }, [user])

  const saveVerse = async (verse: SavedVerse | Omit<SavedVerse, 'savedAt' | 'note'>) => {
    let newVerse = verse as SavedVerse;
    
    // First, grab the existing verse if it's already saved, to preserve notes and collections
    const existing = faithVerses.find(v => v.id === newVerse.id);
    
    if (!('savedAt' in verse)) {
      newVerse = { ...verse, note: existing?.note || '', savedAt: Date.now() };
    }
    
    // Always preserve existing collections if newVerse doesn't explicitly provide them
    if (!newVerse.collections && existing?.collections) {
      newVerse.collections = existing.collections;
    }
    
    // Also preserve note if not explicitly provided but exists
    if (!newVerse.note && existing?.note) {
      newVerse.note = existing.note;
    }

    if (user) {
      // Optimistic update
      setFaithVerses(prev => {
        const existing = prev.findIndex(v => v.id === newVerse.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newVerse;
          return updated.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return b.savedAt - a.savedAt;
          });
        }
        return [newVerse, ...prev].sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return b.savedAt - a.savedAt;
        });
      });
      try {
        await fetch('/api/save_faith_verse.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, verse: newVerse })
        });
      } catch (error) {
        console.error("Error saving verse to MySQL:", error);
      }
    } else {
      setFaithVerses(prev => {
        const existing = prev.findIndex(v => v.id === newVerse.id);
        let updated;
        if (existing >= 0) {
          updated = [...prev];
          updated[existing] = newVerse;
        } else {
          updated = [newVerse, ...prev];
        }
        updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return b.savedAt - a.savedAt;
        });
        localStorage.setItem('imf_faith_verses', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const updateNote = async (id: string, note: string) => {
    if (user) {
      // Optimistic update
      setFaithVerses(prev => prev.map(v => v.id === id ? { ...v, note } : v));
      try {
        await fetch(`/api/update_verse_note.php?verseId=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, note })
        });
      } catch (error) {
        console.error("Error updating note in MySQL:", error);
      }
    } else {
      setFaithVerses(prev => {
        const updated = prev.map(v => v.id === id ? { ...v, note } : v);
        localStorage.setItem('imf_faith_verses', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const removeVerse = async (id: string) => {
    if (user) {
       // Optimistic update
      setFaithVerses(prev => prev.filter(v => v.id !== id));
      try {
        await fetch(`/api/delete_faith_verse.php?verseId=${id}&userId=${user.uid}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error("Error removing verse from MySQL:", error);
      }
    } else {
      setFaithVerses(prev => {
        const updated = prev.filter(v => v.id !== id);
        localStorage.setItem('imf_faith_verses', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const isVerseSaved = (id: string) => {
    return faithVerses.some(v => v.id === id);
  };

  const getSavedVerse = (id: string) => {
    return faithVerses.find(v => v.id === id) || null;
  };

  const toggleVersePin = (verse: SavedVerse) => {
    saveVerse({ ...verse, isPinned: !verse.isPinned });
  };

  const toggleVerseMemorized = (verse: SavedVerse) => {
    saveVerse({ ...verse, isMemorized: !verse.isMemorized });
  };

  const toggleVerseCollection = async (verse: SavedVerse, collectionName: string) => {
    let newCollections = verse.collections || [];
    if (newCollections.includes(collectionName)) {
      newCollections = newCollections.filter(c => c !== collectionName);
    } else {
      newCollections = [...newCollections, collectionName];
    }
    await saveVerse({ ...verse, collections: newCollections });
  };

  const updateCollections = async (id: string, collections: string[]) => {
    const verse = faithVerses.find(v => v.id === id);
    if (!verse) return;
    await saveVerse({ ...verse, collections });
  };

  const renameCollectionInItems = (oldName: string, newName: string) => {
    setFaithVerses(prev => prev.map(v => {
      if (v.collections && v.collections.includes(oldName)) {
        return {
          ...v,
          collections: v.collections.map(c => c === oldName ? newName : c)
        };
      }
      return v;
    }));
  };

  return { faithVerses, saveVerse, updateNote, removeVerse, isVerseSaved, getSavedVerse, toggleVersePin, toggleVerseMemorized, toggleVerseCollection, updateCollections, renameCollectionInItems, loading };
}
