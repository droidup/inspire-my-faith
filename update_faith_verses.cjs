const fs = require('fs');
let c = `import React, { useState } from 'react';
import FaithAreaLayout from './shared/FaithAreaLayout';
import { useFaithVerses } from '../hooks/useFaithVerses';
import { HeartHandshake, BookmarkPlus, Sparkles, X, Check, Copy, Loader2 } from 'lucide-react';
import VerseOfTheDayCard from './VerseOfTheDayCard';
import FaithVerseEditModal from './FaithVerseEditModal';

interface FaithVersesProps {
  onNavigate?: (view: string, data?: any) => void;
  onEditEvent?: (id: string) => void;
  isEmbedded?: boolean;
  forcedTab?: 'timeline' | 'collections';
}

export default function FaithVerses({ onNavigate, onEditEvent, isEmbedded, forcedTab }: FaithVersesProps) {
  const { faithVerses, loading, removeVerse, addVerse, updateVerse } = useFaithVerses();
  const [isDailyVerseSelected, setIsDailyVerseSelected] = useState(false);
  const [dailyVerseData, setDailyVerseData] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiCopied, setAiCopied] = useState(false);

  const setEventsDummy = () => {};

  const handleSaveDailyVerse = () => {
    if (!dailyVerseData) return;
    
    // Parse reference
    let bookName = 'Unknown';
    let chapter = 1;
    let verseNum = '1';
    
    const match = dailyVerseData.reference.match(/^(\\d?\\s*[a-zA-Z\\s]+)\\s+(\\d+):([\\d-]+)$/);
    if (match) {
      bookName = match[1].trim();
      chapter = parseInt(match[2], 10);
      verseNum = match[3];
    } else {
      const parts = dailyVerseData.reference.split(' ');
      if (parts.length >= 2) {
          const chapVerse = parts.pop();
          bookName = parts.join(' ');
          if (chapVerse && chapVerse.includes(':')) {
              const [c, v] = chapVerse.split(':');
              chapter = parseInt(c, 10);
              verseNum = v;
          }
      }
    }

    const newVerse = {
      id: crypto.randomUUID(),
      bookName,
      chapter,
      verseNum,
      text: dailyVerseData.text,
      version: 'DAILY_VERSE',
      note: dailyVerseData.make_it_happen || '',
      savedAt: Date.now(),
      isPinned: false,
      isMemorized: false,
      collections: []
    };
    
    setDailyVerseData(newVerse);
    setShowEditModal(true);
  };

  const handleSaveToTimeline = async (verse: any) => {
    await addVerse(verse);
    setIsDailyVerseSelected(false);
  };

  const handleDailyVerseSummary = async () => {
    if (!dailyVerseData) return;
    setShowAiModal(true);
    setAiLoading(true);
    setAiResponse('');
    setAiCopied(false);

    try {
      const res = await fetch('/api/verse-deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: dailyVerseData.text, reference: dailyVerseData.reference })
      });
      const data = await res.json();
      if (data.success) {
        setAiResponse(data.data);
      } else {
        setAiResponse('Failed to generate reflection. Please try again.');
      }
    } catch (e) {
      setAiResponse('Error connecting to AI service.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAi = () => {
    navigator.clipboard.writeText(aiResponse);
    setAiCopied(true);
    setTimeout(() => setAiCopied(false), 2000);
  };

  return (
    <>
      <FaithAreaLayout
        title="Faith Verses"
        subtitle="Your daily inspiration and curated library of scripture."
        icon={HeartHandshake}
        iconColor="#c2094c"
        events={faithVerses}
        setEvents={setEventsDummy}
        loading={loading}
        sectionType="faith_verses"
        onNavigate={onNavigate}
        onEditEvent={onEditEvent}
        onDeleteEvent={removeVerse}
        isEmbedded={isEmbedded}
        forcedTab={forcedTab}
        onGenerateSummary={isDailyVerseSelected ? handleDailyVerseSummary : undefined}
        heroContent={
          <VerseOfTheDayCard 
            variant="faith-verse" 
            isSelected={isDailyVerseSelected}
            onSelect={setIsDailyVerseSelected}
            onVerseLoaded={(v) => {
                if (!dailyVerseData || dailyVerseData.id === undefined) {
                    setDailyVerseData(v);
                }
            }}
          />
        }
        customToolbarActions={
          isDailyVerseSelected && (
            <button
              onClick={handleSaveDailyVerse}
              className="bg-[#c2094c] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#a1073e] transition-colors shadow-sm flex items-center gap-2 border-none outline-none focus:ring-2 focus:ring-[#c2094c]/50"
            >
              <BookmarkPlus size={16} /> Save Daily Verse
            </button>
          )
        }
      />

      <FaithVerseEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        verse={dailyVerseData?.id ? dailyVerseData : null}
        onUpdate={handleSaveToTimeline}
        onDelete={() => setShowEditModal(false)}
      />

      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#c2094c] shadow-sm">
                  <Sparkles size={16} />
                </div>
                <h3 className="font-serif text-lg font-bold text-slate-900">Deep Dive Reflection</h3>
              </div>
              <div className="flex items-center gap-2">
                {aiResponse && (
                  <button 
                    onClick={handleCopyAi}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-500 hover:text-slate-700 hover:bg-stone-100 transition-colors text-xs font-bold tracking-wide uppercase"
                  >
                    {aiCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {aiCopied ? 'Copied' : 'Copy'}
                  </button>
                )}
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="p-2 text-stone-400 hover:text-slate-600 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto">
              <div className="bg-rose-50/50 p-4 sm:p-6 rounded-2xl mb-8 border border-rose-100/50">
                <p className="font-serif text-lg text-slate-800 text-center leading-relaxed">
                  "{dailyVerseData?.text}"
                </p>
                <p className="text-center text-sm font-medium text-[#c2094c] mt-3 uppercase tracking-widest">
                  — {dailyVerseData?.reference}
                </p>
              </div>

              {aiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-stone-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#c2094c]" />
                  <p className="font-medium tracking-wide">Reflecting on the Word...</p>
                </div>
              ) : (
                <div className="prose prose-stone max-w-none text-slate-600 text-[15px] leading-[1.8]">
                  {aiResponse.split('\\n').map((paragraph, idx) => (
                    paragraph.trim() ? <p key={idx}>{paragraph}</p> : null
                  ))}
                </div>
              )}
            </div>

            {!aiLoading && (
              <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-6 py-2.5 bg-white border border-stone-200 text-slate-700 font-bold rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}
    </>
  );
}
`;
fs.writeFileSync('src/components/FaithVerses.tsx', c);
