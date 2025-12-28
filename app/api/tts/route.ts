import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Use ElevenLabs TTS API - multilingual v2 model works well with Hebrew
    const response = await fetch(
      'https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', // Adam voice (multilingual)
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs error:', errorText)
      return NextResponse.json({ error: 'TTS API error' }, { status: 500 })
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer()

    // Return audio as base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    return NextResponse.json({ audio: base64Audio })
  } catch (error: any) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
