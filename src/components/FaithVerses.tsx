import React, { useState, useEffect } from 'react';
import FaithAreaLayout from './shared/FaithAreaLayout';
import { useFaithVerses } from '../hooks/useFaithVerses';
import { HeartHandshake, BookmarkPlus, Sparkles, X, Check, Copy, Loader2 } from 'lucide-react';
import VerseOfTheDayCard from './VerseOfTheDayCard';
import FaithVerseEditModal from './FaithVerseEditModal';
import { useCollectionSettings } from '../hooks/useCollectionSettings';

interface FaithVersesProps {
  onNavigate?: (view: string, data?: any) => void;
  onEditEvent?: (id: string) => void;
  isEmbedded?: boolean;
  forcedTab?: 'timeline' | 'collections';
}

export default function FaithVerses({ onNavigate, onEditEvent, isEmbedded, forcedTab }: FaithVersesProps) {
  const { faithVerses, loading, removeVerse, saveVerse } = useFaithVerses();
  const { collectionSettings } = useCollectionSettings('faith_verses');
  const [dailyVerseData, setDailyVerseData] = useState<any>(null);
  const [editingVerseId, setEditingVerseId] = useState<string | null>(null);
  
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiCopied, setAiCopied] = useState(false);

  // Fetch Daily Verse on mount
  useEffect(() => {
    let isMounted = true;
    const fetchDailyVerse = async () => {
      try {
        const response = await fetch('/api/verse-of-the-day');
        const data = await response.json();
        if (data.success && isMounted) {
          setDailyVerseData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch verse of the day:', error);
      }
    };
    fetchDailyVerse();
    return () => { isMounted = false; };
  }, []);

  const setEventsDummy = () => {};

  // Auto-save Daily Verse on load
  useEffect(() => {
    if (dailyVerseData && !loading) {
      const today = new Date();
      const isSaved = faithVerses.some(v => {
        if (v.version !== 'DAILY_VERSE' || !v.savedAt) return false;
        const d = new Date(v.savedAt);
        return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
      });

      if (!isSaved) {
        let bookName = 'Unknown';
        let chapter = 1;
        let verseNum = '1';
        
        const match = dailyVerseData.reference.match(/^(\d?\s*[a-zA-Z\s]+)\s+(\d+):([\d-]+)$/);
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
          verseNum: typeof verseNum === 'string' ? parseInt(verseNum, 10) || 0 : verseNum,
          reference: dailyVerseData.reference,
          text: dailyVerseData.text,
          version: 'DAILY_VERSE',
          note: dailyVerseData.make_it_happen || '',
          savedAt: Date.now(),
          isPinned: false,
          isMemorized: false,
          collections: []
        };
        
        saveVerse(newVerse);
      }
    }
  }, [dailyVerseData, loading, faithVerses, saveVerse]);



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
        events={faithVerses.map(v => ({
          id: v.id,
          type: 'verse',
          title: v.reference || `${v.bookName} ${v.chapter}:${v.verseNum}`,
          description: v.text,
          note: v.note,
          collections: v.collections,
          timestamp: v.savedAt,
          version: v.version
        }))}
        setEvents={setEventsDummy}
        loading={loading}
        sectionType="faith_verses"
        onNavigate={onNavigate}
        onEditEvent={setEditingVerseId}
        onDeleteEvent={removeVerse}
        isEmbedded={isEmbedded}
        forcedTab={forcedTab}
      />

      <FaithVerseEditModal
        isOpen={editingVerseId !== null}
        onClose={() => setEditingVerseId(null)}
        verse={faithVerses.find(v => v.id === editingVerseId) || null}
        onUpdate={(v) => { saveVerse(v); setEditingVerseId(null); }}
        onDelete={() => setEditingVerseId(null)}
        availableCollections={Array.from(new Set([
          ...Object.keys(collectionSettings),
          ...faithVerses.flatMap(v => v.collections || [])
        ])).sort()}
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
                  {aiResponse.split('\n').map((paragraph, idx) => (
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
