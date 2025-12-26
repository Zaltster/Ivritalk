const KIMI_API_KEY = process.env.KIMI_API_KEY!
const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function chatWithKimi(messages: Message[]) {
  console.log('Kimi API Key:', KIMI_API_KEY ? `${KIMI_API_KEY.substring(0, 10)}...` : 'NOT SET')

  const response = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'kimi-k2-thinking',
      messages,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Kimi API error response:', errorText)
    throw new Error(`Kimi API error: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export function buildCharacterSystemPrompt(character: {
  name: string
  what_did_i_do: string
  external_qualities: string
  internal_qualities: string
  instructions: string
}, storyline: string, isAutoMode: boolean = false) {
  const basePrompt = `You are ${character.name}, a character in the following story: ${storyline}

Your role in the story: ${character.what_did_i_do}

Your appearance: ${character.external_qualities}

Your personality: ${character.internal_qualities}

Special instructions: ${character.instructions}

IMPORTANT:
- Stay in character at all times
- Respond naturally as this character would
- If you don't know something or it's not part of your character's knowledge, say "I don't know" or respond as the character would
- Interact with other characters and users as this character
- Keep responses concise and in character`

  if (isAutoMode) {
    return basePrompt + `
- You are having a conversation with other characters in the story
- Address other characters directly and naturally
- React to what others have said
- Keep the conversation flowing
- Don't repeat what others said, add new thoughts
- Keep responses to 1-3 sentences`
  }

  return basePrompt
}
