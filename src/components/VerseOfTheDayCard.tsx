import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Circle, CheckCircle2, HeartHandshake } from 'lucide-react';

interface VerseOfTheDayCardProps {
  variant?: 'home' | 'faith-verse';
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onVerseLoaded?: (verse: any) => void;
}

export default function VerseOfTheDayCard({ 
  variant = 'home',
  isSelected = false,
  onSelect,
  onVerseLoaded
}: VerseOfTheDayCardProps) {
  const [verse, setVerse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchVerse = async () => {
      try {
        const response = await fetch('/api/get_verse_of_the_day.php');
        const data = await response.json();
        if (data.success && isMounted) {
          setVerse(data.data);
          if (onVerseLoaded) {
            onVerseLoaded(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch verse of the day:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVerse();
    return () => { isMounted = false; };
  }, [onVerseLoaded]);

  if (loading || !verse) {
    return (
      <div className="bg-white rounded-[24px] shadow-sm border border-stone-100 p-8 flex items-center justify-center min-h-[300px] col-span-1 md:col-span-2">
        <Loader2 className="animate-spin text-stone-300" size={32} />
      </div>
    );
  }

  const isHome = variant === 'home';

  if (!isHome) {
    return (
      <div className="relative">
        <div className="sticky top-[80px] z-30 py-4 bg-[#faf9f8]/90 backdrop-blur-md">
          <h3 className="inline-block bg-white text-slate-800 font-bold px-4 py-1.5 rounded-full border border-stone-200 shadow-sm text-sm ml-12 sm:ml-20">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>
        
        <div className="relative flex items-start gap-6 sm:gap-8 group mt-4">
          <div className="absolute left-6 sm:left-[39px] top-6 w-8 h-px bg-stone-200 -z-10"></div>
          
          <div className="flex-1 flex items-start gap-4">
            <button 
              onClick={() => onSelect && onSelect(!isSelected)}
              className="mt-4 text-stone-300 hover:text-[#c2094c] transition-colors shrink-0"
            >
              {isSelected ? <CheckCircle2 size={22} className="text-[#c2094c] fill-[#c2094c]/10" /> : <Circle size={22} />}
            </button>
            
            <div className="w-12 h-12 rounded-full bg-white border-[3px] shadow-sm flex items-center justify-center shrink-0 mt-1 relative z-10 transition-transform duration-300 border-stone-100">
              <HeartHandshake size={20} className="text-[#c2094c]" />
            </div>
            
            <div className={`flex-1 bg-white border p-6 rounded-3xl shadow-sm relative transition-all ${isSelected ? 'border-[#c2094c] ring-1 ring-[#c2094c]/20' : 'border-stone-200 hover:shadow-md'}`}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border bg-emerald-50 text-emerald-600 border-emerald-100">
                    DAILY VERSE
                  </span>
                  <span className="text-stone-400 text-sm font-bold uppercase tracking-widest">
                    {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <h4 className="text-lg font-serif text-slate-900 mb-2">{verse.reference}</h4>
              <p className="text-stone-600 leading-relaxed text-sm whitespace-pre-wrap italic mb-4">
                "{verse.text}"
              </p>
              
              <div className="pt-4 border-t border-stone-100 mt-4">
                <h4 className="font-bold uppercase tracking-[0.2em] text-[#c2094c]/60 mb-2 flex items-center gap-2 text-[10px]">
                  Make it happen
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {verse.make_it_happen}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-stone-100 overflow-hidden flex flex-col h-full relative group col-span-1 md:col-span-2 transition-all hover:shadow-md">
      {/* Top Section: Verse */}
      <div className="p-8 sm:p-10 bg-gradient-to-br from-white to-stone-50/50 text-slate-800 relative flex-1 flex flex-col justify-center border-b border-stone-200">
        <h4 className="font-bold uppercase tracking-[0.2em] text-[#c2094c] mb-4 text-[11px]">Verse of the Day</h4>
        <p className="font-serif leading-relaxed mb-4 text-slate-800 text-xl sm:text-2xl">
          "{verse.text}"
        </p>
        <p className="text-stone-500 font-medium tracking-wide text-sm">
          — {verse.reference}
        </p>
      </div>

      {/* Bottom Section: Make it happen */}
      <div className="p-6 sm:px-10 sm:py-8 flex flex-col bg-[#fef2f2]">
        <h4 className="font-bold uppercase tracking-[0.2em] text-[#c2094c]/80 mb-3 flex items-center gap-2 text-[11px]">
          Make it happen
        </h4>
        <div className="w-12 h-px bg-red-200/60 mb-4"></div>
        <p className="text-slate-700 leading-relaxed text-base mb-6">
          {verse.make_it_happen}
        </p>
      </div>
    </div>
  );
}
