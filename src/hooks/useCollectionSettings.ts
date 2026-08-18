import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface CollectionSettings {
  color: string;
  icon: string;
  description: string;
  isPinned: boolean;
  createdAt: string;
}

export function useCollectionSettings(sectionType: string) {
  const [collectionSettings, setCollectionSettings] = useState<Record<string, CollectionSettings>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCollectionSettings({});
      return;
    }

    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/user/collections/settings/${sectionType}/${user.uid}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setCollectionSettings(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch collection settings", e);
      }
    };
    
    fetchSettings();
    return () => { isMounted = false; };
  }, [user, sectionType]);

  const updateCollectionSetting = async (collectionName: string, settings: Partial<CollectionSettings>) => {
    // Optimistic update
    const current = collectionSettings[collectionName] || { color: '#c2094c', icon: 'FolderOpen', description: '', isPinned: false, createdAt: new Date().toISOString() };
    const nextSettings = { ...current, ...settings };
    setCollectionSettings(prev => ({ ...prev, [collectionName]: nextSettings }));

    if (!user) return;
    try {
      await fetch('/api/user/collections/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, sectionType, collectionName, settings: nextSettings })
      });
    } catch (e) {
      console.error("Failed to update collection settings", e);
    }
  };

  const togglePinCollection = (collectionName: string) => {
    const current = collectionSettings[collectionName] || { color: '#c2094c', icon: 'FolderOpen', description: '', isPinned: false, createdAt: new Date().toISOString() };
    updateCollectionSetting(collectionName, { isPinned: !current.isPinned });
  };

  const renameCollection = async (oldName: string, newName: string) => {
    if (!user || oldName === newName || !newName.trim()) return false;
    try {
      const res = await fetch('/api/user/collections/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, sectionType, oldName, newName })
      });
      const data = await res.json();
      if (data.success) {
        setCollectionSettings(prev => {
          const next = { ...prev };
          if (next[oldName]) {
            next[newName] = next[oldName];
            delete next[oldName];
          }
          return next;
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to rename collection", e);
      return false;
    }
  };

  const deleteCollection = async (collectionName: string) => {
    if (!user) return false;
    try {
      const res = await fetch('/api/user/collections/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, sectionType, collectionName })
      });
      const data = await res.json();
      if (data.success) {
        setCollectionSettings(prev => {
          const next = { ...prev };
          delete next[collectionName];
          return next;
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to delete collection", e);
      return false;
    }
  };

  return { collectionSettings, updateCollectionSetting, togglePinCollection, renameCollection, deleteCollection };
}
