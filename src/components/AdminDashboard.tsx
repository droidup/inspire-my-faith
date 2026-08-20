import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, Settings, FileText, BarChart3, Edit3, Loader2, Save, Search, RefreshCw, X, Database, Activity, ListChecks, Hash, Users, BookOpen, PenTool, UserPlus, Trash2, AlertTriangle } from 'lucide-react';

interface Stats {
  topicCount: number;
  mappingCount: number;
}

interface Topic {
  id: number;
  name: string;
  keywords: string;
  verse_count: number;
}

interface AdminDashboardProps {
  userEmail: string;
  isSuperAdmin: boolean;
}

export default function AdminDashboard({ userEmail, isSuperAdmin }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'builder' | 'generator' | 'users' | 'settings'>('builder');
  
  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-12 space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div>
        <h2 className="text-4xl md:text-5xl font-serif text-slate-900 tracking-tight">Bible Builder</h2>
        <p className="text-stone-500 text-lg mt-2">Manage the Inspire My Faith platform</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-shrink-0 px-6 py-4 font-bold tracking-widest uppercase text-xs transition-colors border-b-2 ${
            activeTab === 'editor' ? 'border-[#c2094c] text-[#c2094c]' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Verse Editor
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex-shrink-0 px-6 py-4 font-bold tracking-widest uppercase text-xs transition-colors border-b-2 ${
            activeTab === 'builder' ? 'border-[#c2094c] text-[#c2094c]' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Bible Builder
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex-shrink-0 px-6 py-4 font-bold tracking-widest uppercase text-xs transition-colors border-b-2 ${
            activeTab === 'generator' ? 'border-[#c2094c] text-[#c2094c]' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Verse Generator
        </button>
        {isSuperAdmin && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-shrink-0 px-6 py-4 font-bold tracking-widest uppercase text-xs transition-colors border-b-2 ${
                activeTab === 'users' ? 'border-[#c2094c] text-[#c2094c]' : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-shrink-0 px-6 py-4 font-bold tracking-widest uppercase text-xs transition-colors border-b-2 ${
                activeTab === 'settings' ? 'border-[#c2094c] text-[#c2094c]' : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              Settings
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === 'editor' && <VerseEditor userEmail={userEmail} />}
        {activeTab === 'builder' && <BibleBuilder />}
        {activeTab === 'generator' && <AIVerseGenerator />}
        {activeTab === 'users' && isSuperAdmin && <UserManagement userEmail={userEmail} />}
        {activeTab === 'settings' && isSuperAdmin && <SiteSettings userEmail={userEmail} />}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function VerseEditor({ userEmail }: { userEmail: string }) {
  const [books, setBooks] = useState<any[]>([]);
  const [testamentFilter, setTestamentFilter] = useState<'OT' | 'NT'>('OT');
  const [selectedBook, setSelectedBook] = useState<number | ''>('');
  const [chapter, setChapter] = useState<number | ''>('');
  const [verseNum, setVerseNum] = useState<number | ''>('');
  
  const [currentText, setCurrentText] = useState('');
  const [newText, setNewText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleToggleRed = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;

    const selectedText = newText.substring(start, end);
    let newSelectionText = '';
    let offset = 0;

    if (selectedText.startsWith('[red]') && selectedText.endsWith('[/red]')) {
      newSelectionText = selectedText.substring(5, selectedText.length - 6);
      offset = -11;
    } else {
      newSelectionText = `[red]${selectedText}[/red]`;
      offset = 11;
    }

    const updatedText = newText.substring(0, start) + newSelectionText + newText.substring(end);
    setNewText(updatedText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end + offset);
    }, 0);
  };

  const handleAutoTag = async () => {
    if (!newText) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin_auto_tag.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText })
      });
      const data = await res.json();
      if (data.success) {
        setNewText(data.data);
        setStatus({ type: 'success', message: 'Auto-tagged Words of Christ successfully!' });
      } else {
        setStatus({ type: 'error', message: 'Failed to auto-tag.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error calling auto-tag API.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/get_books.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) setBooks(data.data);
      });
  }, []);

  const handleFetchVerse = async () => {
    if (!selectedBook || !chapter || !verseNum) return;
    setLoading(true);
    setStatus(null);
    try {
      const b = books.find(b => b.id === Number(selectedBook));
      if (!b) return;
      
      const res = await fetch(`/api/admin/verse-translation/${selectedBook}/${chapter}/${verseNum}`);
      if (!res.ok) {
        if (res.status === 404) {
           setStatus({ type: 'error', message: 'Verse not found in this chapter.' });
        } else {
           setStatus({ type: 'error', message: `Failed to fetch verse: ${res.status}` });
        }
        return;
      }
      const data = await res.json();
      if (data.success) {
        setCurrentText(data.baseText); // we can keep baseText in state but not show it in a readonly box
        setNewText(data.imfText || data.baseText); // Pre-fill with IMF or KJV fallback if no IMF exists
      } else {
        setStatus({ type: 'error', message: 'Failed to fetch verse.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error fetching verse.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateVerse = async () => {
    if (!selectedBook || !chapter || !verseNum) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin_regenerate_verse.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: selectedBook, chapter, verseNum })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setNewText(data.text);
        setStatus({ type: 'success', message: 'Verse regenerated successfully!' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to regenerate verse' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error regenerating verse.' });
    } finally {
      setLoading(false);
    }
  };

  const redoChapter = async () => {
    if (!selectedBook || !chapter) return;
    if (!window.confirm(`Are you sure you want to REDO Chapter ${chapter} of Book ID ${selectedBook}? This will instantly delete all existing IMF translations for this chapter and regenerate them!`)) {
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin_build_chapter.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: selectedBook, chapter })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Chapter rebuilt successfully!' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Error rebuilding chapter.' });
      }
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', message: 'Error rebuilding chapter.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewText('');
    setCurrentText('');
    setStatus(null);
  };

  const handleSaveVerse = async () => {
    if (!selectedBook || !chapter || !verseNum || !newText) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin_verse_translation.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook,
          chapter: chapter,
          verseNum: verseNum,
          version: 'IMF',
          text: newText,
          email: userEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Verse updated successfully!' });
        setCurrentText(newText);
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to update verse.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error updating verse.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-200">
      <h3 className="font-serif text-2xl text-slate-900 mb-6">Edit IMF Translation</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <div className="flex gap-2 mb-2">
            <button 
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${testamentFilter === 'OT' ? 'bg-stone-200 text-slate-800' : 'bg-transparent text-stone-400 hover:bg-stone-100'}`}
              onClick={() => { setTestamentFilter('OT'); setSelectedBook(''); }}
            >
              OT
            </button>
            <button 
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${testamentFilter === 'NT' ? 'bg-stone-200 text-slate-800' : 'bg-transparent text-stone-400 hover:bg-stone-100'}`}
              onClick={() => { setTestamentFilter('NT'); setSelectedBook(''); }}
            >
              NT
            </button>
          </div>
          <select 
            value={selectedBook} 
            onChange={(e) => setSelectedBook(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-[#c2094c] transition-colors"
          >
            <option value="">Select Book</option>
            {books.filter(b => b.testament === testamentFilter).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Chapter</label>
          <input 
            type="number" 
            min="1"
            value={chapter} 
            onChange={(e) => setChapter(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-[#c2094c] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Verse</label>
          <input 
            type="number" 
            min="1"
            value={verseNum} 
            onChange={(e) => setVerseNum(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-[#c2094c] transition-colors"
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={handleFetchVerse}
            disabled={loading || !selectedBook || !chapter || !verseNum}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#c2094c] text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#a0073e] transition-colors disabled:opacity-50"
          >
            <Search size={16} />
            Fetch Verse
          </button>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {status.message}
        </div>
      )}

      {currentText && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">IMF Text (Editable)</label>
              <div className="flex gap-2">
                <button 
                  onClick={handleAutoTag}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <Activity size={14} />
                  Auto-Tag AI
                </button>
                <button 
                  onClick={handleToggleRed}
                  className="flex items-center gap-1 px-3 py-1 bg-[#c2094c]/10 text-[#c2094c] rounded text-xs font-bold hover:bg-[#c2094c]/20 transition-colors"
                >
                  <PenTool size={14} />
                  Mark Red
                </button>
              </div>
            </div>
            <textarea 
              ref={textareaRef}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={5}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-[#c2094c] transition-colors"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-4">
              <button 
                onClick={redoChapter}
                disabled={loading || !selectedBook || !chapter}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Redo Entire Chapter
              </button>
              <button 
                onClick={handleRegenerateVerse}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-stone-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Regenerate Verse
              </button>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-stone-200 text-stone-500 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>
              <button 
                onClick={handleSaveVerse}
                disabled={loading || !newText}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-[#c2094c] text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#a0073e] transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BibleBuilder() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/admin_stats.php');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }
      
      const topicsRes = await fetch('/api/admin_recent_topics.php');
      const topicsData = await topicsRes.json();
      if (topicsData.success) {
        setRecentTopics(topicsData.data);
      }
      
      const booksRes = await fetch('/api/get_books.php');
      const booksData = await booksRes.json();
      if (booksData.success) {
        setBooks(booksData.data);
      }
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Are you connected to the DB?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h3 className="text-2xl font-serif text-slate-900">Builder Dashboard</h3>
          <p className="text-stone-500 mt-1">Live view of our auto-learning database</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-full text-sm font-medium hover:border-[#c2094c]/30 hover:text-[#c2094c] transition-all duration-300 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      )}



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 flex items-start gap-4 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Topics</p>
            <p className="text-3xl font-serif text-slate-900">
              {stats ? stats.topicCount : <span className="animate-pulse bg-stone-100 text-transparent rounded">000</span>}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 flex items-start gap-4 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Verses Mapped</p>
            <p className="text-3xl font-serif text-slate-900">
              {stats ? stats.mappingCount : <span className="animate-pulse bg-stone-100 text-transparent rounded">000</span>}
            </p>
          </div>
        </div>

      </div>

      {/* Recent Topics Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center gap-3">
          <div className="text-[#c2094c]">
            <ListChecks className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-xl text-slate-900">Recently Harvested Topics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Topic</th>
                <th className="py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Keywords Learned</th>
                <th className="py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">Verses Mapped</th>
              </tr>
            </thead>
            <tbody>
              {recentTopics.map((topic) => (
                <tr key={topic.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <td className="py-4 px-6 font-serif text-slate-800 text-lg">{topic.name}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-2">
                      {topic.keywords.split(',').slice(0, 4).map((kw, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-stone-300 mr-1">#</span>{kw.trim()}
                        </span>
                      ))}
                      {topic.keywords.split(',').length > 4 && (
                        <span className="px-2 py-0.5 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                          +{topic.keywords.split(',').length - 4} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-700">{topic.verse_count}</td>
                </tr>
              ))}
              {recentTopics.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-stone-400 text-sm">No topics discovered yet...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
function UserManagement({ userEmail }: { userEmail: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin_users.php');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.toLowerCase().trim(), reqEmail: userEmail })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'User added successfully!' });
        setNewEmail('');
        fetchUsers();
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to add user.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error adding user.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (emailToDelete: string) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin_users.php?email=${encodeURIComponent(emailToDelete)}&reqEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'User removed.' });
        fetchUsers();
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to remove user.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error removing user.' });
    } finally {
      setLoading(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-200">
        <h3 className="font-serif text-2xl text-slate-900 mb-6">Add Admin User</h3>
        <form onSubmit={handleAddUser} className="flex gap-4">
          <input 
            type="email"
            required
            placeholder="User Email (e.g. user@gmail.com)"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-[#c2094c] transition-colors"
          />
          <button 
            type="submit"
            disabled={loading || !newEmail}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-[#c2094c] text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#a0073e] transition-colors disabled:opacity-50"
          >
            <UserPlus size={16} />
            Add User
          </button>
        </form>
        {status && (
          <div className={`mt-4 p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {status.message}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center gap-3">
          <div className="text-[#c2094c]">
            <Users className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-xl text-slate-900">Authorized Admins</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Email</th>
                <th className="py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Added On</th>
                <th className="py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u.email} className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-4 px-6 text-slate-900 font-medium">{u.email}</td>
                  <td className="py-4 px-6 text-stone-500 text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {u.email !== 'daveward.us@gmail.com' ? (
                      <button 
                        onClick={() => setUserToDelete(u.email)}
                        className="text-stone-400 hover:text-red-500 transition-colors p-2"
                        title="Remove Admin"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-stone-300 uppercase tracking-wider mr-2">Super Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-xl font-serif font-bold mb-3">Remove User?</h4>
            <p className="text-sm text-stone-600 mb-8 leading-relaxed">
              Are you sure you want to remove <strong className="font-bold">{userToDelete}</strong>? This user will no longer have admin access.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-3 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteUser(userToDelete)}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AIVerseGenerator() {
  const [quantity, setQuantity] = React.useState<number>(30);
  const [season, setSeason] = React.useState<string>('general');
  const [customTheme, setCustomTheme] = React.useState<string>('');
  const [model, setModel] = React.useState<string>('gemini-3.6-flash');
  const [useCustomKey, setUseCustomKey] = React.useState<boolean>(false);
  const [apiKey, setApiKey] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [status, setStatus] = React.useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleGenerate = async () => {
    if (season === 'other' && !customTheme.trim()) {
      setStatus({ type: 'error', message: 'Please provide a custom theme' });
      return;
    }
    if (useCustomKey && !apiKey.trim()) {
      setStatus({ type: 'error', message: 'Please enter your Pro API Key' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin_generate_verses.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          season,
          customTheme,
          model,
          apiKey: useCustomKey ? apiKey : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: `Successfully generated and saved ${data.count} verses for ${season === 'other' ? customTheme : season} using ${model}.` });
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to generate verses' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-stone-600 border border-stone-100 shrink-0">
          <PenTool size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-serif text-slate-800">AI Batch Verse Generator</h3>
          <p className="text-stone-500 mt-1">Dynamically generate and populate the database.</p>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* API & Model Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 p-6 rounded-2xl border border-stone-100">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">AI Account</label>
            <select 
              value={useCustomKey ? 'custom' : 'default'} 
              onChange={(e) => setUseCustomKey(e.target.value === 'custom')}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c2094c]/20"
            >
              <option value="default">System Default</option>
              <option value="custom">My Pro Account</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Model</label>
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c2094c]/20"
            >
              <option value="gemini-3.6-flash">gemini-3.6-flash (Fastest)</option>
              <option value="gemini-3.6-pro">gemini-3.6-pro (Highest Quality)</option>
            </select>
          </div>
          {useCustomKey && (
            <div className="md:col-span-2">
               <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Pro API Key</label>
               <input 
                 type="password"
                 value={apiKey}
                 onChange={e => setApiKey(e.target.value)}
                 placeholder="Enter your Pro API Key"
                 className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c2094c]/20"
               />
            </div>
          )}
        </div>

        {/* Generation Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Quantity</label>
            <input 
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c2094c]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Season / Theme</label>
            <select 
              value={season} 
              onChange={(e) => setSeason(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c2094c]/20"
            >
              <option value="general">General</option>
              <option value="christmas">Christmas</option>
              <option value="easter">Easter</option>
              <option value="thanksgiving">Thanksgiving</option>
              <option value="new_year">New Year</option>
              <option value="summer">Summer</option>
              <option value="other">Other (Custom)</option>
            </select>
          </div>
        </div>

        {season === 'other' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Custom Theme</label>
            <input 
              type="text"
              value={customTheme}
              onChange={e => setCustomTheme(e.target.value)}
              placeholder="e.g., Mother's Day, Lent"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c2094c]/20"
            />
          </div>
        )}

        {status && (
          <div className={`p-4 rounded-xl text-sm ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {status.message}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-[#c2094c] hover:bg-[#a0073e] text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={20} /> Generating verses...</>
          ) : (
            <><PenTool size={20} /> Generate & Save to Database</>
          )}
        </button>
      </div>
    </div>
  );
}




function SiteSettings({ userEmail }: { userEmail: string }) {
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    fetch('/api/admin_settings.php')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.ads_enabled === 'true') {
          setAdsEnabled(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    setSaving(true);
    setStatus(null);
    const newValue = !adsEnabled;
    try {
      const res = await fetch('/api/admin_settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, key: 'ads_enabled', value: newValue ? 'true' : 'false' })
      });
      const data = await res.json();
      if (data.success) {
        setAdsEnabled(newValue);
        setStatus({ type: 'success', message: 'Settings saved successfully!' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to save settings' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred' });
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center text-stone-500">Loading settings...</div>;

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-sm max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-stone-600 border border-stone-100 shrink-0">
          <Settings size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-serif text-slate-800">Site Settings</h3>
          <p className="text-stone-500 mt-1">Manage global configurations.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-6 border border-stone-200 rounded-2xl">
          <div>
            <h4 className="font-bold text-slate-800">Google AdSense</h4>
            <p className="text-sm text-stone-500 mt-1">Enable or disable ads across the entire site.</p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2094c] focus-visible:ring-offset-2 ${adsEnabled ? 'bg-[#c2094c]' : 'bg-stone-300'}`}
          >
            <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${adsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-xl text-sm ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
