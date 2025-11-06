const BaseAdapter = require('./BaseAdapter');
const cheerio = require('cheerio');

class TicketmasterAdapter extends BaseAdapter {
  async fetchRaw() {
    return await this.fetchWithCache(this.source.url);
  }

  async parse(html) {
    const $ = cheerio.load(html);
    const events = [];

    // Ticketmaster uses specific event card structures
    $('[class*="event"], [data-testid*="event"], .sc-event, article').each((i, elem) => {
      try {
        const $elem = $(elem);

        // Try multiple selectors for title
        const title = $elem.find('h3, h2, [class*="title"], [class*="name"], .event-name').first().text().trim() ||
                     $elem.find('a').first().text().trim();

        // Get link first to extract event details
        let link = $elem.find('a').first().attr('href');

        // Get date/time - Ticketmaster usually has structured datetime
        const dateText = $elem.find('time, [datetime], [class*="date"]').first().attr('datetime') ||
                        $elem.find('time, [class*="date"]').first().text().trim();

        const venue = $elem.find('[class*="venue"], [class*="location"]').first().text().trim();
        const image = $elem.find('img').first().attr('src');
        const priceText = $elem.find('[class*="price"]').first().text().trim();

        if (!title) return;

        // Filter for Charlotte events
        const text = `${title} ${venue}`.toLowerCase();
        if (!text.includes('charlotte') && !text.includes('panthers') && !text.includes('hornets')) {
          // Only include if we can verify it's in Charlotte
          if (!venue) return;
        }

        events.push({
          title,
          description: `Event at ${venue || 'Charlotte'}`,
          start_datetime: this.parseDate(dateText),
          end_datetime: null,
          venue: {
            name: venue || this.extractVenue(title),
            address: '',
            neighborhood: this.extractNeighborhood(venue || title)
          },
          category: this.categorizeEvent(title, venue),
          price: this.extractPrice(priceText),
          image: this.normalizeImageUrl(image),
          url: this.normalizeUrl(link),
          source_url: this.source.url,
          tags: ['ticketmaster']
        });
      } catch (error) {
        this.logger.warn(this.source.name, `Failed to parse event: ${error.message}`);
      }
    });

    return events;
  }

  parseDate(dateText) {
    if (!dateText) return null;

    try {
      // Handle ISO datetime
      const date = new Date(dateText);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      // Try to parse common date formats
      // "Sun, Nov 10, 2024 7:00 PM"
      const dateMatch = dateText.match(/(\w{3}),?\s+(\w{3})\s+(\d{1,2}),?\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (dateMatch) {
        const [, , month, day, year, hour, minute, ampm] = dateMatch;
        let hour24 = parseInt(hour);
        if (ampm && ampm.toLowerCase() === 'pm' && hour24 < 12) hour24 += 12;
        if (ampm && ampm.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;

        const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        const monthIndex = months[month.toLowerCase().substring(0, 3)];

        const parsedDate = new Date(parseInt(year), monthIndex, parseInt(day), hour24, parseInt(minute));
        return parsedDate.toISOString();
      }
    } catch (error) {
      this.logger.warn(this.source.name, `Failed to parse date: ${dateText}`);
    }

    return null;
  }

  extractVenue(title) {
    // Common Charlotte venues
    const venues = ['Bank of America Stadium', 'Spectrum Center', 'Truist Field', 'PNC Music Pavilion'];
    for (const venue of venues) {
      if (title.includes(venue)) return venue;
    }

    // Try to extract "at" location
    const atMatch = title.match(/at\s+([A-Z][^,\.]+)/);
    if (atMatch) return atMatch[1].trim();

    return '';
  }

  categorizeEvent(title, venue) {
    const text = `${title} ${venue}`.toLowerCase();
    const categories = [];

    // Sports
    if (/panthers|football|nfl/.test(text)) categories.push('sports');
    if (/hornets|basketball|nba/.test(text)) categories.push('sports');
    if (/charlotte fc|soccer|mls/.test(text)) categories.push('sports');
    if (/knights|baseball/.test(text)) categories.push('sports');

    // Music
    if (/concert|tour|music|live|performance/.test(text)) categories.push('concert', 'nightlife');

    // Theater/Shows
    if (/theater|theatre|show|comedy|broadway/.test(text)) categories.push('entertainment');

    // Festivals
    if (/festival|fair/.test(text)) categories.push('special');

    return categories.length > 0 ? categories : ['special'];
  }

  extractPrice(priceText) {
    if (!priceText) return { min: null, max: null, notes: 'Check Ticketmaster' };

    const text = priceText.toLowerCase();

    // Range
    const rangeMatch = text.match(/\$(\d+(?:\.\d{2})?)\s*-\s*\$?(\d+(?:\.\d{2})?)/);
    if (rangeMatch) {
      return {
        min: parseFloat(rangeMatch[1]),
        max: parseFloat(rangeMatch[2]),
        notes: 'Ticketed'
      };
    }

    // Single price
    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      return { min: parseFloat(priceMatch[1]), max: null, notes: 'Starting at' };
    }

    return { min: null, max: null, notes: 'Check Ticketmaster' };
  }

  extractNeighborhood(text) {
    if (!text) return '';

    const neighborhoods = {
      'uptown': 'Uptown',
      'bank of america stadium': 'Uptown',
      'spectrum center': 'Uptown',
      'truist field': 'Uptown',
      'pnc music pavilion': 'University',
      'bojangles coliseum': 'East Charlotte'
    };

    const lowerText = text.toLowerCase();
    for (const [key, value] of Object.entries(neighborhoods)) {
      if (lowerText.includes(key)) return value;
    }

    return '';
  }

  normalizeImageUrl(imageUrl) {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('//')) {
      return 'https:' + imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      return 'https://www.ticketmaster.com' + imageUrl;
    }

    return imageUrl;
  }

  normalizeUrl(url) {
    if (!url) return this.source.url;

    if (url.startsWith('/')) {
      return 'https://www.ticketmaster.com' + url;
    }

    return url;
  }
}

module.exports = TicketmasterAdapter;
