'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import Link from 'next/link'

interface World {
  id: string
  name: string
  code: string
  storyline: string
  creator_id: string
}

export default function Dashboard() {
  const [worlds, setWorlds] = useState<World[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

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
    loadWorlds(user.id)
  }

  async function loadWorlds(userId: string) {
    const { data, error } = await supabase
      .from('worlds')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setWorlds(data)
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-indigo-600">Ivritalk</h1>
            <button
              onClick={handleSignOut}
              className="text-gray-700 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Worlds</h2>
          <div className="flex gap-3">
            <Link
              href="/join"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Join World
            </Link>
            <Link
              href="/dashboard/new-world"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create New World
            </Link>
          </div>
        </div>

        {worlds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">You haven't created any worlds yet</p>
            <Link
              href="/dashboard/new-world"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Create your first world
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {worlds.map((world) => (
              <Link
                key={world.id}
                href={`/world/${world.id}`}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{world.name}</h3>
                <p className="text-gray-600 mb-3 line-clamp-2">{world.storyline}</p>
                <div className="text-sm text-indigo-600 font-mono">Code: {world.code}</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
