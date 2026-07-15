/**
 * Highlights occurrences of `query` inside `text` for search result display.
 *
 * Output is HTML-safe: the text is escaped before the query is wrapped in
 * `<mark>`. Callers must use `v-html` on the result.
 */
export function highlightText(text: string, query: string): string {
  if (!query || !text) return text

  const div = document.createElement('div')
  div.innerText = text
  const escapedText = div.innerHTML

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>')
}
