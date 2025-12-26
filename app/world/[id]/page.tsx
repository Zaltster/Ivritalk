'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface World {
  id: string
  name: string
  code: string
  storyline: string
  creator_id: string
}

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

export default function WorldPage() {
  const [world, setWorld] = useState<World | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const worldId = params.id as string

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    loadWorld()
    loadCharacters()
  }

  async function loadWorld() {
    const { data, error } = await supabase
      .from('worlds')
      .select('*')
      .eq('id', worldId)
      .single()

    if (!error && data) {
      setWorld(data)
    }
    setLoading(false)
  }

  async function loadCharacters() {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('world_id', worldId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setCharacters(data)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!world) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">World not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-700 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-indigo-600">{world.name}</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Storyline</h2>
          <p className="text-gray-700 mb-4">{world.storyline}</p>
          <div className="flex gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">World Code:</span>{' '}
              <span className="font-mono text-indigo-600">{world.code}</span>
            </div>
            <Link
              href={`/world/${world.id}/chat`}
              className="ml-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Chat
            </Link>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Characters</h2>
          <Link
            href={`/world/${world.id}/new-character`}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create New Character
          </Link>
        </div>

        {characters.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">No characters yet</p>
            <Link
              href={`/world/${world.id}/new-character`}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Create your first character
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <div
                key={character.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
              >
                {character.image_url && (
                  <img
                    src={character.image_url}
                    alt={character.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{character.name}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  <span className="font-semibold">Role:</span> {character.what_did_i_do}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/world/${world.id}/character/${character.id}`}
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    Edit
                  </Link>
                  {character.published && (
                    <span className="ml-auto text-green-600 text-sm">Published</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
