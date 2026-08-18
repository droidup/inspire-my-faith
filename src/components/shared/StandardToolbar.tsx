import React from 'react';
import { Search, X } from 'lucide-react';

export interface StandardToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export default function StandardToolbar({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Search...",
  children
}: StandardToolbarProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-2 sm:p-3 shadow-sm mb-8 sticky top-0 z-40">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between w-full sm:min-h-[44px]">
        
        <div className="flex-1 w-full max-w-full sm:max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-10 py-2 text-sm focus:outline-none focus:border-[#c2094c] focus:ring-1 focus:ring-[#c2094c]/20 transition-all"
          />
          {searchQuery !== '' && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto mt-1 sm:mt-0 flex-wrap">
          {children}
        </div>
        
      </div>
    </div>
  );
}
