import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">Ivritalk</h1>
        <p className="text-xl text-gray-700 mb-8">Create Hebrew fables with interactive characters</p>
        <div className="space-x-4">
          <Link
            href="/auth"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
