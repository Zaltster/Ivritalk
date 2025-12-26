'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function JoinWorld() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    // Find world by code
    const { data: world, error: worldError } = await supabase
      .from('worlds')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (worldError || !world) {
      setError('World not found. Please check the code and try again.')
      setLoading(false)
      return
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('world_members')
      .select('*')
      .eq('world_id', world.id)
      .eq('user_id', user.id)
      .single()

    if (!existingMember) {
      // Add user as member
      const { error: joinError } = await supabase
        .from('world_members')
        .insert({
          world_id: world.id,
          user_id: user.id,
        })

      if (joinError) {
        setError('Failed to join world. Please try again.')
        setLoading(false)
        return
      }
    }

    // Redirect to world
    router.push(`/world/${world.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-700 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Join a World</h1>

        <form onSubmit={handleJoin} className="bg-white p-8 rounded-lg shadow">
          <div className="mb-6">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Enter World Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="ABCDEF"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-center text-lg"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="mb-4 text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 4}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join World'}
          </button>
        </form>
      </main>
    </div>
  )
}
