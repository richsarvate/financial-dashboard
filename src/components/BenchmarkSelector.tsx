'use client';

import React, { useState } from 'react';
import { BenchmarkConfig } from '../types/benchmarks';

interface BenchmarkSelectorProps {
  benchmarks: Record<string, BenchmarkConfig>;
  activeBenchmarks: Set<string>;
  onToggleBenchmark: (benchmarkId: string) => void;
  maxActive?: number;
}

export const BenchmarkSelector: React.FC<BenchmarkSelectorProps> = ({
  benchmarks,
  activeBenchmarks,
  onToggleBenchmark,
  maxActive = 4
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categorySet = new Set(Object.values(benchmarks).map(b => b.category));
  const categories = ['ALL', ...Array.from(categorySet)];
  
  const filteredBenchmarks = Object.values(benchmarks).filter(benchmark => 
    selectedCategory === 'ALL' || benchmark.category === selectedCategory
  );

  const canAddMore = activeBenchmarks.size < maxActive;

  return (
    <div className="relative">
      {/* Active Benchmarks Display */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Array.from(activeBenchmarks).map(benchmarkId => {
          const benchmark = benchmarks[benchmarkId];
          if (!benchmark) return null;
          
          return (
            <div
              key={benchmarkId}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow-md"
              style={{ 
                backgroundColor: benchmark.color + '15',
                borderColor: benchmark.color + '40',
                border: '2px solid',
                color: benchmark.color
              }}
            >
              <div 
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: benchmark.color }}
              />
              <span className="font-semibold whitespace-nowrap">{benchmark.name}</span>
              <button
                onClick={() => onToggleBenchmark(benchmarkId)}
                className="ml-1 hover:bg-white hover:bg-opacity-30 rounded-full p-1 transition-colors group"
                aria-label={`Remove ${benchmark.name}`}
              >
                <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          );
        })}
        
        {canAddMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Benchmark
          </button>
        )}
      </div>

      {/* Expanded Selector */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-6 mt-2">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Choose Benchmarks</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Benchmark Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {filteredBenchmarks.map(benchmark => {
              const isActive = activeBenchmarks.has(benchmark.id);
              const isDisabled = !isActive && !canAddMore;
              
              return (
                <button
                  key={benchmark.id}
                  onClick={() => !isDisabled && onToggleBenchmark(benchmark.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-4 p-4 text-left rounded-lg border-2 transition-all ${
                    isActive 
                      ? 'bg-blue-50 border-blue-200 shadow-md' 
                      : isDisabled
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                      : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div 
                    className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: benchmark.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 mb-1 truncate">{benchmark.name}</div>
                    <div className="text-sm text-gray-600 truncate">{benchmark.description}</div>
                  </div>
                  {isActive && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{activeBenchmarks.size}</span> of <span className="font-medium">{maxActive}</span> benchmarks selected
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
