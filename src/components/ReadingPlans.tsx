import React, { useState } from 'react';
import { BookOpen, Flame, CalendarDays, CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import { useReadingPlans, ReadingPlan } from '../hooks/useReadingPlans';

const AVAILABLE_PLANS = [
  { id: 'gospels-30', name: 'The Gospels in 30 Days', days: 30 },
  { id: 'proverbs-31', name: 'Proverbs in a Month', days: 31 },
  { id: 'nt-90', name: 'New Testament in 90 Days', days: 90 },
  { id: 'bible-365', name: 'The Bible in a Year', days: 365 },
];

export default function ReadingPlans() {
  const { plans, savePlan, markDayComplete } = useReadingPlans();
  const [showCatalog, setShowCatalog] = useState(false);

  const startPlan = (template: typeof AVAILABLE_PLANS[0]) => {
    savePlan({
      id: `plan-${template.id}-${Date.now()}`,
      planName: template.name,
      progress: 0,
      totalDays: template.days,
      lastReadTimestamp: 0,
      streak: 0
    });
    setShowCatalog(false);
  };

  const isCompletedToday = (timestamp: number) => {
    if (timestamp === 0) return false;
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#faf9f8] p-4 sm:p-8 md:p-12 animate-in fade-in duration-700 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="max-w-4xl mx-auto w-full">
        
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center text-[#c2094c]">
              <CalendarDays size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-serif text-slate-900">Faith Plans</h2>
              <p className="text-stone-500 text-sm font-medium tracking-wide">Build a daily habit in the Word.</p>
            </div>
          </div>
          {!showCatalog && (
            <button 
              onClick={() => setShowCatalog(true)}
              className="bg-[#c2094c] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#a0073e] transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> New Plan
            </button>
          )}
        </div>

        {showCatalog ? (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-sm text-stone-500 mb-6 font-bold uppercase tracking-widest cursor-pointer hover:text-[#c2094c] transition-colors" onClick={() => setShowCatalog(false)}>
              <ChevronRight size={16} className="rotate-180" /> Back to My Plans
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {AVAILABLE_PLANS.map(p => (
                <div key={p.id} className="bg-white border border-stone-200 p-6 rounded-3xl hover:border-[#c2094c]/30 hover:shadow-xl hover:shadow-[#c2094c]/5 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#c2094c] transition-colors">{p.name}</h3>
                    <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-md">{p.days} Days</span>
                  </div>
                  <button 
                    onClick={() => startPlan(p)}
                    className="w-full py-3 bg-stone-50 hover:bg-[#c2094c] hover:text-white text-stone-600 font-bold rounded-xl transition-colors text-sm"
                  >
                    Start Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {plans.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center shadow-sm">
                <BookOpen size={48} className="text-stone-300 mb-4 mx-auto" />
                <h3 className="text-xl font-serif text-slate-700 mb-2">No active faith plans</h3>
                <p className="text-stone-500 mb-6 max-w-md mx-auto">Start a reading plan to build a consistent daily habit of reading scripture.</p>
                <button onClick={() => setShowCatalog(true)} className="bg-[#c2094c] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-[#a0073e] transition-colors inline-flex items-center gap-2">
                  <Plus size={16} /> Browse Plans
                </button>
              </div>
            ) : (
              plans.map(plan => {
                const percent = Math.round((plan.progress / plan.totalDays) * 100);
                const completedToday = isCompletedToday(plan.lastReadTimestamp);
                
                return (
                  <div key={plan.id} className="bg-white border border-stone-200 p-6 sm:p-8 rounded-3xl shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{plan.planName}</h3>
                        <p className="text-stone-500 text-sm">Day {plan.progress} of {plan.totalDays}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-bold text-sm border border-orange-100">
                          <Flame size={16} className={plan.streak > 0 ? "fill-orange-500" : ""} /> {plan.streak} Day Streak
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-3 bg-stone-100 rounded-full mb-6 overflow-hidden">
                      <div className="h-full bg-[#c2094c] rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-stone-400">{percent}% Completed</span>
                      <button 
                        onClick={() => markDayComplete(plan)}
                        disabled={completedToday || plan.progress === plan.totalDays}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors ${completedToday || plan.progress === plan.totalDays ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-[#c2094c] text-white hover:bg-[#a0073e] shadow-sm'}`}
                      >
                        {completedToday || plan.progress === plan.totalDays ? (
                          <><CheckCircle2 size={16} /> {plan.progress === plan.totalDays ? 'Plan Finished!' : 'Done for Today'}</>
                        ) : (
                          'Mark Today Complete'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
