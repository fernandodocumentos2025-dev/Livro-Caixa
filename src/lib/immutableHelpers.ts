export function addToList<T>(list: T[], item: T): T[] {
  return [...list, item];
}

export function updateInList<T extends { id: string }>(list: T[], id: string, updates: Partial<T>): T[] {
  return list.map(item => item.id === id ? { ...item, ...updates } : item);
}

export function removeFromList<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter(item => item.id !== id);
}

export function replaceList<T>(newList: T[]): T[] {
  return [...newList];
}
