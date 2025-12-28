'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAudioQueue } from '@/hooks/useAudioQueue'

interface World {
  id: string
  name: string
  storyline: string
}

interface Character {
  id: string
  name: string
  image_url: string | null
}

interface Message {
  id: string
  character_id: string | null
  user_id: string | null
  content: string
  character_name?: string
  is_system: boolean
  created_at: string
}

export default function ChatPage() {
  const [world, setWorld] = useState<World | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoModeRef = useRef(false)
  const ttsEnabledRef = useRef(false)
  const router = useRouter()
  const params = useParams()
  const worldId = params.id as string
  const { addToQueue, playImmediate, isPlaying, currentlyPlaying } = useAudioQueue()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

      // If TTS is enabled and auto mode is active, speak new character messages
      const lastMessage = messages[messages.length - 1]
      if (ttsEnabledRef.current && autoModeRef.current && lastMessage.character_id) {
        addToQueue(lastMessage.content, lastMessage.id)
      }
    }
  }, [messages, addToQueue])

  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled
  }, [ttsEnabled])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    loadWorld()
    loadCharacters()
    loadMessages()
    subscribeToMessages()
  }

  async function loadWorld() {
    const { data } = await supabase
      .from('worlds')
      .select('id, name, storyline')
      .eq('id', worldId)
      .single()

    if (data) {
      setWorld(data)
    }
    setLoading(false)
  }

  async function loadCharacters() {
    const { data } = await supabase
      .from('characters')
      .select('id, name, image_url')
      .eq('world_id', worldId)
      .eq('published', true)

    if (data) {
      setCharacters(data)
    }
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('world_id', worldId)
      .order('created_at', { ascending: true })

    if (data) {
      const messagesWithNames = await Promise.all(
        data.map(async (msg) => {
          if (msg.character_id) {
            const { data: char } = await supabase
              .from('characters')
              .select('name')
              .eq('id', msg.character_id)
              .single()
            return { ...msg, character_name: char?.name }
          }
          return msg
        })
      )
      setMessages(messagesWithNames)
    }
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel(`world:${worldId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `world_id=eq.${worldId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message
          if (newMessage.character_id) {
            const { data: char } = await supabase
              .from('characters')
              .select('name')
              .eq('id', newMessage.character_id)
              .single()
            newMessage.character_name = char?.name
          }
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  function toggleCharacter(characterId: string) {
    const newSet = new Set(selectedCharacters)
    if (newSet.has(characterId)) {
      newSet.delete(characterId)
    } else {
      newSet.add(characterId)
    }
    setSelectedCharacters(newSet)
  }

  async function sendMessage() {
    if (!input.trim() || !user) return

    setSending(true)

    // Save user message
    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert({
        world_id: worldId,
        user_id: user.id,
        content: input,
        is_system: false,
      })
      .select()
      .single()

    const userMessage = input
    setInput('')

    // Reload messages to show user message immediately
    await loadMessages()

    // Get conversation history for context
    const conversationHistory = messages.slice(-10).map((msg) => ({
      role: msg.character_id ? ('assistant' as const) : ('user' as const),
      content: msg.character_name ? `${msg.character_name}: ${msg.content}` : msg.content,
    }))

    // Get responses from selected characters
    for (const characterId of Array.from(selectedCharacters)) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worldId,
            characterId,
            userMessage,
            conversationHistory,
            isAutoMode: false,
          }),
        })

        const data = await response.json()

        if (data.response) {
          await supabase
            .from('chat_messages')
            .insert({
              world_id: worldId,
              character_id: characterId,
              content: data.response,
              is_system: false,
            })

          // Reload messages to show the new response immediately
          await loadMessages()
        }
      } catch (error) {
        console.error('Error getting character response:', error)
      }
    }

    setSending(false)
  }

  async function startAutoConversation() {
    if (selectedCharacters.size < 2) {
      alert('Please select at least 2 characters for auto conversation')
      return
    }

    setAutoMode(true)
    autoModeRef.current = true

    // Run the conversation loop
    runAutoConversation()
  }

  function stopAutoConversation() {
    setAutoMode(false)
    autoModeRef.current = false
  }

  async function runAutoConversation() {
    const selectedCharsArray = Array.from(selectedCharacters)
    let currentCharIndex = 0

    while (autoModeRef.current) {
      // Get the current character
      const currentCharId = selectedCharsArray[currentCharIndex]

      // Get conversation history
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.character_id ? ('assistant' as const) : ('user' as const),
        content: msg.character_name ? `${msg.character_name}: ${msg.content}` : msg.content,
      }))

      try {
        // Get character response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worldId,
            characterId: currentCharId,
            userMessage: 'Continue the conversation naturally with the other characters.',
            conversationHistory,
            isAutoMode: true,
          }),
        })

        const data = await response.json()

        if (data.response) {
          // Save the message
          await supabase
            .from('chat_messages')
            .insert({
              world_id: worldId,
              character_id: currentCharId,
              content: data.response,
              is_system: false,
            })

          // Reload messages
          await loadMessages()
        }
      } catch (error) {
        console.error('Error in auto conversation:', error)
      }

      // Move to next character
      currentCharIndex = (currentCharIndex + 1) % selectedCharsArray.length

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 2000))
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push(`/world/${worldId}`)}
              className="text-gray-700 hover:text-gray-900"
            >
              ← Back to World
            </button>
            <h1 className="text-2xl font-bold text-indigo-600">{world.name} - Chat</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Character Selection */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-4">Select Characters</h3>
          <div className="space-y-2">
            {characters.map((character) => (
              <div
                key={character.id}
                onClick={() => toggleCharacter(character.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCharacters.has(character.id)
                    ? 'bg-indigo-100 border-2 border-indigo-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {character.image_url && (
                    <img
                      src={character.image_url}
                      alt={character.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium text-sm text-gray-900">{character.name}</span>
                </div>
              </div>
            ))}
          </div>
          {characters.length === 0 && (
            <p className="text-sm text-gray-500">No published characters yet</p>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.character_id ? 'justify-start' : 'justify-end'} group`}
              >
                <div className="flex items-start gap-2">
                  {message.character_id && (
                    <button
                      onClick={() => playImmediate(message.content)}
                      disabled={isPlaying && currentlyPlaying === message.id}
                      className="mt-2 text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      title="Read aloud"
                    >
                      {isPlaying && currentlyPlaying === message.id ? '🔊' : '🔉'}
                    </button>
                  )}
                  <div
                    className={`max-w-2xl rounded-lg p-4 ${
                      message.character_id
                        ? 'bg-white border border-gray-200 text-gray-900'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {message.character_name && (
                      <div className="font-bold text-sm mb-1 text-indigo-600">
                        {message.character_name}
                      </div>
                    )}
                    <div className={`whitespace-pre-wrap ${message.character_id ? 'text-gray-900' : 'text-white'}`}>
                      {message.content}
                    </div>
                  </div>
                  {!message.character_id && (
                    <button
                      onClick={() => playImmediate(message.content)}
                      disabled={isPlaying && currentlyPlaying === message.id}
                      className="mt-2 text-white hover:text-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      title="Read aloud"
                    >
                      {isPlaying && currentlyPlaying === message.id ? '🔊' : '🔉'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              {selectedCharacters.size === 0 && (
                <div className="text-sm text-amber-600 mb-2">
                  Select at least one character to start chatting
                </div>
              )}

              {/* Auto Conversation Controls */}
              <div className="mb-3 flex items-center gap-3 flex-wrap">
                {!autoMode ? (
                  <button
                    onClick={startAutoConversation}
                    disabled={selectedCharacters.size < 2 || sending}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Start Auto Conversation
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopAutoConversation}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      Stop Auto Conversation
                    </button>
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Auto mode active</span>
                    </div>
                  </>
                )}

                {/* TTS Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ttsEnabled}
                    onChange={(e) => setTtsEnabled(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">🔊 Read aloud</span>
                </label>

                {selectedCharacters.size < 2 && !autoMode && (
                  <span className="text-sm text-gray-500">
                    (Select 2+ characters for auto conversation)
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !sending && !autoMode && sendMessage()}
                  placeholder="Type your message..."
                  disabled={selectedCharacters.size === 0 || sending || autoMode}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={selectedCharacters.size === 0 || sending || !input.trim() || autoMode}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
