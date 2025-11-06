const BaseAdapter = require('./BaseAdapter');

class TicketmasterAPIAdapter extends BaseAdapter {
  async fetchRaw() {
    const apiKey = process.env.TICKETMASTER_API_KEY;

    if (!apiKey) {
      this.logger.warn(this.source.name, 'No API key found - skipping');
      return JSON.stringify({ _embedded: { events: [] } });
    }

    // Search for events in Charlotte, NC
    const params = new URLSearchParams({
      apikey: apiKey,
      city: 'Charlotte',
      stateCode: 'NC',
      size: 100, // Get up to 100 events
      sort: 'date,asc'
    });

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      this.logger.error(this.source.name, `API request failed: ${error.message}`);
      return JSON.stringify({ _embedded: { events: [] } });
    }
  }

  async parse(jsonString) {
    const events = [];

    try {
      const data = JSON.parse(jsonString);

      if (!data._embedded || !data._embedded.events) {
        this.logger.info(this.source.name, 'No events found in API response');
        return events;
      }

      for (const event of data._embedded.events) {
        try {
          const startDate = event.dates?.start?.dateTime || event.dates?.start?.localDate;
          const venue = event._embedded?.venues?.[0];
          const priceRanges = event.priceRanges?.[0];
          const image = event.images?.find(img => img.width > 500)?.url || event.images?.[0]?.url;

          events.push({
            title: event.name,
            description: event.info || event.pleaseNote || `${event.name} at ${venue?.name || 'Charlotte'}`,
            start_datetime: startDate || null,
            end_datetime: null,
            venue: {
              name: venue?.name || '',
              address: venue?.address?.line1 || '',
              neighborhood: this.getNeighborhood(venue?.name),
              lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : null,
              lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : null
            },
            category: this.categorizeEvent(event),
            price: {
              min: priceRanges?.min || null,
              max: priceRanges?.max || null,
              currency: priceRanges?.currency || 'USD',
              notes: priceRanges ? 'Ticketed' : 'See website'
            },
            image: image || null,
            url: event.url,
            source_url: this.source.url,
            tags: ['ticketmaster-api', event.classifications?.[0]?.segment?.name?.toLowerCase()].filter(Boolean)
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
    const classification = event.classifications?.[0];

    if (!classification) return ['special'];

    const segment = classification.segment?.name?.toLowerCase() || '';
    const genre = classification.genre?.name?.toLowerCase() || '';
    const type = classification.type?.name?.toLowerCase() || '';

    // Sports
    if (segment === 'sports') {
      categories.push('sports');

      // Specific sports teams
      if (/panthers|nfl|football/.test(event.name.toLowerCase())) categories.push('panthers');
      if (/hornets|nba|basketball/.test(event.name.toLowerCase())) categories.push('hornets');
      if (/charlotte fc|soccer/.test(event.name.toLowerCase())) categories.push('soccer');
    }

    // Music
    if (segment === 'music' || genre.includes('music')) {
      categories.push('concert', 'nightlife');
    }

    // Arts & Theater
    if (segment === 'arts & theatre' || type.includes('theatre')) {
      categories.push('entertainment');
    }

    // Family (filter out for our use case)
    if (segment === 'family' || genre.includes('family')) {
      // We'll filter these out in the crawler
    }

    return categories.length > 0 ? categories : ['special'];
  }

  getNeighborhood(venueName) {
    if (!venueName) return '';

    const lowerVenue = venueName.toLowerCase();
    const venueMap = {
      'bank of america stadium': 'Uptown',
      'spectrum center': 'Uptown',
      'truist field': 'Uptown',
      'pnc music pavilion': 'University',
      'bojangles coliseum': 'East Charlotte',
      'ovens auditorium': 'East Charlotte',
      'blumenthal': 'Uptown',
      'knight theater': 'Uptown',
      'belk theater': 'Uptown'
    };

    for (const [key, value] of Object.entries(venueMap)) {
      if (lowerVenue.includes(key)) return value;
    }

    return '';
  }
}

module.exports = TicketmasterAPIAdapter;
