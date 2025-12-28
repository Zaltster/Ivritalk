import { NextRequest, NextResponse } from 'next/server'
import { chatWithKimi, buildCharacterSystemPrompt } from '@/lib/kimi'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { worldId, characterId, userMessage, conversationHistory, isAutoMode } = await request.json()

    // Get character details
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()

    if (charError || !character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Get world details
    const { data: world, error: worldError } = await supabase
      .from('worlds')
      .select('*')
      .eq('id', worldId)
      .single()

    if (worldError || !world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 })
    }

    // Build system prompt
    const systemPrompt = buildCharacterSystemPrompt(
      character,
      world.storyline,
      world.vocab,
      world.grammar,
      isAutoMode || false
    )

    // Build messages array for Kimi
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: userMessage },
    ]

    // Get response from Kimi
    const response = await chatWithKimi(messages)

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
