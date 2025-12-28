'use client'

interface NiqqudHelperProps {
  onInsert: (symbol: string) => void
}

const niqqudSymbols = [
  { symbol: 'ְ', name: 'Shva', sound: '' },
  { symbol: 'ַ', name: 'Patach', sound: 'a' },
  { symbol: 'ָ', name: 'Kamatz', sound: 'ah' },
  { symbol: 'ֶ', name: 'Segol', sound: 'e' },
  { symbol: 'ֵ', name: 'Tzere', sound: 'ei' },
  { symbol: 'ִ', name: 'Chirik', sound: 'i' },
  { symbol: 'ֹ', name: 'Cholam', sound: 'o' },
  { symbol: 'ֻ', name: 'Kubutz', sound: 'u' },
  { symbol: 'וּ', name: 'Shuruk', sound: 'u' },
  { symbol: 'ּ', name: 'Dagesh', sound: '•' },
  { symbol: 'ׁ', name: 'Shin dot', sound: 'sh' },
  { symbol: 'ׂ', name: 'Sin dot', sound: 's' },
]

export default function NiqqudHelper({ onInsert }: NiqqudHelperProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        ניקוד (Vowel Points) - Click to insert:
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {niqqudSymbols.map((item) => (
          <button
            key={item.symbol}
            type="button"
            onClick={() => onInsert(item.symbol)}
            className="bg-white hover:bg-blue-100 border border-gray-300 rounded px-3 py-2 text-center transition-colors"
            title={`${item.name} (${item.sound})`}
          >
            <div className="text-2xl mb-1">◌{item.symbol}</div>
            <div className="text-xs text-gray-600">{item.name}</div>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        💡 Tip: Type the Hebrew letter first, then click the niqqud symbol to add it after the letter.
        Example: א + click ַ = אַ
      </p>
    </div>
  )
}
