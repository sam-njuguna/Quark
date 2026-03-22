export interface WorkFilter {
  stage?: string[];
  type?: string[];
  priority?: number[];
  assigneeId?: string;
  teamId?: string;
  search?: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: WorkFilter;
  createdAt: number;
}

const STORAGE_KEY = "quark-work-views";

export function getSavedViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedView[]) : [];
  } catch {
    return [];
  }
}

export function saveView(name: string, filters: WorkFilter): SavedView {
  const views = getSavedViews();
  const newView: SavedView = {
    id: crypto.randomUUID(),
    name,
    filters,
    createdAt: Date.now(),
  };
  views.push(newView);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  return newView;
}

export function deleteView(id: string): void {
  const views = getSavedViews().filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}
