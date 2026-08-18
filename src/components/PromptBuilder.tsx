import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquareText, CalendarIcon, FolderOpen, BookOpen, User, Lightbulb, Send, Compass, Heart, CheckCircle2, Check, Copy, X, PenTool } from 'lucide-react';
import AdBanner from './AdBanner';
import FaithAreaLayout from './shared/FaithAreaLayout';
import { useSavedPrompts, Prompt } from '../hooks/useSavedPrompts';
import { TimelineEvent } from '../hooks/useFaithTimeline';
import { useFaithTimeline } from '../hooks/useFaithTimeline';
import { useCollectionSettings } from '../hooks/useCollectionSettings';
import FolderDropdown from './shared/FolderDropdown';
import RichTextEditor from './RichTextEditor';

export default function PromptBuilder({ globalVersion = 'IMF' }: { globalVersion?: string }) {
  const [activeTab, setActiveTab] = useState<'builder' | 'calendar' | 'collections'>('builder');

  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [focus, setFocus] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [generatedPromptText, setGeneratedPromptText] = useState('');
  const [saved, setSaved] = useState(false);
  
  const { prompts, savePrompt, removePrompt } = useSavedPrompts();
  const { events: timelineEvents } = useFaithTimeline();
  const { collectionSettings } = useCollectionSettings('prompt');
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  
  const [editDraft, setEditDraft] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'study_guide' | 'notes'>('study_guide');
  const [newCollectionName, setNewCollectionName] = useState('');

  const handleEditEvent = (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      setEditDraft(prompt);
      setIsModalOpen(true);
    }
  };
  
  useEffect(() => {
    setEvents(prompts.map(p => ({
      id: p.id,
      type: 'prompt',
      title: p.title,
      description: p.text,
      timestamp: p.timestamp,
      collections: p.collections,
      isPinned: p.isPinned,
      reflection: p.reflection,
      verses: p.verses
    })));
  }, [prompts]);

  const uniqueCollections = useMemo(() => {
    const fromSettings = Object.keys(collectionSettings);
    const fromEvents = timelineEvents.flatMap(e => e.collections || []);
    return Array.from(new Set([...fromSettings, ...fromEvents].filter(Boolean)));
  }, [collectionSettings, timelineEvents]);

  const handleGeneratePrompt = () => {
    let prompt = `Please act as an expert Bible study guide and theologian. I am building a Bible study lesson and I need your help to flesh it out.\n\n`;
    prompt += `**Topic / Theme:**\n${topic || 'General Bible Study'}\n\n`;
    if (audience.trim()) prompt += `**Target Audience:**\n${audience}\n\n`;
    if (focus.trim()) prompt += `**Specific Focus / Questions to Address:**\n${focus}\n\n`;
    
    prompt += `Please provide a structured study guide including:\n1. An engaging introduction.\n2. Exegetical and historical context for the theme.\n3. 3-4 discussion questions tailored to the target audience.\n4. A concluding practical application or prayer.`;
    
    setGeneratedPromptText(prompt);
    setSaved(false);
  };

  const handleSavePrompt = async () => {
    setGenerating(true);
    
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      title: topic ? `Study Guide: ${topic}` : 'Generated Study Guide',
      text: generatedPromptText,
      answered: false,
      timestamp: Date.now(),
      collections: []
    };
    
    await savePrompt(newPrompt);
    
    setTimeout(() => {
      setGenerating(false);
      setSaved(true);
      setActiveTab('calendar');
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#faf9f8] p-4 sm:p-8 md:p-12 animate-in fade-in duration-700 relative">
      <div className="max-w-4xl mx-auto w-full flex flex-col min-h-full">
        
        {/* Exact Match Pill Navigation (Image 1 Style) */}
        <div className="flex justify-center mb-8">
          <div className="bg-stone-100 p-1 rounded-2xl flex flex-wrap justify-center gap-1 shadow-inner">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'builder' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Compass size={16} /> Faith Builder
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'calendar' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <CalendarIcon size={16} /> Builder Calendar
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'collections' ? 'bg-white text-[#c2094c] shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <FolderOpen size={16} /> Builder Collections
            </button>
          </div>
        </div>

        {/* Standard Left-Aligned Header */}
        {activeTab === 'builder' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center text-[#c2094c]">
                <MessageSquareText size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-serif text-slate-900">
                  Faith Builder
                </h2>
                <div className="text-stone-500 text-sm font-medium tracking-wide mt-1">
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-xl font-serif text-slate-800">Design your perfect Bible study prompt.</span>
                    <span className="text-stone-500 font-normal">Enter a topic, refine your verses, and generate a powerful prompt <br className="hidden sm:block" /> to use with any AI assistant.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 animate-in fade-in duration-500">
              {/* Left Column: Inputs */}
              <div className="space-y-6">
                <div className="bg-white border border-stone-200 rounded-3xl shadow-sm p-8 space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">
                      <BookOpen size={16} className="text-[#c2094c]" /> Topic or Theme
                    </label>
                    <input 
                      type="text" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Overcoming anxiety through faith"
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl outline-none px-5 py-3.5 text-slate-700 placeholder-stone-400 font-medium focus:bg-white focus:border-[#c2094c]/30 focus:ring-4 focus:ring-[#c2094c]/10 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">
                      <User size={16} className="text-[#c2094c]" /> Target Audience (Optional)
                    </label>
                    <input 
                      type="text" 
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g., High school youth group"
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl outline-none px-5 py-3.5 text-slate-700 placeholder-stone-400 font-medium focus:bg-white focus:border-[#c2094c]/30 focus:ring-4 focus:ring-[#c2094c]/10 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">
                      <Lightbulb size={16} className="text-[#c2094c]" /> Specific Focus (Optional)
                    </label>
                    <textarea 
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      placeholder="e.g., I want to focus on practical steps they can take this week."
                      rows={3}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl outline-none px-5 py-3.5 text-slate-700 placeholder-stone-400 font-medium focus:bg-white focus:border-[#c2094c]/30 focus:ring-4 focus:ring-[#c2094c]/10 transition-all duration-300 resize-none"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={handleGeneratePrompt}
                      disabled={!topic.trim()}
                      className="flex-1 bg-[#c2094c] text-white px-6 py-4 rounded-2xl font-bold hover:bg-[#a0073e] transition-all duration-300 flex items-center justify-center gap-2 disabled:cursor-not-allowed shadow-md shadow-[#c2094c]/20"
                    >
                      Build Bible Study <MessageSquareText size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Output */}
              <div className="space-y-6 flex flex-col">
                {generatedPromptText ? (
                  <>
                    <div className="bg-white border border-stone-200 rounded-3xl shadow-sm p-6 flex flex-col flex-1 max-h-[600px]">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-[#c2094c]" /> Generated Prompt
                        </h3>
                        <button
                          onClick={() => navigator.clipboard.writeText(generatedPromptText)}
                          className="flex items-center gap-1.5 text-[10px] bg-stone-100 text-stone-600 hover:bg-stone-200 px-3 py-1.5 rounded-md font-bold uppercase tracking-widest transition-all"
                          title="Copy Prompt"
                        >
                          <Copy size={14} /> Copy
                        </button>
                      </div>
                      
                      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
                        <div className="p-5 bg-stone-50 border border-stone-100 rounded-2xl font-serif text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                          {generatedPromptText}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-stone-100 flex justify-end">
                         <button
                          onClick={handleSavePrompt}
                          disabled={generating || saved}
                          className={`text-white px-6 py-3 rounded-xl font-bold tracking-widest text-sm flex items-center gap-2 transition-all shadow-md ${saved ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'}`}
                         >
                           {generating ? 'Saving...' : saved ? 'Saved!' : 'Save Prompt'} <Check size={16} />
                         </button>
                      </div>
                    </div>
                    <div className="mt-6">
                      <AdBanner dataAdSlot="prompt_builder_reflection" />
                    </div>
                  </>
                ) : (
                   <div className="flex-1 border-2 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-stone-50/50">
                     <MessageSquareText size={48} className="text-stone-300 mb-4" />
                     <h3 className="font-bold text-stone-500 uppercase tracking-widest text-sm mb-2">No Prompt Yet</h3>
                     <p className="text-stone-400 text-sm max-w-[250px]">Fill out the details on the left and click "Build Bible Study" to generate your prompt.</p>
                   </div>
                )}
              </div>
            </div>

          </>
        )}
        
        {/* Independent Calendar & Collections using Standard FaithAreaLayout */}
        {(activeTab === 'calendar' || activeTab === 'collections') && (
           <div className="flex-1 -mx-4 sm:-mx-8 md:-mx-12 px-4 sm:px-8 md:px-12">
             <FaithAreaLayout
               title={activeTab === 'calendar' ? 'Builder Calendar' : 'Builder Collections'}
               subtitle={activeTab === 'calendar' ? "Your generated study guide prompts, organized by date." : "Explore your saved study guides grouped by topic and collection."}
               icon={activeTab === 'calendar' ? CalendarIcon : FolderOpen}
               events={events}
               setEvents={setEvents}
               loading={false}
               sectionType="prompt"
               onDeleteEvent={removePrompt}
               forcedTab={activeTab === 'calendar' ? 'timeline' : 'collections'}
               hideTabs={true}
               isEmbedded={true}
               onEditEvent={handleEditEvent}
             />
           </div>
        )}

      </div>
      
      {/* Edit Modal */}
      {isModalOpen && editDraft && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    Faith Builder Prompt
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">Local Browser Storage</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex items-center justify-between border-b border-stone-100 bg-white z-[60] relative pr-4 sm:pr-6">
              <div className="flex">
                <button
                  onClick={() => setModalTab('study_guide')}
                  className={`px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    modalTab === 'study_guide' ? 'text-[#c2094c] border-b-2 border-[#c2094c]' : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Study Guide
                </button>
                <button
                  onClick={() => setModalTab('notes')}
                  className={`px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    modalTab === 'notes' ? 'text-[#c2094c] border-b-2 border-[#c2094c]' : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Notes
                </button>
              </div>
              <div className="flex items-center py-2">
                <FolderDropdown 
                  availableFolders={uniqueCollections}
                  selectedFolders={editDraft.collections || []}
                  onChange={(folders) => setEditDraft({ ...editDraft, collections: folders })}
                  label="Collections"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto bg-[#faf9f8] flex flex-col h-[60vh] sm:h-[500px]">
              {modalTab === 'study_guide' ? (
                <div className="flex-1 flex flex-col h-full">
                  {/* Primary Card */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col gap-4 h-full">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Title</label>
                      <input 
                        type="text" 
                        value={editDraft.title || ''}
                        onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                        className="w-full text-lg font-bold text-[#c2094c] border-none outline-none placeholder:text-stone-300 focus:ring-0 p-0"
                        placeholder="Name your study guide..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Prompt Content</label>
                      <textarea 
                        value={editDraft.text || ''}
                        onChange={(e) => setEditDraft({ ...editDraft, text: e.target.value })}
                        className="w-full h-full min-h-[150px] flex-1 text-sm text-stone-600 leading-relaxed border-none outline-none resize-none placeholder:text-stone-300 focus:ring-0 p-0 font-mono bg-stone-50 p-4 rounded-xl"
                        placeholder="Prompt content..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col h-full overflow-hidden">
                  <div className="p-4 pb-2 border-b border-stone-100 bg-stone-50 shrink-0">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400">Personal Notes & Reflections</label>
                  </div>
                  <div className="flex-1 p-2">
                    <RichTextEditor 
                      value={editDraft.reflection || ''}
                      onChange={(val) => setEditDraft({ ...editDraft, reflection: val })}
                      placeholder="Add your thoughts, sermon notes, or reflections on this study guide..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-stone-100 flex items-center justify-end gap-3 bg-white shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  savePrompt(editDraft);
                  setIsModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl font-medium bg-[#c2094c] text-white hover:bg-[#a0073e] transition-colors shadow-md shadow-[#c2094c]/20 flex items-center gap-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
