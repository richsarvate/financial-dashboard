import MultiAccountDashboard from '@/components/MultiAccountDashboard'
import { Suspense } from 'react'

export default function Home() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Multi-Account Investment Dashboard
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Analyze your Schwab investment accounts and compare performance against benchmarks
        </p>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }>
        <MultiAccountDashboard />
      </Suspense>
    </div>
  )
}
