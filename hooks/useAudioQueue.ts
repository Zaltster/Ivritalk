import { useState, useRef, useCallback } from 'react'

interface AudioQueueItem {
  text: string
  id: string
}

export function useAudioQueue() {
  const [queue, setQueue] = useState<AudioQueueItem[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playNext = useCallback(async () => {
    setQueue((currentQueue) => {
      if (currentQueue.length === 0) {
        setIsPlaying(false)
        setCurrentlyPlaying(null)
        return []
      }

      const [nextItem, ...remainingQueue] = currentQueue

      // Play the audio
      ;(async () => {
        try {
          setCurrentlyPlaying(nextItem.id)

          // Call TTS API
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: nextItem.text }),
          })

          const data = await response.json()

          if (data.audio) {
            // Create audio element and play
            const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`)
            audioRef.current = audio

            audio.onended = () => {
              setCurrentlyPlaying(null)
              // Automatically play next in queue
              playNext()
            }

            audio.onerror = () => {
              console.error('Audio playback error')
              setCurrentlyPlaying(null)
              playNext()
            }

            await audio.play()
          } else {
            // Skip to next if error
            setCurrentlyPlaying(null)
            playNext()
          }
        } catch (error) {
          console.error('TTS error:', error)
          setCurrentlyPlaying(null)
          playNext()
        }
      })()

      return remainingQueue
    })
  }, [])

  const addToQueue = useCallback((text: string, id: string) => {
    setQueue((currentQueue) => {
      const newQueue = [...currentQueue, { text, id }]

      // If not currently playing, start playing
      if (!isPlaying) {
        setIsPlaying(true)
        // Trigger playNext on next tick
        setTimeout(() => playNext(), 0)
      }

      return newQueue
    })
  }, [isPlaying, playNext])

  const playImmediate = useCallback(async (text: string) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // Clear queue and play immediately
    setQueue([])
    setIsPlaying(true)

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()

      if (data.audio) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`)
        audioRef.current = audio

        audio.onended = () => {
          setIsPlaying(false)
          setCurrentlyPlaying(null)
        }

        await audio.play()
      }
    } catch (error) {
      console.error('TTS error:', error)
      setIsPlaying(false)
    }
  }, [])

  const clearQueue = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setQueue([])
    setIsPlaying(false)
    setCurrentlyPlaying(null)
  }, [])

  return {
    addToQueue,
    playImmediate,
    clearQueue,
    isPlaying,
    currentlyPlaying,
    queueLength: queue.length,
  }
}
