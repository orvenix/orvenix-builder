import type { EditorTree } from "@/types/editor";

const STORAGE_KEY = "orvenix_user_components";
const MAX_COMPONENTS = 30;

export interface SavedComponent {
  id: string;
  name: string;
  blockType: string;
  tree: EditorTree;
  createdAt: string;
}

export function loadUserComponents(): SavedComponent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedComponent[];
  } catch {
    return [];
  }
}

export function saveUserComponent(name: string, blockType: string, tree: EditorTree): SavedComponent {
  const component: SavedComponent = {
    id: `uc_${Date.now().toString(36)}`,
    name: name.trim() || `${blockType} guardado`,
    blockType,
    tree,
    createdAt: new Date().toISOString(),
  };
  const existing = loadUserComponents();
  const updated = [component, ...existing].slice(0, MAX_COMPONENTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full — remove oldest and retry
    const trimmed = [component, ...existing.slice(0, MAX_COMPONENTS - 5)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
  return component;
}

export function deleteUserComponent(id: string): void {
  const existing = loadUserComponents();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter((c) => c.id !== id)));
}
