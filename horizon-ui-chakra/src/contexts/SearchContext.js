import { createContext, useContext, useState, useCallback } from "react";

export const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  return (
    <SearchContext.Provider
      value={{ searchTerm, setSearchTerm, clearSearch, selectedCategory, setSelectedCategory }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}