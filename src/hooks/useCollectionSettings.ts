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
        const res = await fetch(`/api/collection_settings.php?sectionType=${sectionType}&userId=${user.uid}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setCollectionSettings(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch collection settings", e);
      }
    };
    
    fetchSettings();

    const handleSync = (e: any) => {
      if (e.detail.sectionType === sectionType) {
        setCollectionSettings(e.detail.settings);
      }
    };
    window.addEventListener('collectionSettingsSync', handleSync);

    return () => { 
      isMounted = false; 
      window.removeEventListener('collectionSettingsSync', handleSync);
    };
  }, [user, sectionType]);

  const updateCollectionSetting = async (collectionName: string, settings: Partial<CollectionSettings>) => {
    // Optimistic update
    const current = collectionSettings[collectionName] || { color: '#c2094c', icon: 'FolderOpen', description: '', isPinned: false, createdAt: new Date().toISOString() };
    const nextSettings = { ...current, ...settings };
    setCollectionSettings(prev => {
      const next = { ...prev, [collectionName]: nextSettings };
      window.dispatchEvent(new CustomEvent('collectionSettingsSync', { detail: { sectionType, settings: next } }));
      return next;
    });

    if (!user) return;
    try {
      await fetch('/api/collection_settings.php', {
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

  const renameCollection = async (oldName: string, newName: string): Promise<{success: boolean, reason?: string}> => {
    if (!user) return { success: false, reason: "User not logged in" };
    if (oldName === newName) return { success: false, reason: "Name did not change" };
    if (!newName.trim()) return { success: false, reason: "New name is empty" };
    try {
      const res = await fetch('/api/rename_collection.php', {
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
          window.dispatchEvent(new CustomEvent('collectionSettingsSync', { detail: { sectionType, settings: next } }));
          return next;
        });
        return { success: true };
      }
      return { success: false, reason: data.message || "API returned false" };
    } catch (e: any) {
      console.error(e);
      return { success: false, reason: e.message || "Network error" };
    }
  };

  const deleteCollection = async (collectionName: string) => {
    if (!user) return false;
    try {
      const res = await fetch('/api/delete_collection.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, sectionType, collectionName })
      });
      const data = await res.json();
      if (data.success) {
        setCollectionSettings(prev => {
          const next = { ...prev };
          delete next[collectionName];
          window.dispatchEvent(new CustomEvent('collectionSettingsSync', { detail: { sectionType, settings: next } }));
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
