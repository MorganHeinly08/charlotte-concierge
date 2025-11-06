# Data Sources

This document lists all data sources used by the Charlotte Concierge event aggregator, along with their methods, frequencies, and legal considerations.

## Active Sources

### 1. Visit Charlotte (charlottesgotalot.com)
- **Method**: Web scraping
- **URL**: https://www.charlottesgotalot.com/events
- **Frequency**: Weekly (Monday 10:00 AM EST)
- **Priority**: 1 (Highest)
- **Legal Notes**:
  - robots.txt compliance: Checked before crawling
  - Rate limiting: 1 second between requests
  - Caching: 7-day cache to minimize load
  - This is an official public event listing site

### 2. Eventbrite Charlotte
- **Method**: Web scraping
- **URL**: https://www.eventbrite.com/d/nc--charlotte/events/
- **Frequency**: Weekly (Monday 10:00 AM EST)
- **Priority**: 2
- **Legal Notes**:
  - robots.txt compliance: Checked before crawling
  - Rate limiting: 1 second between requests
  - Caching: 7-day cache to minimize load
  - Public event listings only
  - Links direct users to original Eventbrite pages for tickets/registration

## Disabled Sources (Ready to Enable)

### 3. Charlotte Five (CharlotteObserver)
- **Method**: Web scraping
- **URL**: https://www.charlotteobserver.com/charlottefive/
- **Priority**: 3
- **Status**: Disabled - requires testing
- **Notes**: Local lifestyle publisher; may require more sophisticated scraping

### 4. QCity Metro
- **Method**: Web scraping
- **URL**: https://qcitymetro.com/events/
- **Priority**: 4
- **Status**: Disabled - not yet implemented
- **Notes**: Community news and events

## Future Sources (Not Yet Implemented)

- Charlotte On The Cheap
- Panthers/Hornets official calendars
- South End neighborhood calendar
- Live Nation/Ticketmaster Charlotte venues
- Local venue Instagram feeds (via official APIs only)

## Ethical Guidelines

### Data Collection
1. **Respect robots.txt**: All sources are checked for robots.txt compliance before crawling
2. **Rate Limiting**: Minimum 1 second delay between requests to avoid overloading servers
3. **Caching**: 7-day cache to minimize repeated requests
4. **User-Agent**: Clear identification as CharlotteConcierge crawler
5. **No Authentication**: Only publicly accessible pages are crawled

### Content Usage
1. **Attribution**: All events display source attribution
2. **Links**: All events link back to original source pages
3. **Images**: Images are cached locally only if publicly accessible; source credit is maintained
4. **No Modification**: Event details are presented as-is from source
5. **Deduplication**: When events appear on multiple sources, we merge data and credit both sources

### Privacy
1. **No Personal Data**: Only public event information is collected
2. **No Tracking**: Users are not tracked on our site
3. **External Links**: Links to source sites do not include tracking parameters

## Removal Requests

If you are a content owner and would like your events removed from this aggregator:

1. Open an issue at: https://github.com/MorganHeinly08/charlotte-concierge/issues
2. Email: (contact information to be added)
3. Specify the source and/or specific events to be excluded

We will respond within 48 hours and disable the source if requested.

## Technical Implementation

### Adapter Pattern
Each source has a dedicated adapter implementing:
- `fetchRaw()` - Retrieve data with caching
- `parse()` - Extract event information
- `rateLimit()` - Enforce respectful crawling

### Error Handling
- Failed sources do not break the entire crawl
- Errors are logged for review
- Fallback to cached data when available

### Audit Trail
Every crawl generates a log file (`data/scrape-log-YYYY-MM-DD.json`) containing:
- Source URLs accessed
- Timestamps
- Number of items found
- Any errors encountered

This log is committed to the repository for transparency.

---

Last updated: 2025-01-06
