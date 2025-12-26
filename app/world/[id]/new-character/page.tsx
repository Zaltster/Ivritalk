'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NewCharacter() {
  const [name, setName] = useState('')
  const [whatDidIDo, setWhatDidIDo] = useState('')
  const [externalQualities, setExternalQualities] = useState('')
  const [internalQualities, setInternalQualities] = useState('')
  const [instructions, setInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const worldId = params.id as string

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const { error: insertError } = await supabase
      .from('characters')
      .insert({
        world_id: worldId,
        creator_id: user.id,
        name,
        what_did_i_do: whatDidIDo,
        external_qualities: externalQualities,
        internal_qualities: internalQualities,
        instructions,
        image_url: imageUrl || null,
        published: false,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push(`/world/${worldId}`)
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create a Character</h1>

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
              placeholder="e.g., The Lion"
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
              placeholder="https://example.com/image.jpg"
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
              placeholder="Describe what this character does in the story..."
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
              placeholder="Describe the character's appearance..."
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
              placeholder="Describe the character's personality..."
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
              placeholder="Special instructions for how this character should behave..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Character'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
