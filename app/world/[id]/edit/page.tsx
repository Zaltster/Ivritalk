'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface World {
  id: string
  name: string
  code: string
  storyline: string
  vocab: string | null
  grammar: string | null
  creator_id: string
}

export default function EditWorld() {
  const [world, setWorld] = useState<World | null>(null)
  const [name, setName] = useState('')
  const [storyline, setStoryline] = useState('')
  const [vocab, setVocab] = useState('')
  const [grammar, setGrammar] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const worldId = params.id as string

  useEffect(() => {
    loadWorld()
  }, [])

  async function loadWorld() {
    const { data, error } = await supabase
      .from('worlds')
      .select('*')
      .eq('id', worldId)
      .single()

    if (!error && data) {
      setWorld(data)
      setName(data.name)
      setStoryline(data.storyline)
      setVocab(data.vocab || '')
      setGrammar(data.grammar || '')
      setCode(data.code)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error: updateError } = await supabase
      .from('worlds')
      .update({
        name,
        storyline,
        vocab: vocab || null,
        grammar: grammar || null,
        code,
      })
      .eq('id', worldId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
    } else {
      router.push(`/world/${worldId}`)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this world? This will also delete all characters and messages.')) {
      return
    }

    const { error } = await supabase
      .from('worlds')
      .delete()
      .eq('id', worldId)

    if (!error) {
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-900">Loading...</div>
      </div>
    )
  }

  if (!world) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-900">World not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push(`/world/${worldId}`)}
              className="text-gray-700 hover:text-gray-900"
            >
              ← Back to World
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit World</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              World Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="storyline" className="block text-sm font-medium text-gray-700 mb-2">
              Storyline / Context
            </label>
            <textarea
              id="storyline"
              value={storyline}
              onChange={(e) => setStoryline(e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="vocab" className="block text-sm font-medium text-gray-700 mb-2">
              Vocabulary Focus (optional)
            </label>
            <textarea
              id="vocab"
              value={vocab}
              onChange={(e) => setVocab(e.target.value)}
              rows={3}
              placeholder="List Hebrew words/phrases you want characters to use..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="grammar" className="block text-sm font-medium text-gray-700 mb-2">
              Grammar Focus (optional)
            </label>
            <textarea
              id="grammar"
              value={grammar}
              onChange={(e) => setGrammar(e.target.value)}
              rows={3}
              placeholder="Describe grammar patterns you want characters to practice..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              World Code (for sharing)
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete World
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
