import React, { useState, useEffect } from 'react';
import { X, Trash2, Compass } from 'lucide-react';
import { Prompt } from '../hooks/useSavedPrompts';
import { Prompt as SavedPrompt } from '../hooks/useSavedPrompts';
import FolderDropdown from './shared/FolderDropdown';
import RichTextEditor from './RichTextEditor';

interface PromptEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: SavedPrompt | null;
  onUpdate: (prompt: SavedPrompt, sourceSection?: string) => void;
  onDelete?: (id: string) => void;
  availableCollections?: string[];
  sourceSection?: string;
}

export default function PromptEditModal({
  isOpen,
  onClose,
  prompt,
  onUpdate,
  onDelete,
  availableCollections = [],
  sourceSection,
}: PromptEditModalProps) {
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'prompt' | 'thoughts'>('prompt');

  useEffect(() => {
    if (prompt) {
      const filteredCollections = sourceSection 
        ? (prompt.collections || []).filter(c => availableCollections.includes(c))
        : prompt.collections || [];

      setEditingPrompt({ ...prompt, collections: filteredCollections });
    }
  }, [prompt, sourceSection, availableCollections]);

  if (!isOpen || !editingPrompt) return null;

  const handleSaveAndClose = () => {
    onUpdate(editingPrompt, sourceSection);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this prompt?')) {
      onDelete(editingPrompt.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-900">Faith Builder</h3>
              <p className="text-xs text-stone-500 font-medium">Local Browser Storage</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Prompt">
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={handleSaveAndClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-white z-[60] relative">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveModalTab('prompt')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeModalTab === 'prompt' ? 'bg-[#c2094c] text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
            >
              Prompt
            </button>
            <button
              onClick={() => setActiveModalTab('thoughts')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeModalTab === 'thoughts' ? 'bg-[#c2094c] text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
            >
              Your Thoughts
            </button>
          </div>
          <div className="flex items-center">
            <FolderDropdown 
              availableFolders={availableCollections}
              selectedFolders={editingPrompt.collections || []}
              onChange={(folders) => setEditingPrompt({ ...editingPrompt, collections: folders })}
              label="Collections"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#faf9f8] min-h-[400px] flex flex-col">
          {activeModalTab === 'prompt' ? (
            <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col gap-4 flex-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Title</label>
                <input
                  type="text"
                  value={editingPrompt.title}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, title: e.target.value })}
                  className="w-full text-lg font-bold text-[#c2094c] border-none outline-none placeholder:text-stone-300 focus:ring-0 p-0"
                  placeholder="Prompt Title..."
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Prompt Details</label>
                <div className="w-full flex-1 min-h-[200px] text-stone-600 leading-relaxed overflow-y-auto whitespace-pre-wrap">
                  {editingPrompt.text}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Your Thoughts</label>
              <div className="flex-1 -mx-5 -mb-5 border-t border-stone-100">
                <RichTextEditor
                  value={editingPrompt.reflection || ''}
                  onChange={(content) => setEditingPrompt({ ...editingPrompt, reflection: content })}
                  placeholder="Reflect on this prompt..."
                />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 sm:p-6 border-t border-stone-100 bg-white flex justify-end shrink-0 gap-3">
           <button onClick={handleSaveAndClose} className="px-6 py-2.5 bg-[#c2094c] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#a0073e] transition-colors shadow-sm">
             Save Changes
           </button>
        </div>
      </div>
    </div>
  );
}
