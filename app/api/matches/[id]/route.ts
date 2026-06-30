import { NextResponse } from 'next/server'
import { getMatchDetails } from '@/lib/txline'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const match = await getMatchDetails(id)
    return NextResponse.json(match)
  } catch (error) {
    console.error('Match detail error:', error)
    return NextResponse.json(null)
  }
}
