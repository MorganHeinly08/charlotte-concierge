const BaseAdapter = require('./BaseAdapter');
const cheerio = require('cheerio');

class UptownCharlotteAdapter extends BaseAdapter {
  async fetchRaw() {
    return await this.fetchWithCache(this.source.url);
  }

  async parse(html) {
    const $ = cheerio.load(html);
    const events = [];

    // Uptown Charlotte typically uses event cards or listings
    $('.event, .event-card, .event-item, article, [class*="event"]').each((i, elem) => {
      try {
        const $elem = $(elem);

        const title = $elem.find('h1, h2, h3, h4, .event-title, .title').first().text().trim();
        const description = $elem.find('p, .description, .event-description, .excerpt').first().text().trim();
        const link = $elem.find('a').first().attr('href');
        const image = $elem.find('img').first().attr('src');
        const dateText = $elem.find('time, .date, .event-date, .start-date').first().text().trim() ||
                        $elem.find('time').first().attr('datetime');
        const venue = $elem.find('.venue, .location, .event-venue').first().text().trim();

        if (!title) return;

        events.push({
          title,
          description,
          start_datetime: this.parseDate(dateText),
          end_datetime: null,
          venue: {
            name: venue || this.extractVenue(title, description),
            address: '',
            neighborhood: 'Uptown' // Default to Uptown for this source
          },
          category: this.categorizeEvent(title, description),
          price: this.extractPrice(description),
          image: this.normalizeImageUrl(image),
          url: this.normalizeUrl(link),
          source_url: this.source.url,
          tags: ['uptown']
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
    const text = title + ' ' + description;

    const atMatch = text.match(/at\s+([A-Z][^,\.]+)/);
    if (atMatch) {
      return atMatch[1].trim();
    }

    return '';
  }

  categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const categories = [];

    if (/concert|music|live music|band|dj|performance/.test(text)) categories.push('concert', 'nightlife');
    if (/bar|brewery|wine|beer|cocktail|rooftop/.test(text)) categories.push('bar', 'nightlife');
    if (/restaurant|dining|food|brunch|dinner/.test(text)) categories.push('restaurant');
    if (/sport|game|panthers|hornets|charlotte fc/.test(text)) categories.push('sports');
    if (/festival|fair|market|street fair/.test(text)) categories.push('special');
    if (/opening|grand opening|ribbon cutting|new/.test(text)) categories.push('opening');
    if (/party|dance|club|nightlife/.test(text)) categories.push('nightlife');
    if (/comedy|theater|art|show|gallery/.test(text)) categories.push('entertainment');
    if (/run|walk|5k|marathon|fitness/.test(text)) categories.push('active');

    return categories.length > 0 ? categories : ['special'];
  }

  extractPrice(description) {
    const text = description.toLowerCase();

    if (/free|no cost|complimentary|no charge|no admission fee/.test(text)) {
      return { min: 0, max: 0, notes: 'Free' };
    }

    const rangeMatch = text.match(/\$(\d+)-\$?(\d+)/);
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

  normalizeImageUrl(imageUrl) {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('//')) {
      return 'https:' + imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      return 'https://www.uptowncharlotte.com' + imageUrl;
    }

    return imageUrl;
  }

  normalizeUrl(url) {
    if (!url) return this.source.url;

    if (url.startsWith('/')) {
      return 'https://www.uptowncharlotte.com' + url;
    }

    return url;
  }
}

module.exports = UptownCharlotteAdapter;
