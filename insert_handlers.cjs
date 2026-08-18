const fs = require('fs');
const content = fs.readFileSync('src/components/BibleReader.tsx', 'utf-8');

const handlers = `  const handleNextChapter = async () => {
    if (!selectedBook) return;
    if (selectedChapter < chapterCount) {
      handleSelectChapter(selectedChapter + 1);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const currentIndex = books.findIndex(b => b.id === selectedBook.id);
      if (currentIndex !== -1 && currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setSelectedBook(nextBook);
        setTestament(nextBook.testament);
        try {
          const res = await fetch(\`/api/bible/books/\${nextBook.id}/chapters\`);
          const data = await res.json();
          if (data.success) {
            setChapterCount(data.data);
            setSelectedChapter(1);
            setIsSummaryOpen(false);
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (e) { console.error(e); }
      }
    }
  };

  const handlePrevChapter = async () => {
    if (!selectedBook) return;
    if (selectedChapter > 1) {
      handleSelectChapter(selectedChapter - 1);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const currentIndex = books.findIndex(b => b.id === selectedBook.id);
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        setSelectedBook(prevBook);
        setTestament(prevBook.testament);
        try {
          const res = await fetch(\`/api/bible/books/\${prevBook.id}/chapters\`);
          const data = await res.json();
          if (data.success) {
            setChapterCount(data.data);
            setSelectedChapter(data.data);
            setIsSummaryOpen(false);
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (e) { console.error(e); }
      }
    }
  };
`;

if (!content.includes('handleNextChapter = async')) {
  const target = 'const handleSelectChapter = (chapter: number) => {';
  const newContent = content.replace(target, handlers + '\n  ' + target);
  fs.writeFileSync('src/components/BibleReader.tsx', newContent);
  console.log('Handlers inserted.');
} else {
  console.log('Handlers already exist.');
}
