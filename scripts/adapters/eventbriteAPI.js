const BaseAdapter = require('./BaseAdapter');

class EventbriteAPIAdapter extends BaseAdapter {
  async fetchRaw() {
    const apiKey = process.env.EVENTBRITE_API_KEY;

    if (!apiKey) {
      this.logger.warn(this.source.name, 'No API key found - skipping');
      return JSON.stringify({ events: [] });
    }

    // Search for events in Charlotte, NC
    // Eventbrite API v3: https://www.eventbrite.com/platform/api#/reference/event-search
    const params = new URLSearchParams({
      'location.address': 'Charlotte, NC',
      'location.within': '25mi',
      'expand': 'venue,category',
      'page_size': 100,
      'sort_by': 'date'
    });

    const url = `https://www.eventbriteapi.com/v3/events/search/?${params}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key - check EVENTBRITE_API_KEY');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      this.logger.error(this.source.name, `API request failed: ${error.message}`);
      return JSON.stringify({ events: [] });
    }
  }

  async parse(jsonString) {
    const events = [];

    try {
      const data = JSON.parse(jsonString);

      if (!data.events || data.events.length === 0) {
        this.logger.info(this.source.name, 'No events found in API response');
        return events;
      }

      for (const event of data.events) {
        try {
          const venue = event.venue;
          const isFree = event.is_free;
          const ticketAvailability = event.ticket_availability;

          events.push({
            title: event.name?.text || 'Untitled Event',
            description: event.description?.text || event.summary || '',
            start_datetime: event.start?.utc || event.start?.local || null,
            end_datetime: event.end?.utc || event.end?.local || null,
            venue: {
              name: venue?.name || '',
              address: venue?.address?.localized_address_display || venue?.address?.address_1 || '',
              neighborhood: this.extractNeighborhood(venue?.address?.city || venue?.name || ''),
              lat: venue?.latitude ? parseFloat(venue.latitude) : null,
              lng: venue?.longitude ? parseFloat(venue.longitude) : null
            },
            category: this.categorizeEvent(event),
            price: {
              min: isFree ? 0 : null,
              max: null,
              currency: 'USD',
              notes: isFree ? 'Free' : (ticketAvailability?.is_sold_out ? 'Sold Out' : 'Ticketed')
            },
            image: event.logo?.url || null,
            url: event.url,
            source_url: this.source.url,
            tags: ['eventbrite-api', event.category?.name?.toLowerCase()].filter(Boolean)
          });
        } catch (error) {
          this.logger.warn(this.source.name, `Failed to parse event: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(this.source.name, `Failed to parse API response: ${error.message}`);
    }

    return events;
  }

  categorizeEvent(event) {
    const categories = [];
    const name = (event.name?.text || '').toLowerCase();
    const description = (event.description?.text || '').toLowerCase();
    const categoryName = (event.category?.name || '').toLowerCase();
    const text = `${name} ${description} ${categoryName}`;

    // Music & Nightlife
    if (/music|concert|dj|live|band|performance/.test(text) || categoryName.includes('music')) {
      categories.push('concert', 'nightlife');
    }

    // Food & Drink
    if (/food|restaurant|dining|brunch|dinner|tasting|chef/.test(text) || categoryName.includes('food')) {
      categories.push('restaurant');
    }
    if (/bar|brewery|wine|beer|cocktail|spirits/.test(text)) {
      categories.push('bar', 'nightlife');
    }

    // Sports & Fitness
    if (/sport|game|run|yoga|fitness|athletic/.test(text) || categoryName.includes('sport')) {
      categories.push('sports');
    }

    // Arts & Entertainment
    if (/comedy|theater|theatre|art|gallery|show/.test(text) || categoryName.includes('performing')) {
      categories.push('entertainment');
    }

    // Festivals & Special Events
    if (/festival|fair|market|expo/.test(text) || categoryName.includes('festival')) {
      categories.push('special');
    }

    // Openings & New Venues
    if (/opening|grand opening|launch|debut|ribbon cutting/.test(text)) {
      categories.push('opening');
    }

    // Nightlife
    if (/party|dance|club|nightlife|night out/.test(text)) {
      categories.push('nightlife');
    }

    return categories.length > 0 ? categories : ['special'];
  }

  extractNeighborhood(location) {
    if (!location) return '';

    const neighborhoods = [
      'Uptown', 'South End', 'NoDa', 'Plaza Midwood', 'Dilworth',
      'Myers Park', 'Ballantyne', 'University', 'Montford', 'Elizabeth'
    ];

    for (const neighborhood of neighborhoods) {
      if (new RegExp(neighborhood, 'i').test(location)) {
        return neighborhood;
      }
    }

    return '';
  }
}

module.exports = EventbriteAPIAdapter;
