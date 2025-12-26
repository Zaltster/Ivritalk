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
      model: 'kimi-k2-0905-preview',
      messages,
      temperature: 0.6,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Kimi API error response:', errorText)
    throw new Error(`Kimi API error: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  let content = data.choices[0].message.content

  // Remove character name prefix if AI included it (e.g., "Bob:", "בוב:", etc.)
  content = content.replace(/^[^:]+:\s*/, '')

  return content
}

export function buildCharacterSystemPrompt(character: {
  name: string
  what_did_i_do: string
  external_qualities: string
  internal_qualities: string
  instructions: string
}, storyline: string, vocab?: string | null, grammar?: string | null, isAutoMode: boolean = false) {
  let basePrompt = `You are ${character.name}, a character in the following story: ${storyline}

Your role in the story: ${character.what_did_i_do}

Your appearance: ${character.external_qualities}

Your personality: ${character.internal_qualities}

Special instructions: ${character.instructions}

CRITICAL LANGUAGE REQUIREMENT:
- You MUST respond ONLY in Hebrew (עברית)
- NEVER respond in English, Mandarin Chinese, or any other language
- ALL your responses must be in Hebrew characters
- If you don't know Hebrew, say "אני לא יודע" (I don't know in Hebrew)`

  // Add vocab/grammar focus if provided
  if (vocab || grammar) {
    basePrompt += `\n\nLANGUAGE LEARNING FOCUS:`
    if (vocab) {
      basePrompt += `\n- Try to use these vocabulary words when possible (naturally, not forced): ${vocab}`
    }
    if (grammar) {
      basePrompt += `\n- Practice these grammar patterns when speaking: ${grammar}`
    }
    basePrompt += `\n- Incorporate these naturally into your conversation - don't force them, but lean towards using them when appropriate`
  }

  basePrompt += `

CRITICAL FORMATTING REQUIREMENT:
- DO NOT start your response with your name (like "בוב:" or "Bob:")
- DO NOT include any character labels or names in your response
- Your name will be displayed separately in the chat interface
- Just respond directly with your message content ONLY

IMPORTANT:
- Stay in character at all times
- Respond naturally as this character would
- If you don't know something or it's not part of your character's knowledge, say "אני לא יודע" or respond as the character would in Hebrew
- Interact with other characters and users as this character
- Keep responses concise and in character
- This is Mainly designed for kids with a begginner level of Hebrew Undestanding so dont use words that are too complex`


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
