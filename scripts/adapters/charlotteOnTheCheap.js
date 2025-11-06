const BaseAdapter = require('./BaseAdapter');
const cheerio = require('cheerio');

class CharlotteOnTheCheapAdapter extends BaseAdapter {
  async fetchRaw() {
    return await this.fetchWithCache(this.source.url);
  }

  async parse(html) {
    const $ = cheerio.load(html);
    const events = [];

    // Charlotte on the Cheap typically has event listings
    $('article, .event, .post, [class*="event"]').each((i, elem) => {
      try {
        const $elem = $(elem);

        const title = $elem.find('h2, h3, h4, .entry-title, .post-title').first().text().trim();
        const description = $elem.find('.entry-content, .post-content, p').first().text().trim();
        const link = $elem.find('a').first().attr('href');
        const image = $elem.find('img').first().attr('src');
        const dateText = $elem.find('time, .date, .published').first().text().trim() ||
                        $elem.find('time').first().attr('datetime');

        if (!title) return;

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
          price: this.extractPrice(title, description),
          image: this.normalizeImageUrl(image),
          url: this.normalizeUrl(link),
          source_url: this.source.url,
          tags: ['cheap', 'budget-friendly']
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
    const atMatch = (title + ' ' + description).match(/at\s+([A-Z][^,\.]+)/);
    if (atMatch) {
      return atMatch[1].trim();
    }
    return '';
  }

  categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const categories = [];

    if (/concert|music|live music|band|dj/.test(text)) categories.push('concert', 'nightlife');
    if (/bar|brewery|wine|beer|cocktail/.test(text)) categories.push('bar', 'nightlife');
    if (/restaurant|dining|food|brunch|dinner/.test(text)) categories.push('restaurant');
    if (/sport|game|panthers|hornets/.test(text)) categories.push('sports');
    if (/festival|fair|market/.test(text)) categories.push('special');
    if (/opening|new|debut|launch/.test(text)) categories.push('opening');
    if (/party|dance|club|nightclub/.test(text)) categories.push('nightlife');
    if (/comedy|theater|show/.test(text)) categories.push('entertainment');

    return categories.length > 0 ? categories : ['special'];
  }

  extractPrice(title, description) {
    const text = `${title} ${description}`.toLowerCase();

    // Charlotte on the Cheap specializes in free/cheap events
    if (/free|no cost|complimentary|no charge/.test(text)) {
      return { min: 0, max: 0, notes: 'Free' };
    }

    // Look for price indicators
    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      return { min: price, max: null, notes: price <= 10 ? 'Budget-friendly' : 'Ticketed' };
    }

    // Default for this site - assume budget-friendly
    return { min: null, max: null, notes: 'Check for low-cost options' };
  }

  extractNeighborhood(text) {
    const neighborhoods = [
      'Uptown', 'South End', 'NoDa', 'Plaza Midwood', 'Dilworth',
      'Myers Park', 'Ballantyne', 'University', 'Montford', 'Elizabeth',
      'SouthPark', 'Cotswold'
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
      return 'https://www.charlotteonthecheap.com' + imageUrl;
    }

    return imageUrl;
  }

  normalizeUrl(url) {
    if (!url) return this.source.url;

    if (url.startsWith('/')) {
      return 'https://www.charlotteonthecheap.com' + url;
    }

    return url;
  }
}

module.exports = CharlotteOnTheCheapAdapter;
