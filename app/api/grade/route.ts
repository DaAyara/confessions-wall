import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const BASE_URL = process.env.NEXT_PUBLIC_TXLINE_BASE_URL!
const API_TOKEN = process.env.TXLINE_TOKEN!

async function getGuestJwt() {
  const res = await fetch(`${BASE_URL}/auth/guest/start`, { method: 'POST' })
  const data = await res.json()
  return data.token
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const jwt = await getGuestJwt()
    const headers = {
      Authorization: `Bearer ${jwt}`,
      'X-Api-Token': API_TOKEN,
    }

    const scoresRes = await fetch(`${BASE_URL}/api/scores/snapshot`, { headers })
    const scoresData = await scoresRes.json()
    const scores = Array.isArray(scoresData) ? scoresData : []

    const { data: pending } = await supabase
      .from('confessions')
      .select('*')
      .eq('status', 'pending')

    if (!pending || pending.length === 0) {
      return NextResponse.json({ graded: 0 })
    }

    let graded = 0

    for (const confession of pending) {
      const match = scores.find((s: any) => String(s.FixtureId) === confession.match_id)
      if (!match) continue

      const homeScore = match.Score1 ?? 0
      const awayScore = match.Score2 ?? 0
      const minute = match.Elapsed ?? 0
      const matchOver = minute >= 90 || match.Status === 'finished' || match.Status === 'FT'
      const text = confession.text.toLowerCase()
      const homeName = confession.home_team.toLowerCase()
      const awayName = confession.away_team.toLowerCase()

      let newStatus: 'correct' | 'wrong' | null = null

      const winWords = ['will win', 'gonna win', 'beats', 'wins this', 'win this', 'take this']
      if (winWords.some((w) => text.includes(w))) {
        if (matchOver) {
          if (text.includes(homeName) && homeScore > awayScore) newStatus = 'correct'
          else if (text.includes(homeName) && awayScore >= homeScore) newStatus = 'wrong'
          else if (text.includes(awayName) && awayScore > homeScore) newStatus = 'correct'
          else if (text.includes(awayName) && homeScore >= awayScore) newStatus = 'wrong'
        }
      }

      const noScoreWords = ["won't score", 'will not score', 'wont score', 'no goals', 'clean sheet']
      if (noScoreWords.some((w) => text.includes(w))) {
        if (text.includes(homeName) && homeScore > 0) newStatus = 'wrong'
        else if (text.includes(awayName) && awayScore > 0) newStatus = 'wrong'
        else if (matchOver) newStatus = 'correct'
      }

      const drawWords = ['draw', 'level', 'will tie', 'ends even']
      if (drawWords.some((w) => text.includes(w))) {
        if (matchOver) newStatus = homeScore === awayScore ? 'correct' : 'wrong'
      }

      const scoreMatch = text.match(/(\d+)\s*-\s*(\d+)/)
      if (scoreMatch && matchOver) {
        const a = parseInt(scoreMatch[1])
        const b = parseInt(scoreMatch[2])
        const correct = (a === homeScore && b === awayScore) || (a === awayScore && b === homeScore)
        newStatus = correct ? 'correct' : 'wrong'
      }

      const overMatch = text.match(/over\s*(\d+(\.\d+)?)\s*goals?/)
      const underMatch = text.match(/under\s*(\d+(\.\d+)?)\s*goals?/)
      const total = homeScore + awayScore
      if (overMatch && matchOver) newStatus = total > parseFloat(overMatch[1]) ? 'correct' : 'wrong'
      if (underMatch && matchOver) newStatus = total < parseFloat(underMatch[1]) ? 'correct' : 'wrong'

      if (newStatus) {
        await supabase.from('confessions').update({ status: newStatus }).eq('id', confession.id)
        graded++
      }
    }

    return NextResponse.json({ graded })
  } catch (error) {
    console.error('Grade error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}