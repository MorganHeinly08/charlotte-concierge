const BaseAdapter = require('./BaseAdapter');
const cheerio = require('cheerio');

class AxiosCharlotteAdapter extends BaseAdapter {
  async fetchRaw() {
    return await this.fetchWithCache(this.source.url);
  }

  async parse(html) {
    const $ = cheerio.load(html);
    const events = [];

    // Axios Charlotte events are typically in article listings
    $('article, .article, [class*="event"], [class*="story"]').each((i, elem) => {
      try {
        const $elem = $(elem);

        // Look for event-related content
        const title = $elem.find('h2, h3, h4, .title, [class*="headline"]').first().text().trim();
        const description = $elem.find('p, .description, .excerpt').first().text().trim();
        const link = $elem.find('a').first().attr('href');
        const image = $elem.find('img').first().attr('src');
        const dateText = $elem.find('time, .date, [class*="date"]').first().text().trim() ||
                        $elem.find('time').first().attr('datetime');

        if (!title) return;

        // Filter for event-related articles
        const eventKeywords = /event|concert|festival|opening|show|party|market|fair|game|match/i;
        if (!eventKeywords.test(title + ' ' + description)) return;

        events.push({
          title,
          description,
          start_datetime: this.parseDate(dateText),
          end_datetime: null,
          venue: {
            name: this.extractVenue(title, description),
            address: '',
            neighborhood: this.extractNeighborhood(title + ' ' + description)
          },
          category: this.categorizeEvent(title, description),
          price: this.extractPrice(description),
          image: this.normalizeImageUrl(image),
          url: this.normalizeUrl(link),
          source_url: this.source.url,
          tags: ['axios']
        });
      } catch (error) {
        this.logger.warn(this.source.name, `Failed to parse article: ${error.message}`);
      }
    });

    return events;
  }

  parseDate(dateText) {
    if (!dateText) return null;

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

  extractVenue(title, description) {
    // Try to extract venue from text
    const atMatch = (title + ' ' + description).match(/at\s+([A-Z][^,\.]+)/);
    if (atMatch) {
      return atMatch[1].trim();
    }
    return '';
  }

  categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const categories = [];

    if (/concert|music|band|dj|live music/.test(text)) categories.push('concert', 'nightlife');
    if (/bar|brewery|wine|beer|cocktail/.test(text)) categories.push('bar', 'nightlife');
    if (/restaurant|dining|food|brunch/.test(text)) categories.push('restaurant');
    if (/sport|game|panthers|hornets|football|basketball/.test(text)) categories.push('sports');
    if (/festival|fair|market/.test(text)) categories.push('special');
    if (/opening|debut|launch|new/.test(text)) categories.push('opening');
    if (/party|dance|club/.test(text)) categories.push('nightlife');

    return categories.length > 0 ? categories : ['special'];
  }

  extractPrice(description) {
    const text = description.toLowerCase();

    if (/free|no cost|complimentary/.test(text)) {
      return { min: 0, max: 0, notes: 'Free' };
    }

    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      return { min: parseFloat(priceMatch[1]), max: null, notes: 'Ticketed' };
    }

    return { min: null, max: null, notes: '' };
  }

  extractNeighborhood(text) {
    const neighborhoods = [
      'Uptown', 'South End', 'NoDa', 'Plaza Midwood', 'Dilworth',
      'Myers Park', 'Ballantyne', 'University', 'Montford', 'Elizabeth'
    ];

    for (const neighborhood of neighborhoods) {
      if (new RegExp(neighborhood, 'i').test(text)) {
        return neighborhood;
      }
    }

    return '';
  }

  normalizeImageUrl(imageUrl) {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('//')) {
      return 'https:' + imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      return 'https://www.axios.com' + imageUrl;
    }

    return imageUrl;
  }

  normalizeUrl(url) {
    if (!url) return this.source.url;

    if (url.startsWith('/')) {
      return 'https://www.axios.com' + url;
    }

    return url;
  }
}

module.exports = AxiosCharlotteAdapter;
