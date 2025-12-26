'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Character {
  id: string
  name: string
  what_did_i_do: string
  external_qualities: string
  internal_qualities: string
  instructions: string
  image_url: string | null
  published: boolean
}

export default function EditCharacter() {
  const [character, setCharacter] = useState<Character | null>(null)
  const [name, setName] = useState('')
  const [whatDidIDo, setWhatDidIDo] = useState('')
  const [externalQualities, setExternalQualities] = useState('')
  const [internalQualities, setInternalQualities] = useState('')
  const [instructions, setInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const worldId = params.id as string
  const characterId = params.characterId as string

  useEffect(() => {
    loadCharacter()
  }, [])

  async function loadCharacter() {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()

    if (!error && data) {
      setCharacter(data)
      setName(data.name)
      setWhatDidIDo(data.what_did_i_do)
      setExternalQualities(data.external_qualities)
      setInternalQualities(data.internal_qualities)
      setInstructions(data.instructions)
      setImageUrl(data.image_url || '')
      setPublished(data.published)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error: updateError } = await supabase
      .from('characters')
      .update({
        name,
        what_did_i_do: whatDidIDo,
        external_qualities: externalQualities,
        internal_qualities: internalQualities,
        instructions,
        image_url: imageUrl || null,
        published,
      })
      .eq('id', characterId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
    } else {
      router.push(`/world/${worldId}`)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this character?')) {
      return
    }

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)

    if (!error) {
      router.push(`/world/${worldId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Character not found</div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Character</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Character Name
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
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Character Image URL (optional)
            </label>
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="whatDidIDo" className="block text-sm font-medium text-gray-700 mb-2">
              What did I do?
            </label>
            <textarea
              id="whatDidIDo"
              value={whatDidIDo}
              onChange={(e) => setWhatDidIDo(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="externalQualities" className="block text-sm font-medium text-gray-700 mb-2">
              External Qualities
            </label>
            <textarea
              id="externalQualities"
              value={externalQualities}
              onChange={(e) => setExternalQualities(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="internalQualities" className="block text-sm font-medium text-gray-700 mb-2">
              Internal Qualities
            </label>
            <textarea
              id="internalQualities"
              value={internalQualities}
              onChange={(e) => setInternalQualities(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
              Instructions / Guidelines
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <input
              id="published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
              Publish this character (make it available for chat)
            </label>
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
              Delete
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
