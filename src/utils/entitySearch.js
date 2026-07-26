export function normalizeSearchValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesEntitySearch(item, query, getValues) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  const values = getValues(item)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(normalizeSearchValue)
    .filter(Boolean);
  const haystack = values.join(" ");
  const compactHaystack = haystack.replace(/[^\p{L}\p{N}]/gu, "");

  return normalizedQuery.split(" ").every((token) => {
    const compactToken = token.replace(/[^\p{L}\p{N}]/gu, "");
    return (
      haystack.includes(token) ||
      (compactToken && compactHaystack.includes(compactToken))
    );
  });
}
