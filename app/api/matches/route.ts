import { NextResponse } from 'next/server'
import { getLiveMatches } from '@/lib/txline'

export async function GET() {
  try {
    const matches = await getLiveMatches()
    return NextResponse.json(matches)
  } catch (error) {
    console.error('Matches API error:', error)
    return NextResponse.json([])
  }
}
