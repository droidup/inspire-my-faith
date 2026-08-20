import { promises as fs } from 'fs';

async function updateUseFaithTimeline() {
  const file = 'src/hooks/useFaithTimeline.ts';
  let content = await fs.readFile(file, 'utf8');

  // Add source to TimelineEvent interface
  content = content.replace(
    /version\?: string;/g,
    "version?: string;\n  source?: 'faith' | 'saved';"
  );

  // Map versesData with source: 'saved'
  content = content.replace(
    /version: verse\.version \|\| 'BIBLE',/g,
    "version: verse.version || 'BIBLE',\n          source: 'saved',"
  );

  // Map timelineData with source: 'faith' (we have to do this when creating allEvents)
  content = content.replace(
    /const allEvents = \[\.\.\.\(timelineData\.success \? timelineData\.data : \[\]\), \.\.\.verseEvents\];/g,
    "const mappedTimelineData = (timelineData.success ? timelineData.data : []).map(event => ({\n          ...event,\n          source: event.type === 'verse' ? 'faith' : undefined\n        }));\n        const allEvents = [...mappedTimelineData, ...verseEvents];"
  );

  await fs.writeFile(file, content);
  console.log('Updated useFaithTimeline.ts');
}

async function updateFaithTimeline() {
  const file = 'src/components/FaithTimeline.tsx';
  let content = await fs.readFile(file, 'utf8');

  // Import useSavedVerses
  if (!content.includes("import { useSavedVerses }")) {
    content = content.replace(
      "import { useFaithVerses } from '../hooks/useFaithVerses';",
      "import { useFaithVerses } from '../hooks/useFaithVerses';\nimport { useSavedVerses } from '../hooks/useSavedVerses';"
    );
  }

  // Replace hooks
  content = content.replace(
    "  const { faithVerses, removeVerse: deleteVerse, saveVerse, getSavedVerse } = useFaithVerses();",
    "  const { faithVerses, removeVerse: deleteFaithVerse, saveVerse: saveFaithVerse } = useFaithVerses();\n  const { savedVerses, removeVerse: deleteSavedVerse, saveVerse: saveSavedVerse } = useSavedVerses();"
  );

  // Replace Modal
  const modalReplacement = `
      <FaithVerseEditModal
        isOpen={!!editingVerseId}
        onClose={() => setEditingVerseId(null)}
        verse={
          (() => {
            if (!editingVerseId) return null;
            const event = events.find(e => e.id === editingVerseId);
            if (event?.source === 'saved') return savedVerses.find(v => v.id === editingVerseId) || null;
            return faithVerses.find(v => v.id === editingVerseId) || null;
          })()
        }
        onUpdate={(v) => { 
          const event = events.find(e => e.id === editingVerseId);
          if (event?.source === 'saved') saveSavedVerse(v);
          else saveFaithVerse(v);
          setEditingVerseId(null); 
        }}
        onDelete={(id) => {
          const event = events.find(e => e.id === id);
          if (event?.source === 'saved') deleteSavedVerse(id);
          else deleteFaithVerse(id);
          setEditingVerseId(null);
        }}
        availableCollections={
          (() => {
            if (!editingVerseId) return [];
            const event = events.find(e => e.id === editingVerseId);
            if (event?.source === 'saved') return Array.from(new Set(savedVerses.flatMap(v => v.collections || []))).sort();
            return Array.from(new Set(faithVerses.flatMap(v => v.collections || []))).sort();
          })()
        }
      />`;

  content = content.replace(
    /<FaithVerseEditModal[\s\S]*?\/>/g,
    modalReplacement.trim()
  );

  // Fix deleteVerse in onDelete for TimelineEventCard
  content = content.replace(
    /else if \(event\.type === 'verse'\) deleteVerse\(event\.id\);/g,
    "else if (event.type === 'verse') { if (event.source === 'saved') deleteSavedVerse(event.id); else deleteFaithVerse(event.id); }"
  );

  await fs.writeFile(file, content);
  console.log('Updated FaithTimeline.tsx');
}

async function updateFaithVerseEditModal() {
  const file = 'src/components/FaithVerseEditModal.tsx';
  let content = await fs.readFile(file, 'utf8');

  // Change Title and Subtitle dynamically
  content = content.replace(
    /<h3 className="text-lg font-semibold text-stone-900">Faith Verse<\/h3>/g,
    '<h3 className="text-lg font-semibold text-stone-900">{verse?.version === "DAILY_VERSE" ? "Faith Verse" : "Faith Guide Verse"}</h3>'
  );
  content = content.replace(
    /<p className="text-xs text-stone-500 font-medium">Save to the Faith Verse area<\/p>/g,
    '<p className="text-xs text-stone-500 font-medium">Save to the {verse?.version === "DAILY_VERSE" ? "Faith Verse" : "Faith Guide"} area</p>'
  );

  await fs.writeFile(file, content);
  console.log('Updated FaithVerseEditModal.tsx');
}

Promise.all([
  updateUseFaithTimeline(),
  updateFaithTimeline(),
  updateFaithVerseEditModal()
]).catch(console.error);
