import { useEffect, useState } from "react";

/**
 * Keeps the input responsive while delaying work that would otherwise run on
 * every keypress, such as a server-side directory search.
 */
export default function useDebouncedValue(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}
