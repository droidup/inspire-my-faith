export interface Bookmark {
  id: string;
  bookName: string;
  chapter: number;
  verseNum: number;
  text: string;
  version: string;
  timestamp: number; // local sorting
}

const LOCAL_KEY = 'inspire_my_faith_bookmarks';

export const getBookmarks = async (userId: string | null): Promise<Bookmark[]> => {
  if (userId) {
    try {
      const response = await fetch(`/api/user/bookmarks/${userId}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data as Bookmark[];
      }
      return getLocalBookmarks();
    } catch (e) {
      console.error("Error fetching bookmarks from API", e);
      return getLocalBookmarks(); // fallback
    }
  } else {
    return getLocalBookmarks();
  }
};

const getLocalBookmarks = (): Bookmark[] => {
  try {
    const data = localStorage.getItem(LOCAL_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addBookmark = async (userId: string | null, bookmark: Bookmark) => {
  let bookmarks = await getLocalBookmarks();
  
  // Remove if exists locally
  bookmarks = bookmarks.filter(b => !(b.bookName === bookmark.bookName && b.chapter === bookmark.chapter && b.verseNum === bookmark.verseNum));
  
  // Add to top
  bookmark.timestamp = Date.now();
  bookmarks.unshift(bookmark);
  
  // Keep only last 5 locally
  if (bookmarks.length > 5) {
    bookmarks = bookmarks.slice(0, 5);
  }
  
  // Always update local storage as a fallback / immediate update
  localStorage.setItem(LOCAL_KEY, JSON.stringify(bookmarks));

  if (userId) {
    try {
      const response = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bookmark })
      });
      if (!response.ok) throw new Error('Network response was not ok');
    } catch (e) {
      console.error("Error saving bookmark to API", e);
    }
  }
};

export const removeBookmark = async (userId: string | null, id: string) => {
  let bookmarks = getLocalBookmarks();
  bookmarks = bookmarks.filter(b => b.id !== id);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(bookmarks));

  if (userId) {
    try {
      const response = await fetch(`/api/user/bookmarks/${id}?userId=${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Network response was not ok');
    } catch (e) {
      console.error("Error deleting bookmark", e);
    }
  }
};
