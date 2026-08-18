import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, BrainCircuit } from 'lucide-react';
import { SavedVerse } from '../hooks/useSavedVerses';

export default function MemorizeModal({ verse, onClose }: { verse: SavedVerse, onClose: () => void }) {
  const [words, setWords] = useState<string[]>([]);
  const [hiddenIndices, setHiddenIndices] = useState<Set<number>>(new Set());
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Split by words, preserving punctuation if possible, but simplest is split by space
    const splitWords = verse.text.split(' ');
    setWords(splitWords);
    generateHiddenIndices(splitWords.length, difficulty);
  }, [verse, difficulty]);

  const generateHiddenIndices = (totalWords: number, level: 'easy' | 'medium' | 'hard') => {
    setRevealed(false);
    let percentage = 0.3;
    if (level === 'easy') percentage = 0.15;
    if (level === 'hard') percentage = 0.6;
    
    const numToHide = Math.max(1, Math.floor(totalWords * percentage));
    const newHidden = new Set<number>();
    
    // Pick random indices to hide
    while (newHidden.size < numToHide && newHidden.size < totalWords) {
      newHidden.add(Math.floor(Math.random() * totalWords));
    }
    setHiddenIndices(newHidden);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 text-[#c2094c] rounded-xl flex items-center justify-center">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Scripture Memory</h2>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{verse.bookName} {verse.chapter}:{verse.verseNum}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          
          <div className="flex justify-center mb-8">
            <div className="bg-stone-100 p-1 rounded-xl flex gap-1">
              {(['easy', 'medium', 'hard'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${difficulty === level ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#faf9f8] border border-stone-200 rounded-2xl p-8 sm:p-12 text-center mb-8 min-h-[250px] flex items-center justify-center">
            <p className="text-2xl sm:text-3xl font-serif leading-relaxed text-slate-800">
              {words.map((word, index) => {
                const isHidden = hiddenIndices.has(index) && !revealed;
                // Preserve punctuation if hiding
                const punctuationRegex = /[.,;!?]$/;
                const match = word.match(punctuationRegex);
                const punctuation = match ? match[0] : '';
                
                return (
                  <span key={index} className="inline-block mx-1">
                    {isHidden ? (
                      <span className="inline-block min-w-[50px] border-b-2 border-stone-300 text-transparent select-none bg-stone-200/50 rounded-sm">
                        {word.replace(punctuationRegex, '')}
                      </span>
                    ) : (
                      word.replace(punctuationRegex, '')
                    )}
                    {punctuation}
                  </span>
                );
              })}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => generateHiddenIndices(words.length, difficulty)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              <RefreshCw size={18} /> Refresh
            </button>
            <button
              onClick={() => setRevealed(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-[#c2094c] hover:bg-[#a0073e] transition-colors shadow-sm"
              disabled={revealed}
            >
              <Eye size={18} /> Reveal All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
