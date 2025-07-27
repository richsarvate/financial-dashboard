import Dashboard from '@/components/Dashboard'
import { Suspense } from 'react'

export default function Home() {
  return (
    <div className="px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Investment Performance Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Analyze your Schwab investment accounts and compare performance against benchmarks
        </p>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }>
        <Dashboard />
      </Suspense>
    </div>
  )
}
