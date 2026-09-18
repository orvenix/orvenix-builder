export function buildEditorPageUrl(pathname: string | null, search: string, slug: string) {
  if (!pathname) return null;

  const params = new URLSearchParams(search);
  if (slug === "home") params.delete("page");
  else params.set("page", slug);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
