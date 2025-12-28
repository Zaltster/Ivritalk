import { NextRequest, NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY not set in environment')
      return NextResponse.json({
        error: 'TTS API key not configured. Please add ELEVENLABS_API_KEY to environment variables.'
      }, { status: 500 })
    }

    console.log('TTS request for text:', text.substring(0, 50), '... (length:', text.length, ')')

    // Initialize ElevenLabs client
    const elevenlabs = new ElevenLabsClient({ apiKey })

    console.log('Calling ElevenLabs API...')

    // Convert text to speech using multilingual v2 model (supports Hebrew)
    const audio = await elevenlabs.textToSpeech.convert(
      'JBFqnCBsd6RMkjVDRZzb', // George voice - good for Hebrew
      {
        text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      }
    )

    console.log('Audio stream received, reading chunks...')

    // Read the stream into a buffer
    const chunks: Uint8Array[] = []
    const reader = audio.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    console.log('Chunks read:', chunks.length)

    // Combine chunks into single buffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const audioBuffer = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset)
      offset += chunk.length
    }

    // Convert to base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    console.log('TTS success! Audio size:', audioBuffer.length, 'bytes')

    return NextResponse.json({ audio: base64Audio })
  } catch (error: any) {
    console.error('TTS error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json({
      error: error.message || 'TTS generation failed',
      details: error.stack
    }, { status: 500 })
  }
}
