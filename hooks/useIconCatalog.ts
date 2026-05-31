// Stub para useIconCatalog
export interface IconCatalogEntry {
  name: string;
  component: React.ComponentType<Record<string, unknown>>;
}

export function useIconCatalog(_query?: string) {
  void _query;
  return {
    results: [] as IconCatalogEntry[],
    loading: false,
    totalCount: 0,
  };
}
