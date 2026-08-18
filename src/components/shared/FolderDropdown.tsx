import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, Folder } from 'lucide-react';

interface FolderDropdownProps {
  availableFolders: string[];
  selectedFolders: string[];
  onChange: (folders: string[]) => void;
  label?: string;
}

export default function FolderDropdown({ 
  availableFolders, 
  selectedFolders, 
  onChange,
  label = "Folders"
}: FolderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredFolders = availableFolders.filter(f => 
    f.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const showAddOption = searchTerm.trim().length > 0 && 
    !availableFolders.some(f => f.toLowerCase() === searchTerm.trim().toLowerCase());

  const toggleFolder = (folder: string) => {
    if (selectedFolders.includes(folder)) {
      onChange(selectedFolders.filter(f => f !== folder));
    } else {
      onChange([...selectedFolders, folder]);
    }
  };

  const handleAddNew = () => {
    if (searchTerm.trim()) {
      const newFolder = searchTerm.trim();
      onChange([...selectedFolders, newFolder]);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-between gap-2 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors w-full sm:w-auto min-w-[200px] text-left"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 leading-tight">{label}</span>
          <div className="flex items-center gap-2">
            <Folder size={14} className="text-[#c2094c] shrink-0" />
            <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px] leading-tight">
              {selectedFolders.length === 0 
                ? "Select..." 
                : selectedFolders.length <= 2 
                  ? selectedFolders.join(", ") 
                  : `${selectedFolders.length} Selected`}
            </span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-[240px] bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b border-stone-100 bg-stone-50/50">
            <input
              type="text"
              placeholder="Search or create..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c2094c] transition-colors"
              autoFocus
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredFolders.length > 0 ? (
              filteredFolders.map(folder => {
                const isSelected = selectedFolders.includes(folder);
                return (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => toggleFolder(folder)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors text-left ${
                      isSelected 
                        ? 'bg-pink-50 text-[#c2094c] font-semibold' 
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium'
                    }`}
                  >
                    <span className="truncate pr-4">{folder}</span>
                    {isSelected && <Check size={16} className="text-[#c2094c] shrink-0" />}
                  </button>
                );
              })
            ) : (
              !showAddOption && (
                <div className="px-4 py-3 text-sm text-stone-400 text-center">
                  No folders found
                </div>
              )
            )}
            
            {showAddOption && (
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#c2094c] font-semibold hover:bg-pink-50 transition-colors border-t border-stone-100 text-left"
              >
                <Plus size={16} className="shrink-0" />
                <span className="truncate">Create "{searchTerm}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
