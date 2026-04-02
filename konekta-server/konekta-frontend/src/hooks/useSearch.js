import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const searchAll = async (query) => {
  const response = await api.get(`/search/?q=${encodeURIComponent(query)}`);
  return response.data;
};

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useSearch(query) {
  const debouncedQuery = useDebounce(query, 300);
  return useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchAll(debouncedQuery),
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
  });
}
