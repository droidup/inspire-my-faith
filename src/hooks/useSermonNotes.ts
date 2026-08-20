import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface SermonNote {
  id: string;
  title: string;
  speaker: string;
  date: string;
  text: string;
  timestamp: number;
  collections?: string[];
  isPinned?: boolean;
}

export function useSermonNotes() {
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }

    let isMounted = true;
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/get_sermon_notes.php?userId=${user.uid}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setNotes(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch sermon notes", e);
      }
    };
    
    fetchNotes();
    return () => { isMounted = false; };
  }, [user]);

  const saveNote = async (note: SermonNote, sourceSection: string = 'note') => {
    if (!user) return;
    try {
      await fetch('/api/save_sermon_note.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, note, sourceSection })
      });
      
      const res = await fetch(`/api/get_sermon_notes.php?userId=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setNotes(data.data);
      }
    } catch (e) {
      console.error("Failed to save note", e);
    }
  };

  const removeNote = async (noteId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/delete_sermon_note.php?noteId=${noteId}&userId=${user.uid}`, {
        method: 'DELETE'
      });
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (e) {
      console.error("Failed to remove sermon note", e);
    }
  };

  const toggleNotePin = (note: SermonNote) => {
    saveNote({ ...note, isPinned: !note.isPinned });
  };

  const toggleNoteCollection = async (note: SermonNote, collectionName: string) => {
    if (!user) return;
    try {
      let newCollections = note.collections || [];
      if (newCollections.includes(collectionName)) {
        newCollections = newCollections.filter(c => c !== collectionName);
      } else {
        newCollections = [...newCollections, collectionName];
      }
      
      const updatedNote = { ...note, collections: newCollections, timestamp: Date.now() };
      saveNote(updatedNote);
    } catch (e) {
      console.error("Failed to update note collection", e);
    }
  };

  const renameCollectionInItems = (oldName: string, newName: string) => {
    setNotes(prev => prev.map(n => {
      if (n.collections && n.collections.includes(oldName)) {
        return {
          ...n,
          collections: n.collections.map(c => c === oldName ? newName : c)
        };
      }
      return n;
    }));
  };

  return { notes, saveNote, removeNote, toggleNotePin, toggleNoteCollection, renameCollectionInItems };
}
