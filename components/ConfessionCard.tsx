'use client'

import { getAuthorId } from '@/lib/identity'

interface Confession {
  id: string
  text: string
  author: string
  author_id?: string
  status: 'pending' | 'correct' | 'wrong'
  created_at: string
  home_team: string
  away_team: string
}

const statusConfig = {
  pending: { label: '⏳ Pending', color: 'var(--accent-pending)' },
  correct: { label: '🏆 Called it', color: 'var(--accent-win)' },
  wrong: { label: '🔥 Aged badly', color: 'var(--accent-wrong)' },
}

export default function ConfessionCard({ confession }: { confession: Confession }) {
  const config = statusConfig[confession.status]
  const isMine = confession.author_id && confession.author_id === getAuthorId()

  const shareText = `${confession.home_team} 🆚 ${confession.away_team}\n\n"${confession.text}" — ${confession.author}\n\n${
    confession.status === 'correct' ? 'Called it! 🏆' : confession.status === 'wrong' ? 'Aged badly 🔥' : 'Still waiting... ⏳'
  }\n\nGrade your own take 👉 confessions-wall.vercel.app\n\n#WorldCup2026`

  const handleShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  return (
    <div
      className="rounded-lg border p-4 transition-all duration-500"
      style={{ background: 'rgba(242,239,230,0.04)', borderColor: 'rgba(242,239,230,0.1)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-base leading-snug" style={{ color: 'var(--foreground)' }}>"{confession.text}"</p>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>— {confession.author}</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0" style={{ color: config.color, background: 'rgba(242,239,230,0.06)' }}>
          {config.label}
        </span>
      </div>
      {isMine && (
        <div className="mt-3 flex justify-end">
          <button onClick={handleShare} className="text-xs transition-colors" style={{ color: 'var(--muted)' }}>
            Share on X
          </button>
        </div>
      )}
    </div>
  )
}