// hooks/usePlaceSearch.js
import { useState, useEffect } from 'react';

const usePlaceSearch = (query) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const clearResults = () => setResults([]);
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/places/search?address=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setResults(data.places);
      } catch (err) {
        if (err.name !== 'AbortError') setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { results, isLoading, clearResults };
};

export default usePlaceSearch;