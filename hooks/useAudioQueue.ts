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

  // Fallback to browser's built-in TTS (free, works offline)
  const speakWithBrowserTTS = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.warn('Browser TTS not supported')
        resolve()
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'he-IL' // Hebrew
      utterance.rate = 0.9
      utterance.pitch = 1

      utterance.onend = () => resolve()
      utterance.onerror = () => {
        console.error('Browser TTS error')
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  }, [])

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

          // Try ElevenLabs first (will fallback to browser TTS if quota exceeded)
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: nextItem.text }),
          })

          const data = await response.json()

          if (data.audio) {
            // ElevenLabs succeeded - play high-quality audio
            const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`)
            audioRef.current = audio

            audio.onended = () => {
              setCurrentlyPlaying(null)
              playNext()
            }

            audio.onerror = () => {
              console.error('Audio playback error')
              setCurrentlyPlaying(null)
              playNext()
            }

            await audio.play()
          } else {
            // ElevenLabs failed - fallback to browser TTS
            console.log('Using browser TTS fallback')
            await speakWithBrowserTTS(nextItem.text)
            setCurrentlyPlaying(null)
            playNext()
          }
        } catch (error) {
          console.error('TTS error, using browser fallback:', error)
          // Fallback to browser TTS on any error
          await speakWithBrowserTTS(nextItem.text)
          setCurrentlyPlaying(null)
          playNext()
        }
      })()

      return remainingQueue
    })
  }, [speakWithBrowserTTS])

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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
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
      } else {
        // Fallback to browser TTS
        console.log('Using browser TTS for immediate playback')
        await speakWithBrowserTTS(text)
        setIsPlaying(false)
        setCurrentlyPlaying(null)
      }
    } catch (error) {
      console.error('TTS error, using browser fallback:', error)
      await speakWithBrowserTTS(text)
      setIsPlaying(false)
    }
  }, [speakWithBrowserTTS])

  const clearQueue = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
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
