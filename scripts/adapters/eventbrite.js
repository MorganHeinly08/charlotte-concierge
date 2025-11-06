const BaseAdapter = require('./BaseAdapter');
const cheerio = require('cheerio');

class EventbriteAdapter extends BaseAdapter {
  async fetchRaw() {
    return await this.fetchWithCache(this.source.url);
  }

  async parse(html) {
    const $ = cheerio.load(html);
    const events = [];

    // Eventbrite uses specific class names for event cards
    $('[class*="event-card"], [data-testid*="event"], .discover-search-desktop-card').each((i, elem) => {
      try {
        const $elem = $(elem);

        const title = $elem.find('h3, h2, [class*="title"], [class*="event-name"]').first().text().trim();
        const description = $elem.find('p, [class*="description"]').first().text().trim();
        const dateText = $elem.find('[class*="date"], time').first().text().trim() ||
                        $elem.find('[class*="date"]').first().attr('datetime');
        const venue = $elem.find('[class*="location"], [class*="venue"]').first().text().trim();
        const priceText = $elem.find('[class*="price"]').first().text().trim();
        const link = $elem.find('a').first().attr('href');
        const image = $elem.find('img').first().attr('src');

        if (!title) return; // Skip if no title

        events.push({
          title,
          description,
          start_datetime: this.parseDate(dateText),
          end_datetime: null,
          venue: {
            name: venue || 'Charlotte, NC',
            address: '',
            neighborhood: this.extractNeighborhood(venue)
          },
          category: this.categorizeEvent(title, description),
          price: this.extractPrice(priceText),
          image: image || null,
          url: this.normalizeUrl(link),
          source_url: this.source.url,
          tags: []
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
      // Eventbrite often uses ISO format in datetime attributes
      const date = new Date(dateText);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      this.logger.warn(this.source.name, `Failed to parse date: ${dateText}`);
    }

    return null;
  }

  categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const categories = [];

    // Nightlife & Entertainment
    if (/bar|cocktail|brewery|wine|beer|pub|tavern/.test(text)) {
      categories.push('bar', 'nightlife');
    }
    if (/concert|music|live music|band|dj|performer/.test(text)) {
      categories.push('concert', 'nightlife');
    }
    if (/club|dance|party|nightclub/.test(text)) {
      categories.push('nightlife');
    }

    // Food & Dining
    if (/restaurant|dining|food|brunch|dinner|lunch|cuisine/.test(text)) {
      categories.push('restaurant');
    }

    // Sports & Active
    if (/sport|game|match|panthers|hornets|basketball|football/.test(text)) {
      categories.push('sports');
    }
    if (/run|yoga|fitness|workout|cycling|active/.test(text)) {
      categories.push('active');
    }

    // Special Events
    if (/festival|fair|market|expo/.test(text)) {
      categories.push('special');
    }
    if (/opening|grand opening|launch|debut/.test(text)) {
      categories.push('opening');
    }

    // Entertainment
    if (/comedy|stand-up|theater|show|performance/.test(text)) {
      categories.push('entertainment');
    }

    return categories.length > 0 ? categories : ['special'];
  }

  extractPrice(priceText) {
    if (!priceText) {
      return { min: null, max: null, notes: '' };
    }

    const text = priceText.toLowerCase();

    // Check for free events
    if (/free|no cost|complimentary/.test(text)) {
      return { min: 0, max: 0, notes: 'Free' };
    }

    // Extract price range
    const rangeMatch = text.match(/\$(\d+(?:\.\d{2})?)\s*-\s*\$(\d+(?:\.\d{2})?)/);
    if (rangeMatch) {
      return {
        min: parseFloat(rangeMatch[1]),
        max: parseFloat(rangeMatch[2]),
        notes: 'Ticketed'
      };
    }

    // Extract single price
    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      return {
        min: parseFloat(priceMatch[1]),
        max: null,
        notes: 'Ticketed'
      };
    }

    return { min: null, max: null, notes: priceText };
  }

  extractNeighborhood(venueText) {
    if (!venueText) return '';

    const neighborhoods = [
      'Uptown', 'South End', 'NoDa', 'Plaza Midwood', 'Dilworth',
      'Myers Park', 'Ballantyne', 'University', 'Montford', 'Elizabeth',
      'Cotswold', 'SouthPark', 'Park Road'
    ];

    for (const neighborhood of neighborhoods) {
      if (new RegExp(neighborhood, 'i').test(venueText)) {
        return neighborhood;
      }
    }

    return '';
  }

  normalizeUrl(url) {
    if (!url) return this.source.url;

    // Handle relative URLs
    if (url.startsWith('/')) {
      return 'https://www.eventbrite.com' + url;
    }

    return url;
  }
}

module.exports = EventbriteAdapter;
