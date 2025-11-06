const { parseISO, differenceInHours, isValid } = require('date-fns');

/**
 * Deduplicate events based on title, venue, and start time
 * Merge events if they match within 6 hours
 */
function deduplicateEvents(events) {
  const seen = new Map();
  const deduplicated = [];

  for (const event of events) {
    const key = generateDedupeKey(event);

    if (!seen.has(key)) {
      seen.set(key, event);
      deduplicated.push(event);
    } else {
      // Merge with existing event, keeping highest confidence
      const existing = seen.get(key);
      const merged = mergeEvents(existing, event);
      seen.set(key, merged);

      // Update in deduplicated array
      const index = deduplicated.findIndex(e => e.id === existing.id);
      if (index !== -1) {
        deduplicated[index] = merged;
      }
    }
  }

  return deduplicated;
}

/**
 * Generate a deduplication key
 */
function generateDedupeKey(event) {
  const title = normalizeForMatching(event.title);
  const venue = normalizeForMatching(event.venue?.name || '');
  const date = event.start_datetime ? new Date(event.start_datetime).toISOString().split('T')[0] : '';

  return `${title}|${venue}|${date}`;
}

/**
 * Normalize string for matching (lowercase, remove special chars)
 */
function normalizeForMatching(str) {
  return str.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Merge two events, keeping the best data from each
 */
function mergeEvents(event1, event2) {
  // Check if start times are within 6 hours
  if (event1.start_datetime && event2.start_datetime) {
    try {
      const date1 = parseISO(event1.start_datetime);
      const date2 = parseISO(event2.start_datetime);

      if (isValid(date1) && isValid(date2)) {
        const hoursDiff = Math.abs(differenceInHours(date1, date2));
        if (hoursDiff > 6) {
          // Too far apart, don't merge
          return event1.confidence >= event2.confidence ? event1 : event2;
        }
      }
    } catch (error) {
      console.warn('Error comparing dates for merge:', error.message);
    }
  }

  // Merge, preferring data from higher confidence source
  const primary = event1.confidence >= event2.confidence ? event1 : event2;
  const secondary = event1.confidence >= event2.confidence ? event2 : event1;

  return {
    ...primary,
    description: primary.description || secondary.description,
    end_datetime: primary.end_datetime || secondary.end_datetime,
    venue: {
      ...primary.venue,
      address: primary.venue.address || secondary.venue.address,
      neighborhood: primary.venue.neighborhood || secondary.venue.neighborhood,
      lat: primary.venue.lat || secondary.venue.lat,
      lng: primary.venue.lng || secondary.venue.lng
    },
    image: primary.image || secondary.image,
    price: {
      ...primary.price,
      min: primary.price.min ?? secondary.price.min,
      max: primary.price.max ?? secondary.price.max,
      notes: primary.price.notes || secondary.price.notes
    },
    tags: [...new Set([...primary.tags, ...secondary.tags])],
    // Track both sources
    source: {
      ...primary.source,
      merged_from: secondary.source.name
    }
  };
}

module.exports = {
  deduplicateEvents,
  generateDedupeKey,
  mergeEvents
};
