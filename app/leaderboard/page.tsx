'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PlayerStats {
  author: string
  correct: number
  wrong: number
  pending: number
  total: number
}

export default function Leaderboard() {
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  async function fetchLeaderboard() {
    const { data } = await supabase.from('confessions').select('*')
    if (!data) {
      setLoading(false)
      return
    }

    const map: Record<string, PlayerStats> = {}
    data.forEach((c: any) => {
      if (!map[c.author]) {
        map[c.author] = { author: c.author, correct: 0, wrong: 0, pending: 0, total: 0 }
      }
      map[c.author].total += 1
      if (c.status === 'correct') map[c.author].correct += 1
      if (c.status === 'wrong') map[c.author].wrong += 1
      if (c.status === 'pending') map[c.author].pending += 1
    })

    const sorted = Object.values(map).sort((a, b) => b.correct - a.correct)
    setPlayers(sorted)
    setLoading(false)
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-lg mx-auto px-4 py-10">
        <a href="/" className="text-sm mb-6 block" style={{ color: 'var(--muted)' }}>← Back to matches</a>

        <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--foreground)' }}>LEADERBOARD</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Who's calling it right this World Cup</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg h-16 animate-pulse" style={{ background: 'rgba(242,239,230,0.05)' }} />
            ))}
          </div>
        ) : players.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No takes yet. Go drop one.</p>
        ) : (
          <div className="space-y-2">
            {players.map((p, i) => (
              <div
                key={p.author}
                className="rounded-lg p-4 flex items-center justify-between border"
                style={{ background: 'rgba(242,239,230,0.04)', borderColor: 'rgba(242,239,230,0.1)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg w-6" style={{ color: i === 0 ? 'var(--accent-pending)' : 'var(--muted)' }}>
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--foreground)' }}>{p.author}</span>
                </div>
                <div className="flex gap-3 text-xs font-display">
                  <span style={{ color: 'var(--accent-win)' }}>{p.correct}W</span>
                  <span style={{ color: 'var(--accent-wrong)' }}>{p.wrong}L</span>
                  <span style={{ color: 'var(--accent-pending)' }}>{p.pending}P</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}