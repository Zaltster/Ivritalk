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
      console.error('ELEVENLABS_API_KEY not set')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    console.log('TTS request for text:', text.substring(0, 50))

    // Initialize ElevenLabs client
    const elevenlabs = new ElevenLabsClient({ apiKey })

    // Convert text to speech using multilingual v2 model (supports Hebrew)
    const audio = await elevenlabs.textToSpeech.convert(
      'JBFqnCBsd6RMkjVDRZzb', // George voice - good for Hebrew
      {
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
      }
    )

    // Read the stream into a buffer
    const chunks: Uint8Array[] = []
    const reader = audio.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

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

    console.log('TTS success, audio size:', audioBuffer.length)

    return NextResponse.json({ audio: base64Audio })
  } catch (error: any) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: error.message || 'TTS generation failed' }, { status: 500 })
  }
}
