'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Match {
  id: string
  home: { name: string }
  away: { name: string }
  status: string
  score?: { home: number; away: number }
  competition?: { name: string }
  startTime?: number
}

// Mock matches for when TxLINE is not yet connected
const mockMatches: Match[] = [
  {
    id: 'match-1',
    home: { name: 'France' },
    away: { name: 'Argentina' },
    status: 'live',
    score: { home: 1, away: 0 },
    competition: { name: 'FIFA World Cup 2026' },
  },
  {
    id: 'match-2',
    home: { name: 'Brazil' },
    away: { name: 'England' },
    status: 'live',
    score: { home: 0, away: 0 },
    competition: { name: 'FIFA World Cup 2026' },
  },
  {
    id: 'match-3',
    home: { name: 'Spain' },
    away: { name: 'Germany' },
    status: 'live',
    score: { home: 2, away: 1 },
    competition: { name: 'FIFA World Cup 2026' },
  },
]

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch('/api/matches')
        const data = await res.json()
        if (data && data.length > 0) {
          setMatches(data)
        } else {
          setMatches(mockMatches)
          setUsingMock(true)
        }
      } catch {
        setMatches(mockMatches)
        setUsingMock(true)
      } finally {
        setLoading(false)
      }
    }
    fetchMatches()
  }, [])

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl tracking-tight" style={{ color: 'var(--foreground)' }}>
            CONFESSIONS WALL
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Drop your hot take. The match grades it live.
          </p>
          {usingMock && (
            <p className="text-xs mt-2" style={{ color: 'var(--accent-pending)' }}>
              Showing demo matches - connect TxLINE for live data
            </p>
          )}
        </div>

        <div className="mb-6">
          <a href="/leaderboard" className="text-xs font-display" style={{ color: 'var(--accent-win)' }}>
            🏆 VIEW LEADERBOARD →
          </a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg h-24 animate-pulse" style={{ background: 'rgba(242,239,230,0.05)' }} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <Link key={match.id} href={`/match/${match.id}?home=${match.home.name}&away=${match.away.name}&start=${match.startTime || ''}`}>
                <div
                  className="rounded-lg p-4 transition-all cursor-pointer border"
                  style={{ background: 'rgba(242,239,230,0.04)', borderColor: 'rgba(242,239,230,0.1)' }}
                >
                  <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent-win)' }}>
                    {match.startTime && new Date(match.startTime) > new Date()
                      ? `📅 ${new Date(match.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                      : '🔴 LIVE'} — {match.competition?.name || 'World Cup 2026'}
                  </p>
                  <div className="flex items-center justify-between font-display">
                    <span className="text-base" style={{ color: 'var(--foreground)' }}>{match.home.name}</span>
                    <span className="text-2xl px-3" style={{ color: 'var(--accent-win)' }}>
                      {match.score?.home ?? 0}-{match.score?.away ?? 0}
                    </span>
                    <span className="text-base" style={{ color: 'var(--foreground)' }}>{match.away.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}