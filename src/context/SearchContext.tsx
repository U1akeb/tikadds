import { ReactNode, createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SearchContextValue {
  input: string;
  setInput: (value: string) => void;
  activeQuery: string;
  submit: (value?: string) => void;
  clear: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const location = useLocation();

  const isSearchableRoute = useMemo(
    () => ["/", "/jobs", "/search"].includes(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    if (!isSearchableRoute) {
      setInput("");
      setActiveQuery("");
    }
  }, [isSearchableRoute]);

  useEffect(() => {
    if (location.pathname !== "/search") {
      return;
    }
    const params = new URLSearchParams(location.search);
    const qParam = (params.get("q") ?? "").trim();
    setInput(qParam);
    setActiveQuery(qParam);
  }, [location.pathname, location.search, setInput, setActiveQuery]);

  const handleInput = useCallback((value: string) => {
    setInput(value);
  }, []);

  const submit = useCallback((value?: string) => {
    const next = (value ?? input).trim();
    setActiveQuery(next);
    if (!value) {
      setInput(next);
    }
  }, [input]);

  const clear = useCallback(() => {
    setInput("");
    setActiveQuery("");
  }, []);

  const value = useMemo(
    () => ({
      input,
      setInput: handleInput,
      activeQuery,
      submit,
      clear,
    }),
    [input, handleInput, activeQuery, submit, clear],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
