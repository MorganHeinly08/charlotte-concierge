export default function Filters({ filters, onFilterChange, eventCounts }) {
  const categories = [
    'all',
    'nightlife',
    'restaurant',
    'concert',
    'sports',
    'bar',
    'opening',
    'special'
  ];

  const timeFilters = [
    { value: 'all', label: 'All Events' },
    { value: 'today', label: 'Today' },
    { value: 'weekend', label: 'This Weekend' },
    { value: 'week', label: 'This Week' }
  ];

  return (
    <div className="bg-[#21272a] rounded-xl p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Time Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            When
          </label>
          <div className="flex flex-wrap gap-2">
            {timeFilters.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onFilterChange('timeFilter', value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.timeFilter === value
                    ? 'bg-ibm-blue text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => onFilterChange('category', cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  filters.category === cat
                    ? 'bg-ibm-blue text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-gray-400 text-sm">
          Showing <span className="text-white font-semibold">{eventCounts.filtered}</span> of{' '}
          <span className="text-gray-300">{eventCounts.total}</span> events
        </p>
      </div>
    </div>
  );
}
