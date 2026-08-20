import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface Prompt {
  id: string;
  title: string;
  text: string;
  answered: boolean;
  timestamp: number;
  collections?: string[];
  isPinned?: boolean;
  reflection?: string;
}

const LOCAL_STORAGE_KEY = 'imf_saved_prompts';

export function useSavedPrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Load from local storage
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          setPrompts(JSON.parse(local));
        } else {
          setPrompts([]);
        }
      } catch (e) {
        setPrompts([]);
      }
      return;
    }

    let isMounted = true;
    const fetchPrompts = async () => {
      try {
        const res = await fetch(`/api/get_saved_prompts.php?userId=${user.uid}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setPrompts(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch prompts", e);
      }
    };
    
    fetchPrompts();
    return () => { isMounted = false; };
  }, [user, loading]);

  const savePrompt = async (prompt: Prompt, sourceSection: string = 'prompt_builder') => {
    if (!user) {
      // Save to local storage
      setPrompts(prev => {
        const existing = prev.findIndex(p => p.id === prompt.id);
        let newPrompts;
        if (existing >= 0) {
          newPrompts = [...prev];
          newPrompts[existing] = prompt;
        } else {
          newPrompts = [prompt, ...prev].sort((a, b) => b.timestamp - a.timestamp);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPrompts));
        return newPrompts;
      });
      return;
    }

    try {
      await fetch('/api/save_saved_prompt.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, prompt, sourceSection })
      });
      
      const res = await fetch(`/api/get_saved_prompts.php?userId=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setPrompts(data.data);
      }
    } catch (e) {
      console.error("Failed to save prompt", e);
    }
  };

  const removePrompt = async (promptId: string) => {
    if (!user) {
      // Remove from local storage
      setPrompts(prev => {
        const newPrompts = prev.filter(p => p.id !== promptId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPrompts));
        return newPrompts;
      });
      return;
    }

    try {
      await fetch(`/api/delete_saved_prompt.php?promptId=${promptId}&userId=${user.uid}`, {
        method: 'DELETE'
      });
      setPrompts(prev => prev.filter(p => p.id !== promptId));
    } catch (e) {
      console.error("Failed to remove prompt", e);
    }
  };

  const toggleAnswered = async (prompt: Prompt) => {
    const updated = { ...prompt, isPinned: !prompt.isPinned };
    await savePrompt(updated);
  };

  const togglePromptPin = (prompt: Prompt) => {
    savePrompt({ ...prompt, isPinned: !prompt.isPinned });
  };

  const togglePromptCollection = async (prompt: Prompt, collectionName: string) => {
    let newCollections = prompt.collections || [];
    if (newCollections.includes(collectionName)) {
      newCollections = newCollections.filter(c => c !== collectionName);
    } else {
      newCollections = [...newCollections, collectionName];
    }
    const updated = { ...prompt, collections: newCollections };
    await savePrompt(updated);
  };

  const renameCollectionInItems = (oldName: string, newName: string) => {
    setPrompts(prev => prev.map(p => {
      if (p.collections && p.collections.includes(oldName)) {
        return {
          ...p,
          collections: p.collections.map(c => c === oldName ? newName : c)
        };
      }
      return p;
    }));
  };

  return { prompts, loading, savePrompt, removePrompt, toggleAnswered, togglePromptPin, togglePromptCollection, renameCollectionInItems };
}
