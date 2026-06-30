export function getAuthorId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('confessions_author_id')
  if (!id) {
    id = 'u_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('confessions_author_id', id)
  }
  return id
}

export function getSavedName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('confessions_author_name') || ''
}

export function saveName(name: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('confessions_author_name', name)
}