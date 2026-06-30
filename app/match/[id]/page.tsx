'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ConfessionCard from '@/components/ConfessionCard'
import ConfessionForm from '@/components/ConfessionForm'

interface Confession {
  id: string
  text: string
  author: string
  status: 'pending' | 'correct' | 'wrong'
  created_at: string
  home_team: string
  away_team: string
}

export default function MatchPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const matchId = params.id as string
  const homeTeam = searchParams.get('home') || 'Home'
  const awayTeam = searchParams.get('away') || 'Away'
  const startTime = searchParams.get('start')
  const kickoffPassed = startTime ? Date.now() > parseInt(startTime) : false

  const [confessions, setConfessions] = useState<Confession[]>([])
  const [score, setScore] = useState({ home: 0, away: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfessions()
    fetchScore()

    const channel = supabase
      .channel('confessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'confessions', filter: `match_id=eq.${matchId}` },
        () => fetchConfessions()
      )
      .subscribe()

    const scoreInterval = setInterval(fetchScore, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(scoreInterval)
    }
  }, [matchId])

  async function fetchConfessions() {
    const { data } = await supabase
      .from('confessions')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
    if (data) setConfessions(data)
    setLoading(false)
  }

  async function fetchScore() {
    try {
      const res = await fetch(`/api/matches/${matchId}`)
      const data = await res.json()
      if (data?.score) {
        setScore(data.score)
        gradeConfessions(data)
      }
    } catch {
      console.log('Using mock score')
    }
  }

  async function gradeConfessions(matchData: any) {
    const { data: pending } = await supabase
      .from('confessions')
      .select('*')
      .eq('match_id', matchId)
      .eq('status', 'pending')

    if (!pending || pending.length === 0) return

    const homeScore = matchData?.score?.home ?? 0
    const awayScore = matchData?.score?.away ?? 0
    const minute = matchData?.minute ?? 0
    const matchOver = minute >= 90 || matchData?.status === 'finished'
    const homeName = homeTeam.toLowerCase()
    const awayName = awayTeam.toLowerCase()

    for (const confession of pending) {
      const text = confession.text.toLowerCase()
      let newStatus: 'correct' | 'wrong' | null = null

      const mentionsHome = text.includes(homeName)
      const mentionsAway = text.includes(awayName)

      // Win predictions: "will win", "gonna win", "beats", "wins this"
      const winWords = ['will win', 'gonna win', 'beats', 'wins this', 'win this', 'take this']
      if (winWords.some((w) => text.includes(w))) {
        if (matchOver) {
          if (mentionsHome && homeScore > awayScore) newStatus = 'correct'
          else if (mentionsHome && awayScore > homeScore) newStatus = 'wrong'
          else if (mentionsAway && awayScore > homeScore) newStatus = 'correct'
          else if (mentionsAway && homeScore > awayScore) newStatus = 'wrong'
          else if (homeScore === awayScore) newStatus = 'wrong'
        }
      }

      // No-score predictions: "won't score", "will not score", "clean sheet", "no goals"
      const noScoreWords = ["won't score", 'will not score', "wont score", 'no goals', 'clean sheet']
      if (noScoreWords.some((w) => text.includes(w))) {
        if (mentionsHome && homeScore > 0) newStatus = 'wrong'
        else if (mentionsAway && awayScore > 0) newStatus = 'wrong'
        else if (matchOver) newStatus = 'correct'
      }

      // Draw predictions: "draw", "level", "tie", "even"
      const drawWords = ['draw', 'level', 'will tie', 'ends even']
      if (drawWords.some((w) => text.includes(w))) {
        if (matchOver) {
          newStatus = homeScore === awayScore ? 'correct' : 'wrong'
        } else if (homeScore !== awayScore) {
          // still possible to draw later, leave pending unless match over
        }
      }

      // Specific scoreline predictions like "2-1" or "3-0"
      const scoreMatch = text.match(/(\d+)\s*-\s*(\d+)/)
      if (scoreMatch) {
        const predictedA = parseInt(scoreMatch[1])
        const predictedB = parseInt(scoreMatch[2])
        if (matchOver) {
          const correctOrder =
            (predictedA === homeScore && predictedB === awayScore) ||
            (predictedA === awayScore && predictedB === homeScore)
          newStatus = correctOrder ? 'correct' : 'wrong'
        }
      }

      // Goal count threshold predictions: "over 2 goals", "under 3 goals"
      const overMatch = text.match(/over\s*(\d+(\.\d+)?)\s*goals?/) 
      const underMatch = text.match(/under\s*(\d+(\.\d+)?)\s*goals?/)
      const totalGoals = homeScore + awayScore
      if (overMatch && matchOver) {
        newStatus = totalGoals > parseFloat(overMatch[1]) ? 'correct' : 'wrong'
      }
      if (underMatch && matchOver) {
        newStatus = totalGoals < parseFloat(underMatch[1]) ? 'correct' : 'wrong'
      }

      if (newStatus) {
        await supabase
          .from('confessions')
          .update({ status: newStatus })
          .eq('id', confession.id)
      }
    }

    fetchConfessions()
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <a href="/" className="text-sm mb-6 block" style={{ color: 'var(--muted)' }}>← Back to matches</a>

        <div className="rounded-lg p-5 mb-6 border" style={{ background: 'rgba(242,239,230,0.04)', borderColor: 'rgba(242,239,230,0.1)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent-win)' }}>🔴 LIVE — FIFA World Cup 2026</p>
          <div className="flex items-center justify-between font-display">
            <span className="text-lg" style={{ color: 'var(--foreground)' }}>{homeTeam}</span>
            <span className="text-4xl px-3" style={{ color: 'var(--accent-win)' }}>{score.home}-{score.away}</span>
            <span className="text-lg" style={{ color: 'var(--foreground)' }}>{awayTeam}</span>
          </div>
        </div>

        <div className="mb-6">
          {kickoffPassed ? (
            <div className="rounded-lg p-4 border text-center" style={{ background: 'rgba(224,79,79,0.08)', borderColor: 'rgba(224,79,79,0.2)' }}>
              <p className="text-sm font-display" style={{ color: 'var(--accent-wrong)' }}>
                🔒 PREDICTIONS CLOSED
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                Kickoff has passed. Catch the next match.
              </p>
            </div>
          ) : (
            <ConfessionForm matchId={matchId} homeTeam={homeTeam} awayTeam={awayTeam} />
          )}
        </div>

        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg h-24 animate-pulse" style={{ background: 'rgba(242,239,230,0.05)' }} />
            ))
          ) : confessions.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No takes yet. Be the first.</p>
          ) : (
            confessions.map((c) => <ConfessionCard key={c.id} confession={c} />)
          )}
        </div>
      </div>
    </main>
  )
}
