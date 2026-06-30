const BASE_URL = process.env.NEXT_PUBLIC_TXLINE_BASE_URL || 'https://txline-dev.txodds.com'
const API_TOKEN = process.env.TXLINE_TOKEN

async function getGuestJwt() {
  const res = await fetch(`${BASE_URL}/auth/guest/start`, { method: 'POST' })
  const data = await res.json()
  return data.token
}

function txHeaders(jwt: string) {
  return {
    'Authorization': `Bearer ${jwt}`,
    'X-Api-Token': API_TOKEN || '',
  }
}

export async function getLiveMatches() {
  try {
    const jwt = await getGuestJwt()
    const res = await fetch(`${BASE_URL}/api/fixtures/snapshot`, {
      headers: txHeaders(jwt),
    })
    const data = await res.json()
    const fixtures = Array.isArray(data) ? data : []
    return fixtures
      .filter((f: any) => f.Competition === 'World Cup')
      .map((f: any) => ({
        id: String(f.FixtureId),
        home: { name: f.Participant1 },
        away: { name: f.Participant2 },
        status: 'live',
        score: { home: 0, away: 0 },
        competition: { name: f.Competition },
        startTime: f.StartTime,
      }))
  } catch (error) {
    console.error('TxLINE fixtures error:', error)
    return []
  }
}

export async function getMatchDetails(matchId: string) {
  try {
    const jwt = await getGuestJwt()
    const res = await fetch(`${BASE_URL}/api/scores/snapshot`, {
      headers: txHeaders(jwt),
    })
    const data = await res.json()
    const scores = Array.isArray(data) ? data : []
    const match = scores.find((s: any) => String(s.FixtureId) === matchId)
    if (!match) return null
    return {
      id: matchId,
      score: {
        home: match.Score1 ?? 0,
        away: match.Score2 ?? 0,
      },
      minute: match.Elapsed || 0,
      status: match.Status || 'live',
    }
  } catch (error) {
    console.error('TxLINE scores error:', error)
    return null
  }
}