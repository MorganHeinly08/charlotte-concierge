import { useState, useMemo } from 'react';
import { parseISO, isToday, isThisWeek, isWeekend, isFriday, isSaturday, isSunday } from 'date-fns';
import EventCard from '../components/EventCard';
import Filters from '../components/Filters';

export default function Home({ events, updatedAt }) {
  const [filters, setFilters] = useState({
    category: 'all',
    timeFilter: 'all'
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Category filter
      if (filters.category !== 'all') {
        if (!event.category.includes(filters.category)) {
          return false;
        }
      }

      // Time filter
      if (filters.timeFilter !== 'all' && event.start_datetime) {
        const eventDate = parseISO(event.start_datetime);

        switch (filters.timeFilter) {
          case 'today':
            if (!isToday(eventDate)) return false;
            break;
          case 'weekend':
            // This weekend (Friday through Sunday)
            if (!isWeekend(eventDate) && !isFriday(eventDate)) return false;
            if (!isThisWeek(eventDate)) return false;
            break;
          case 'week':
            if (!isThisWeek(eventDate)) return false;
            break;
        }
      }

      return true;
    });
  }, [events, filters]);

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #0f62fe 0%, #161616 100%)'}}>
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#1192e8] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">
            What's Happening in Charlotte
          </h1>
          <p className="text-xl md:text-2xl text-gray-100">
            This Weekend's Top Events 🎉
          </p>
          {updatedAt && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <p className="text-sm text-gray-200">
                Updated {new Date(updatedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
              <a
                href="https://github.com/MorganHeinly08/charlotte-concierge/actions/workflows/deploy.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all duration-200 backdrop-blur-sm border border-white/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Events
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          eventCounts={{
            total: events.length,
            filtered: filteredEvents.length
          }}
        />

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-400">
              Try adjusting your filters to see more events
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>
            Events aggregated from Visit Charlotte, Eventbrite, and more.
            <br />
            Data refreshes weekly every Monday.
          </p>
        </footer>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const fs = require('fs');
  const path = require('path');

  try {
    const dataPath = path.join(process.cwd(), 'data', 'latest.json');

    // Check if data file exists
    if (!fs.existsSync(dataPath)) {
      return {
        props: {
          events: [],
          updatedAt: null
        }
      };
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    return {
      props: {
        events: data.events || [],
        updatedAt: data.updated_at || null
      }
    };
  } catch (error) {
    console.error('Error loading events:', error);

    return {
      props: {
        events: [],
        updatedAt: null
      }
    };
  }
}
