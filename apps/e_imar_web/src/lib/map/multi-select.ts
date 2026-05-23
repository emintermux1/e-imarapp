export function toggleMultiSelection(ids: string[], id: string, limit = 250): string[] {
  if (!id) return ids;
  if (ids.includes(id)) return ids.filter((item) => item !== id);
  return [...ids, id].slice(0, limit);
}

export function mergeMultiSelection(ids: string[], nextIds: string[], limit = 250): { ids: string[]; truncated: boolean } {
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const id of [...ids, ...nextIds]) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (merged.length < limit) merged.push(id);
  }
  return { ids: merged, truncated: seen.size > limit };
}
