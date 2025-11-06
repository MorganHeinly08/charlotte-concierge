import { format, parseISO } from 'date-fns';

export default function EventCard({ event }) {
  const startDate = event.start_datetime ? parseISO(event.start_datetime) : null;

  return (
    <div className="bg-[#21272a] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
      {event.image && (
        <div className="relative h-48 w-full overflow-hidden bg-gray-800">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="p-6">
        {/* Category tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {event.category.slice(0, 3).map((cat, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs font-semibold rounded-full bg-ibm-blue/20 text-ibm-cyan"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
          {event.title}
        </h3>

        {/* Date and time */}
        {startDate && (
          <div className="flex items-center text-gray-300 mb-2">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">
              {format(startDate, 'EEEE, MMM d • h:mm a')}
            </span>
          </div>
        )}

        {/* Venue */}
        {event.venue?.name && (
          <div className="flex items-center text-gray-300 mb-3">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">
              {event.venue.name}
              {event.venue.neighborhood && ` • ${event.venue.neighborhood}`}
            </span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Price and link */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <div className="text-sm">
            {event.price?.notes === 'Free' ? (
              <span className="text-green-400 font-semibold">FREE</span>
            ) : event.price?.min ? (
              <span className="text-gray-300">
                ${event.price.min}{event.price.max ? ` - $${event.price.max}` : '+'}
              </span>
            ) : (
              <span className="text-gray-400">See details</span>
            )}
          </div>

          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-ibm-blue hover:bg-ibm-cyan text-white rounded-lg text-sm font-semibold transition-colors duration-200"
          >
            Details →
          </a>
        </div>

        {/* Source */}
        <div className="mt-3 text-xs text-gray-500">
          via {event.source.name}
        </div>
      </div>
    </div>
  );
}
