'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getAuthorId, getSavedName, saveName } from '@/lib/identity'

interface Props {
  matchId: string
  homeTeam: string
  awayTeam: string
}

export default function ConfessionForm({ matchId, homeTeam, awayTeam }: Props) {
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [nameError, setNameError] = useState('')
  const [suggestedName, setSuggestedName] = useState('')

  useEffect(() => {
    const saved = getSavedName()
    if (saved) setAuthor(saved)
  }, [])

  const checkNameAvailable = async (name: string) => {
    const myId = getAuthorId()
    const { data } = await supabase
      .from('confessions')
      .select('author, author_id')
      .eq('author', name)
      .limit(1)

    if (data && data.length > 0 && data[0].author_id !== myId) {
      const tag = Math.floor(1000 + Math.random() * 9000)
      setNameError(`"${name}" is already taken.`)
      setSuggestedName(`${name}#${tag}`)
      return false
    }
    setNameError('')
    setSuggestedName('')
    return true
  }

  const handleSubmit = async () => {
    if (!text.trim() || !author.trim()) return
    setLoading(true)

    const available = await checkNameAvailable(author.trim())
    if (!available) {
      setLoading(false)
      return
    }

    const myId = getAuthorId()
    const { error } = await supabase.from('confessions').insert({
      match_id: matchId,
      home_team: homeTeam,
      away_team: awayTeam,
      text: text.trim(),
      author: author.trim(),
      author_id: myId,
      status: 'pending',
    })

    if (!error) {
      saveName(author.trim())
      setText('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }

    setLoading(false)
  }

  return (
    <div className="rounded-lg p-4 space-y-3 border" style={{ background: 'rgba(242,239,230,0.04)', borderColor: 'rgba(242,239,230,0.1)' }}>
      <p className="font-display text-sm" style={{ color: 'var(--foreground)' }}>DROP YOUR HOT TAKE</p>

      <div>
        <input
          type="text"
          placeholder="Your name or nickname"
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value)
            setNameError('')
          }}
          className="w-full rounded-md px-3 py-2 text-sm outline-none border"
          style={{ background: 'rgba(242,239,230,0.06)', color: 'var(--foreground)', borderColor: 'rgba(242,239,230,0.1)' }}
        />
        {nameError && (
          <div className="mt-2 text-xs" style={{ color: 'var(--accent-wrong)' }}>
            {nameError}{' '}
            <button
              onClick={() => {
                setAuthor(suggestedName)
                setNameError('')
              }}
              className="underline"
              style={{ color: 'var(--accent-win)' }}
            >
              Use {suggestedName} instead
            </button>
          </div>
        )}
      </div>

      <textarea
        placeholder={`e.g. "${homeTeam} won't score in the first half"`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none border"
        style={{ background: 'rgba(242,239,230,0.06)', color: 'var(--foreground)', borderColor: 'rgba(242,239,230,0.1)' }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim() || !author.trim()}
        className="w-full font-display py-2 rounded-md text-sm disabled:opacity-40 transition-colors"
        style={{ background: 'var(--accent-win)', color: 'var(--background)' }}
      >
        {loading ? 'POSTING...' : submitted ? 'POSTED ✓' : 'POST TAKE'}
      </button>
    </div>
  )
}