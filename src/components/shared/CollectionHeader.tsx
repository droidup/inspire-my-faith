import React from 'react';
import { Library } from 'lucide-react';

export interface CollectionHeaderProps {
  title: string;
  count: number;
  countLabel?: string;
}

export default function CollectionHeader({
  title,
  count,
  countLabel = "COLLECTION"
}: CollectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Library className="text-[#c2094c]" size={28} />
          {title}
        </h1>
        <p className="text-stone-400 mt-1 font-bold uppercase tracking-widest text-[11px]">
          {count} {countLabel}{count === 1 ? '' : 'S'}
        </p>
      </div>
    </div>
  );
}
