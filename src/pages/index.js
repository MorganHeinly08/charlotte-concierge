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
      if (filters.timeFilter !== 'all') {
        // If event has no date, exclude it when specific time filter is selected
        if (!event.start_datetime) return false;

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
            <p className="text-sm text-gray-200 mt-4">
              Updated {new Date(updatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })} • Auto-refreshes weekly
            </p>
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
            Events aggregated from Eventbrite, Visit Charlotte, Charlotte on the Cheap, and more.
            <br />
            Data refreshes weekly every Monday at 10am EST.
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
