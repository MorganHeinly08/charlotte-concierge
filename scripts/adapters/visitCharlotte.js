const BaseAdapter = require('./BaseAdapter');
const cheerio = require('cheerio');

class VisitCharlotteAdapter extends BaseAdapter {
  async fetchRaw() {
    return await this.fetchWithCache(this.source.url);
  }

  async parse(html) {
    const $ = cheerio.load(html);
    const events = [];

    // Visit Charlotte uses various event card structures
    // This is a simplified parser - may need adjustment based on actual HTML structure
    $('.event-card, .eventCard, [class*="event"]').each((i, elem) => {
      try {
        const $elem = $(elem);

        const title = $elem.find('h2, h3, .event-title, [class*="title"]').first().text().trim();
        const description = $elem.find('p, .event-description, [class*="description"]').first().text().trim();
        const venue = $elem.find('.venue, .location, [class*="venue"]').first().text().trim();
        const dateText = $elem.find('.date, .event-date, [class*="date"]').first().text().trim();
        const link = $elem.find('a').first().attr('href');
        const image = $elem.find('img').first().attr('src');

        if (!title) return; // Skip if no title

        events.push({
          title,
          description,
          start_datetime: this.parseDate(dateText),
          end_datetime: null,
          venue: {
            name: venue,
            address: '',
            neighborhood: this.extractNeighborhood(venue)
          },
          category: this.categorizeEvent(title, description),
          price: this.extractPrice(description),
          image: image ? this.normalizeImageUrl(image) : null,
          url: link ? this.normalizeUrl(link) : this.source.url,
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

    // Try to parse various date formats
    // This is a simplified version - may need enhancement
    try {
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

    if (/restaurant|dining|food|brunch|dinner/.test(text)) categories.push('restaurant');
    if (/bar|cocktail|brewery|wine|beer/.test(text)) categories.push('bar', 'nightlife');
    if (/concert|music|band|dj/.test(text)) categories.push('concert', 'nightlife');
    if (/sport|game|match|panthers|hornets/.test(text)) categories.push('sports');
    if (/club|dance|party/.test(text)) categories.push('nightlife');
    if (/opening|grand opening|new/.test(text)) categories.push('opening');
    if (/festival|fair|market/.test(text)) categories.push('special');

    return categories.length > 0 ? categories : ['special'];
  }

  extractPrice(description) {
    const text = description.toLowerCase();

    if (/free|no cost|complimentary/.test(text)) {
      return { min: 0, max: 0, notes: 'Free' };
    }

    // Try to extract price from text
    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      return { min: price, max: null, notes: 'Ticketed' };
    }

    return { min: null, max: null, notes: '' };
  }

  extractNeighborhood(venueText) {
    const neighborhoods = [
      'Uptown', 'South End', 'NoDa', 'Plaza Midwood', 'Dilworth',
      'Myers Park', 'Ballantyne', 'University', 'Montford', 'Elizabeth'
    ];

    for (const neighborhood of neighborhoods) {
      if (new RegExp(neighborhood, 'i').test(venueText)) {
        return neighborhood;
      }
    }

    return '';
  }

  normalizeImageUrl(imageUrl) {
    if (!imageUrl) return null;

    // Handle relative URLs
    if (imageUrl.startsWith('//')) {
      return 'https:' + imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      return 'https://www.charlottesgotalot.com' + imageUrl;
    }

    return imageUrl;
  }

  normalizeUrl(url) {
    if (!url) return this.source.url;

    // Handle relative URLs
    if (url.startsWith('/')) {
      return 'https://www.charlottesgotalot.com' + url;
    }

    return url;
  }
}

module.exports = VisitCharlotteAdapter;
