const fs = require('fs');
let content = fs.readFileSync('src/components/shared/FaithAreaLayout.tsx', 'utf8');

const gridVerseReplace = `                    if (viewMode === 'grid') {
                      if (event.type === 'verse') {
                        return (
                          <div key={event.id} onClick={() => handleItemClick(event.type, event.id, event.title)} className=\`bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col cursor-pointer \${isSelected ? 'border-[#c2094c] ring-1 ring-[#c2094c]/20' : 'border-stone-200'}\`>
                            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                              <button onClick={(e) => { e.stopPropagation(); toggleSelection(event.id); }} className="text-stone-300 hover:text-[#c2094c] transition-colors shrink-0 bg-white/50 backdrop-blur-sm rounded-full p-1">
                                {isSelected ? <CheckCircle2 size={20} className="text-[#c2094c] fill-[#c2094c]/10" /> : <Circle size={20} />}
                              </button>
                              <div className="bg-white/80 backdrop-blur-md rounded-full shadow-sm"><ActionMenu /></div>
                            </div>
                            
                            <div className="p-6 sm:p-8 bg-white text-slate-800 relative flex flex-col justify-center border-b border-stone-100 flex-1">
                               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                 <Sparkles size={80} className="text-[#c2094c]" />
                               </div>
                               <div className="flex items-center gap-3 mb-4 relative z-10">
                                 <span className=\`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border \${event.version === 'DAILY_VERSE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}\`>
                                   {event.version === 'DAILY_VERSE' ? 'DAILY VERSE' : 'FAITH VERSE'}
                                 </span>
                                 <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{timeStr}</span>
                               </div>

                               <p className="font-serif leading-relaxed mb-4 text-slate-800 text-lg relative z-10 line-clamp-4">
                                 "{event.description}"
                               </p>
                               <p className="text-stone-500 font-medium tracking-wide text-xs relative z-10">
                                 — {event.title}
                               </p>
                            </div>

                            {event.note && (
                              <div className="p-6 sm:px-8 sm:py-5 flex flex-col bg-stone-50/50">
                                 <h4 className="font-bold uppercase tracking-[0.2em] text-stone-400 mb-2 flex items-center gap-2 text-[10px]">
                                   <Sparkles size={12} className="text-[#c2094c]" />
                                   Make it happen
                                 </h4>
                                 <div 
                                   className="text-stone-600 leading-relaxed text-xs line-clamp-3 whitespace-pre-wrap"
                                   dangerouslySetInnerHTML={{ __html: event.note }}
                                 />
                              </div>
                            )}

                            {event.collections && event.collections.length > 0 && (
                               <div className="px-6 sm:px-8 pb-6 flex flex-wrap gap-1 bg-stone-50/50">
                                 {event.collections.map((c) => {
                                   const cColor = collectionSettings[c]?.color || '#c2094c';
                                   return (
                                     <span key={c} className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" style={{ color: cColor, backgroundColor: \`\${cColor}1A\` }}>
                                       {c}
                                     </span>
                                   );
                                 })}
                               </div>
                            )}
                          </div>
                        );
                      }

                      return (`;

const listVerseReplace = `                    // List View
                    if (event.type === 'verse') {
                      return (
                        <div key={event.id} className="relative flex items-start gap-6 sm:gap-8 group">
                          <div className="absolute left-6 sm:left-[39px] top-6 w-8 h-px bg-stone-200 -z-10"></div>
                          
                          <div className="flex-1 flex items-start gap-4">
                            <button onClick={(e) => { e.stopPropagation(); toggleSelection(event.id); }} className="mt-4 text-stone-300 hover:text-[#c2094c] transition-colors shrink-0">
                               {isSelected ? <CheckCircle2 size={22} className="text-[#c2094c] fill-[#c2094c]/10" /> : <Circle size={22} />}
                            </button>
                            
                            <div onClick={(e) => { e.stopPropagation(); handleItemClick(event.type, event.id, event.title); }} className=\`w-12 h-12 rounded-full bg-white border-[3px] shadow-sm flex items-center justify-center shrink-0 mt-1 relative z-10 transition-transform duration-300 border-stone-100 cursor-pointer hover:scale-110 hover:border-[#c2094c]/20\`>
                              {getIcon(event.type)}
                            </div>
                            
                            <div onClick={() => handleItemClick(event.type, event.id, event.title)} className=\`flex-1 bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col cursor-pointer \${isSelected ? 'border-[#c2094c] ring-1 ring-[#c2094c]/20' : 'border-stone-200'}\`>
                               
                               <div className="p-6 sm:p-8 bg-white text-slate-800 relative flex flex-col justify-center border-b border-stone-100">
                                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Sparkles size={80} className="text-[#c2094c]" />
                                  </div>
                                  
                                  <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                      <span className=\`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border \${event.version === 'DAILY_VERSE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}\`>
                                        {event.version === 'DAILY_VERSE' ? 'DAILY VERSE' : 'FAITH VERSE'}
                                      </span>
                                      <span className="text-stone-400 text-sm font-bold uppercase tracking-widest">{timeStr}</span>
                                    </div>
                                    <ActionMenu />
                                  </div>

                                  <p className="font-serif leading-relaxed mb-4 text-slate-800 text-lg sm:text-xl relative z-10">
                                    "{event.description}"
                                  </p>
                                  <p className="text-stone-500 font-medium tracking-wide text-sm relative z-10">
                                    — {event.title}
                                  </p>
                               </div>

                               {event.note && (
                                 <div className="p-6 sm:px-8 sm:py-6 flex flex-col bg-stone-50/50">
                                    <h4 className="font-bold uppercase tracking-[0.2em] text-stone-400 mb-3 flex items-center gap-2 text-[10px]">
                                      <Sparkles size={14} className="text-[#c2094c]" />
                                      Make it happen
                                    </h4>
                                    <p className="text-slate-600 leading-relaxed text-sm">
                                      {event.note}
                                    </p>
                                 </div>
                               )}

                               {event.collections && event.collections.length > 0 && (
                                  <div className="px-6 sm:px-8 pb-6 flex flex-wrap gap-1 bg-stone-50/50">
                                    {event.collections.map((c) => {
                                      const cColor = collectionSettings[c]?.color || '#c2094c';
                                      return (
                                        <span key={c} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" style={{ color: cColor, backgroundColor: \`\${cColor}1A\` }}>
                                          {c}
                                        </span>
                                      );
                                    })}
                                  </div>
                               )}
                            </div>
                            
                            {onEditEvent && (
                              <div className="relative group/btn mt-4">
                                <button onClick={(e) => { e.stopPropagation(); onEditEvent(event.id); }} className="p-1.5 hover:bg-stone-100 rounded-md transition-colors hover:text-[#c2094c]">
                                  <PenTool size={16} />
                                </button>
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#c2094c]/90 backdrop-blur-md border border-[#c2094c]/50 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                  Edit
                                </span>
                              </div>
                            )}
                            <div className="relative group/btn mt-4">
                              <button onClick={(e) => { e.stopPropagation(); setEventToDelete(event.id); }} className="p-1.5 hover:bg-red-50 rounded-md transition-colors hover:text-red-500">
                                <Trash size={16} />
                              </button>
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md border border-red-500/50 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                Delete
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (`

content = content.replace("                    if (viewMode === 'grid') {\n                      return (", gridVerseReplace);
content = content.replace("                    // List View\n                    return (", listVerseReplace);

fs.writeFileSync('src/components/shared/FaithAreaLayout.tsx', content);
