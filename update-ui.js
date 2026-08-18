import fs from 'fs';

const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = 'function BibleBuilder() {';
const endStr = 'function UserManagement({';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const newContent = content.substring(0, startIdx) + `function BibleBuilder() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildStatus, setBuildStatus] = useState<any>({ 
    active: false, 
    bookId: 0,
    bookName: '',
    chapters: [],
    globalStatus: 'idle',
    resumeAt: null
  });
  const [books, setBooks] = useState<any[]>([]);
  const [builderTab, setBuilderTab] = useState<'OT' | 'NT'>('NT');

  useEffect(() => {
    const fetchStatus = () => {
      fetch('/api/admin/batch-status')
        .then(res => res.json())
        .then(data => setBuildStatus(data))
        .catch(() => {});
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const startBookBuild = async (bookId: number) => {
    try {
      const res = await fetch('/api/admin/build-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId })
      });
      const data = await res.json();
      if (data.success) {
        setBuildStatus(prev => ({ ...prev, active: true, bookId }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopBuild = async () => {
    try {
      await fetch('/api/admin/stop-build', { method: 'POST' });
      setBuildStatus(prev => ({ ...prev, active: false, globalStatus: 'idle', resumeAt: null }));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }
      
      const topicsRes = await fetch('/api/admin/recent-topics');
      const topicsData = await topicsRes.json();
      if (topicsData.success) {
        setRecentTopics(topicsData.data);
      }
      
      const booksRes = await fetch('/api/bible/books');
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
          <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin' : ''}\`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      )}

      {/* Builder Progress View */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-[#c2094c]">
              <Activity className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xl text-slate-900">Builder Progress</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setBuilderTab('OT')}
              className={\`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors \${builderTab === 'OT' ? 'bg-[#c2094c] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}\`}
            >
              Old Testament
            </button>
            <button
              onClick={() => setBuilderTab('NT')}
              className={\`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors \${builderTab === 'NT' ? 'bg-[#c2094c] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}\`}
            >
              New Testament
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 w-1/4">Book</th>
                <th className="py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 w-1/2">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 w-1/4">Action</th>
              </tr>
            </thead>
            <tbody>
              {books.filter(b => b.testament === builderTab).map((book) => {
                const isBuilding = buildStatus.active && buildStatus.bookId === book.id;
                const isCompleted = book.completed;
                if (isCompleted && !isBuilding) return null; // Hide completed books unless they are currently building (edge case)

                return (
                  <React.Fragment key={book.id}>
                    <tr className={\`border-b border-stone-50 hover:bg-stone-50/50 transition-colors \${isBuilding ? 'bg-orange-50/30' : ''}\`}>
                      <td className="py-4 px-6 font-medium text-slate-800">{book.name}</td>
                      <td className="py-4 px-6">
                        {isBuilding ? (
                          <div className="flex flex-col gap-1">
                            {buildStatus.globalStatus === 'waiting_quota' ? (
                                <span className="text-xs font-bold text-red-600 animate-pulse">Daily Quota Reached. Resuming later.</span>
                            ) : (
                                <span className="text-xs font-bold text-orange-600 animate-pulse">Building in progress...</span>
                            )}
                            {buildStatus.resumeAt && (
                                <span className="text-[10px] text-stone-500 font-medium">Resume At: {new Date(buildStatus.resumeAt).toLocaleString()}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isBuilding ? (
                          <button 
                            onClick={stopBuild}
                            className="px-4 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors"
                          >
                            Stop Build
                          </button>
                        ) : (
                          <button 
                            onClick={() => startBookBuild(book.id)}
                            disabled={buildStatus.active}
                            className="px-4 py-1.5 bg-stone-100 text-stone-500 hover:bg-[#c2094c] hover:text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:hover:bg-stone-100 disabled:hover:text-stone-500"
                          >
                            Build Book
                          </button>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expand Chapter Rows if Building */}
                    {isBuilding && buildStatus.chapters && buildStatus.chapters.map((chap: any) => {
                       if (chap.status === 'completed') return null; // Hide completed chapters
                       return (
                          <tr key={\`\${book.id}-\${chap.chapter}\`} className="bg-stone-50/20 border-b border-stone-100">
                             <td className="py-2 px-10 text-xs font-medium text-stone-600">Chapter {chap.chapter}</td>
                             <td className="py-2 px-6">
                               <span className={\`text-[10px] font-bold uppercase tracking-wider \${
                                  chap.status === 'building' ? 'text-orange-600' :
                                  chap.status === 'error' ? 'text-red-500' :
                                  chap.status === 'checking' ? 'text-blue-500' :
                                  'text-stone-400'
                               }\`}>
                                 {chap.message}
                               </span>
                             </td>
                             <td className="py-2 px-6"></td>
                          </tr>
                       );
                    })}
                  </React.Fragment>
                );
              })}
              {books.filter(b => b.testament === builderTab && (!b.completed || (buildStatus.active && buildStatus.bookId === b.id))).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-stone-400 text-sm">All books in this testament are completed!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 flex items-start gap-4 sm:col-span-2 lg:col-span-1 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Engine Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={\`w-2 h-2 rounded-full animate-pulse shadow-sm \${buildStatus.active ? 'bg-orange-500 shadow-orange-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}\`}></span>
              <p className="font-serif text-lg text-slate-900">{buildStatus.active ? 'Building' : 'Active'}</p>
            </div>
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
` + content.substring(endIdx);

  fs.writeFileSync(path, newContent);
  console.log('Successfully updated AdminDashboard.tsx');
} else {
  console.log('Failed to find boundary indices in AdminDashboard.tsx');
}
