const BaseAdapter = require('./BaseAdapter');
const cheerio = require('cheerio');

class CLTTodayAdapter extends BaseAdapter {
  async fetchRaw() {
    return await this.fetchWithCache(this.source.url);
  }

  async parse(html) {
    const $ = cheerio.load(html);
    const events = [];

    // CLTToday (6AM City network) typically uses article/card structures
    $('article, .card, .post, [class*="article"], [class*="story"]').each((i, elem) => {
      try {
        const $elem = $(elem);

        const title = $elem.find('h1, h2, h3, h4, .title, .headline').first().text().trim();
        const description = $elem.find('p, .description, .excerpt, .summary').first().text().trim();
        const link = $elem.find('a').first().attr('href');
        const image = $elem.find('img').first().attr('src');
        const dateText = $elem.find('time, .date, .published-date').first().text().trim() ||
                        $elem.find('time').first().attr('datetime');

        if (!title) return;

        // CLTToday covers events and local news - filter for event content
        const eventKeywords = /event|happening|things to do|weekend|concert|festival|opening|show|market|fair/i;
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
          tags: ['local-news']
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
    const text = title + ' ' + description;

    // Try to find venue after "at"
    const atMatch = text.match(/at\s+([A-Z][^,\.]+)/);
    if (atMatch) {
      return atMatch[1].trim();
    }

    // Try to find venue in title
    const inMatch = text.match(/in\s+([A-Z][^,\.]+)/);
    if (inMatch) {
      return inMatch[1].trim();
    }

    return '';
  }

  categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const categories = [];

    if (/concert|music|live music|band|performer|dj/.test(text)) categories.push('concert', 'nightlife');
    if (/bar|brewery|wine|beer|cocktail|pub/.test(text)) categories.push('bar', 'nightlife');
    if (/restaurant|dining|food|brunch|dinner|chef/.test(text)) categories.push('restaurant');
    if (/sport|game|panthers|hornets|charlotte fc|football|basketball|soccer/.test(text)) categories.push('sports');
    if (/festival|fair|market|expo/.test(text)) categories.push('special');
    if (/opening|grand opening|new|debut|launch/.test(text)) categories.push('opening');
    if (/party|dance|club|nightclub|night out/.test(text)) categories.push('nightlife');
    if (/comedy|theater|show|performance|art/.test(text)) categories.push('entertainment');

    return categories.length > 0 ? categories : ['special'];
  }

  extractPrice(description) {
    const text = description.toLowerCase();

    if (/free|no cost|complimentary|no charge|no admission/.test(text)) {
      return { min: 0, max: 0, notes: 'Free' };
    }

    const rangeMatch = text.match(/\$(\d+)-\$(\d+)/);
    if (rangeMatch) {
      return {
        min: parseFloat(rangeMatch[1]),
        max: parseFloat(rangeMatch[2]),
        notes: 'Ticketed'
      };
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
      'Myers Park', 'Ballantyne', 'University', 'Montford', 'Elizabeth',
      'SouthPark', 'Cotswold', 'Wesley Heights', 'Cherry'
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
      return 'https://clttoday.6amcity.com' + imageUrl;
    }

    return imageUrl;
  }

  normalizeUrl(url) {
    if (!url) return this.source.url;

    if (url.startsWith('/')) {
      return 'https://clttoday.6amcity.com' + url;
    }

    return url;
  }
}

module.exports = CLTTodayAdapter;
