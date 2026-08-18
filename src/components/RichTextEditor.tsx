import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Maximize, Minimize, Bold, Italic, List, ListOrdered, 
  IndentIncrease, IndentDecrease, Quote, Undo, Redo, Mic, X
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  hideToolbar?: boolean;
  onDoubleClick?: (e: React.MouseEvent) => void;
  showExpandButton?: boolean;
  onExpand?: () => void;
  hideExpandButton?: boolean;
}

export default function RichTextEditor({ value, onChange, placeholder, autoFocus, hideToolbar, onDoubleClick, hideExpandButton }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      setTimeout(() => editorRef.current?.focus(), 50);
    }
  }, [autoFocus]);

  useEffect(() => {
    let recognition: any = null;
    
    if (isRecording) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if ((finalTranscript || interimTranscript || event.results.length > 0) && editorRef.current) {
             const isFocused = document.activeElement === editorRef.current;
             if (!isFocused) {
               editorRef.current.focus();
               const sel = window.getSelection();
               if (sel) {
                 const range = document.createRange();
                 range.selectNodeContents(editorRef.current);
                 range.collapse(false);
                 sel.removeAllRanges();
                 sel.addRange(range);
               }
             }

             const existingInterim = editorRef.current.querySelector('#interim-text');
             if (existingInterim) {
                 const sel = window.getSelection();
                 if (sel && existingInterim.parentNode) {
                    const range = document.createRange();
                    range.setStartBefore(existingInterim);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                 }
                 existingInterim.remove();
             }

             if (finalTranscript) {
               const currentText = editorRef.current.innerText || '';
               const space = (currentText.length > 0 && !currentText.endsWith(' ') && !currentText.endsWith('\n')) ? ' ' : '';
               document.execCommand('insertText', false, space + finalTranscript);
             }

             if (interimTranscript) {
               const currentText = editorRef.current.innerText || '';
               const space = (currentText.length > 0 && !currentText.endsWith(' ') && !currentText.endsWith('\n')) ? ' ' : '';
               const spanHtml = `<span id="interim-text" class="text-stone-400 italic">${space + interimTranscript}</span>`;
               document.execCommand('insertHTML', false, spanHtml);
             }
             
             handleInput();
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
           setIsRecording(false);
           if (editorRef.current) {
             const existingInterim = editorRef.current.querySelector('#interim-text');
             if (existingInterim) {
               existingInterim.remove();
               handleInput();
             }
           }
        };

        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to start speech recognition", e);
          setIsRecording(false);
        }
      } else {
        alert("Speech recognition is not supported in this browser.");
        setIsRecording(false);
      }
    } else {
       if (editorRef.current) {
         const existingInterim = editorRef.current.querySelector('#interim-text');
         if (existingInterim) {
           existingInterim.remove();
           handleInput();
         }
       }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (e: React.MouseEvent, cmd: string, arg?: string) => {
    e.preventDefault();
    if (editorRef.current) editorRef.current.focus();
    document.execCommand(cmd, false, arg);
    handleInput();
  };

  return (
    <>
    <div className="relative flex flex-col h-full bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
      {!hideToolbar && (<div className="flex items-center gap-1 p-2 border-b border-stone-100 bg-stone-50 flex-wrap">
        <button onMouseDown={(e) => execCmd(e, 'undo')} className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors" title="Undo"><Undo size={16} /></button>
        <button onMouseDown={(e) => execCmd(e, 'redo')} className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors" title="Redo"><Redo size={16} /></button>
        <div className="w-px h-5 bg-[#c2094c]/30 mx-1"></div>
        <button onMouseDown={(e) => execCmd(e, 'bold')} className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors" title="Bold"><Bold size={16} /></button>
        <button onMouseDown={(e) => execCmd(e, 'italic')} className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors" title="Italic"><Italic size={16} /></button>
        <div className="w-px h-5 bg-[#c2094c]/30 mx-1"></div>
        <button onMouseDown={(e) => execCmd(e, 'insertUnorderedList')} className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors" title="Bulleted List"><List size={16} /></button>
        <button onMouseDown={(e) => execCmd(e, 'insertOrderedList')} className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors" title="Numbered List"><ListOrdered size={16} /></button>
        <button onMouseDown={(e) => execCmd(e, 'indent')} className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors" title="Increase Indent"><IndentIncrease size={16} /></button>
        <button onMouseDown={(e) => execCmd(e, 'outdent')} className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors" title="Decrease Indent"><IndentDecrease size={16} /></button>
        <div className="w-px h-5 bg-[#c2094c]/30 mx-1"></div>
        <button onMouseDown={(e) => execCmd(e, 'formatBlock', 'BLOCKQUOTE')} className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors" title="Quote"><Quote size={16} /></button>
        
        <button 
          onMouseDown={(e) => { e.preventDefault(); setIsRecording(!isRecording); }} 
          className={`ml-auto p-1.5 rounded transition-colors ${isRecording ? 'text-red-500 bg-red-50 animate-pulse' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200'}`} 
          title="Voice Dictation"
        >
          <Mic size={16} />
        </button>
      </div>)}
      <div 
        ref={editorRef}
        className="flex-1 p-4 outline-none overflow-y-auto prose prose-stone prose-sm max-w-none text-slate-700 min-h-[150px]"
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        onDoubleClick={onDoubleClick}
      />
          
      {!hideExpandButton && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(true); }}
          className="absolute bottom-3 right-3 p-2 bg-[#c2094c] text-white rounded-lg hover:bg-red-700 transition-colors shadow-md z-10 flex items-center justify-center"
          title="Open Rich Text Editor"
        >
          <Maximize size={16} />
        </button>
      )}
    </div>

    {isExpanded && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div 
          className="w-full h-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/50 shrink-0">
            <h3 className="text-lg font-serif text-slate-800">Rich Text Reflection</h3>
            <button onClick={() => setIsExpanded(false)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"><X size={20}/></button>
          </div>
          <div className="flex-1 p-4 sm:p-6 bg-[#faf9f8] overflow-hidden">
            <RichTextEditor 
              value={value} 
              onChange={onChange} 
              placeholder={placeholder} 
              hideExpandButton 
              autoFocus 
            />
          </div>
        </div>
        <div className="absolute inset-0 -z-10" onClick={() => setIsExpanded(false)} />
      </div>
    )}
    </>
  );
}
