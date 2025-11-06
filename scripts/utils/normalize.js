const crypto = require('crypto');
const { parseISO, isValid } = require('date-fns');

/**
 * Normalize a raw event object to our standard schema
 */
function normalizeEvent(rawEvent, source) {
  const normalized = {
    id: generateEventId(rawEvent.title, rawEvent.venue?.name, rawEvent.start_datetime),
    title: sanitizeString(rawEvent.title),
    description: sanitizeString(rawEvent.description || ''),
    start_datetime: normalizeDate(rawEvent.start_datetime),
    end_datetime: normalizeDate(rawEvent.end_datetime),
    venue: {
      name: sanitizeString(rawEvent.venue?.name || ''),
      address: sanitizeString(rawEvent.venue?.address || ''),
      neighborhood: sanitizeString(rawEvent.venue?.neighborhood || ''),
      lat: rawEvent.venue?.lat || null,
      lng: rawEvent.venue?.lng || null
    },
    category: Array.isArray(rawEvent.category) ? rawEvent.category : [],
    price: {
      min: rawEvent.price?.min || null,
      max: rawEvent.price?.max || null,
      currency: 'USD',
      notes: sanitizeString(rawEvent.price?.notes || '')
    },
    image: rawEvent.image || null,
    source: {
      name: source.name,
      url: rawEvent.source_url || source.url,
      scraped_at: new Date().toISOString()
    },
    url: rawEvent.url || '',
    confidence: calculateConfidence(rawEvent),
    tags: Array.isArray(rawEvent.tags) ? rawEvent.tags : []
  };

  return normalized;
}

/**
 * Generate a unique ID based on title, venue, and date
 */
function generateEventId(title, venue, date) {
  const str = `${title || ''}${venue || ''}${date || ''}`;
  return crypto.createHash('sha1').update(str.toLowerCase()).digest('hex');
}

/**
 * Sanitize and trim strings
 */
function sanitizeString(str) {
  if (!str) return '';
  return str.toString().trim().replace(/\s+/g, ' ');
}

/**
 * Normalize date to ISO 8601 format
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;

  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (isValid(date)) {
      return date.toISOString();
    }
  } catch (error) {
    console.warn('Invalid date:', dateStr);
  }

  return null;
}

/**
 * Calculate confidence score based on data completeness
 */
function calculateConfidence(event) {
  let score = 0;

  if (event.title) score += 0.2;
  if (event.description) score += 0.15;
  if (event.start_datetime) score += 0.2;
  if (event.venue?.name) score += 0.15;
  if (event.venue?.address) score += 0.1;
  if (event.url) score += 0.1;
  if (event.image) score += 0.1;

  return Math.min(score, 1.0);
}

module.exports = {
  normalizeEvent,
  generateEventId,
  sanitizeString,
  normalizeDate
};
