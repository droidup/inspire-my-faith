import { promises as fs } from 'fs';

async function fixFaithVerses() {
  const file = 'src/components/FaithVerses.tsx';
  let content = await fs.readFile(file, 'utf8');

  // Import useSavedVerses
  content = content.replace(
    "import { useFaithVerses } from '../hooks/useFaithVerses';",
    "import { useFaithVerses } from '../hooks/useFaithVerses';\nimport { useSavedVerses } from '../hooks/useSavedVerses';"
  );

  // Replace hook calls
  content = content.replace(
    "  const { faithVerses, loading, removeVerse, saveVerse } = useFaithVerses();",
    "  const { faithVerses, loading: fLoading, removeVerse: removeFaithVerse, saveVerse: saveFaithVerse } = useFaithVerses();\n  const { savedVerses, loading: sLoading, removeVerse: removeSavedVerse, saveVerse: saveSavedVerse } = useSavedVerses();\n  const loading = fLoading || sLoading;\n\n  const allVersesMap = new Map();\n  savedVerses.forEach(v => allVersesMap.set(v.id, { ...v, _source: 'saved' }));\n  faithVerses.forEach(v => allVersesMap.set(v.id, { ...v, _source: 'faith' }));\n  const combinedVerses = Array.from(allVersesMap.values());\n\n  const saveVerse = (v) => {\n    if (v._source === 'saved') saveSavedVerse(v);\n    else saveFaithVerse(v);\n  };\n  const removeVerse = (id) => {\n    const v = combinedVerses.find(verse => verse.id === id);\n    if (v?._source === 'saved') removeSavedVerse(id);\n    else removeFaithVerse(id);\n  };"
  );

  // Replace faithVerses with combinedVerses
  content = content.replace(/faithVerses\.map/g, 'combinedVerses.map');
  content = content.replace(/faithVerses\.find/g, 'combinedVerses.find');
  content = content.replace(/faithVerses\.some/g, 'combinedVerses.some');
  content = content.replace(/faithVerses\.flatMap/g, 'combinedVerses.flatMap');

  await fs.writeFile(file, content);
  console.log('Fixed FaithVerses.tsx');
}

fixFaithVerses().catch(console.error);
