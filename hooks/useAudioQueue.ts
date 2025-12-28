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
  const voicesLoadedRef = useRef(false)

  // Load voices on mount (they load asynchronously)
  useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          voicesLoadedRef.current = true
          console.log('Available TTS voices:', voices.map(v => `${v.name} (${v.lang})`))
        }
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])()

  // Fallback to browser's built-in TTS (free, works offline)
  const speakWithBrowserTTS = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.warn('Browser TTS not supported')
        resolve()
        return
      }

      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'he-IL' // Hebrew (Israel)
        utterance.rate = 0.85 // Slower for better clarity
        utterance.pitch = 1
        utterance.volume = 1

        // Try to select a Hebrew voice if available
        const voices = window.speechSynthesis.getVoices()
        const hebrewVoice = voices.find(voice =>
          voice.lang.startsWith('he') ||
          voice.lang === 'he-IL' ||
          voice.name.toLowerCase().includes('hebrew') ||
          voice.name.toLowerCase().includes('carmit') // Common Hebrew voice name
        )

        if (hebrewVoice) {
          utterance.voice = hebrewVoice
          console.log('Using Hebrew voice:', hebrewVoice.name, hebrewVoice.lang)
        } else {
          console.warn('⚠️ No Hebrew voice found! Install Hebrew TTS on your device for better pronunciation.')
          console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`).join(', '))
        }

        utterance.onend = () => resolve()
        utterance.onerror = (e) => {
          console.error('Browser TTS error:', e)
          resolve()
        }

        window.speechSynthesis.speak(utterance)
      }

      // Voices might not be loaded yet, wait for them
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          speak()
        }
      } else {
        speak()
      }
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
