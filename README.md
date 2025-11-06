# Charlotte Concierge 🎉

A curated, weekly "things to do" feed for Charlotte, NC — tailored for nightlife, restaurants, entertainment, sporting events, and social activities.

**Live Site**: [https://morganheinly08.github.io/charlotte-concierge/](https://morganheinly08.github.io/charlotte-concierge/)

## Features

- 🤖 **Automated Weekly Updates**: Crawls Charlotte event sources every Monday at 10am EST
- 🎯 **Smart Filtering**: Filter by category, date, and neighborhood
- 📱 **Mobile-First Design**: Responsive, accessible interface
- 🔄 **De-duplication**: Merges duplicate events from multiple sources
- ⭐ **Intelligent Ranking**: Prioritizes nightlife, restaurants, new openings, and sports
- 🆓 **100% Free**: Built with free open-source tools and GitHub Pages

## Tech Stack

- **Frontend**: Next.js 14 (React) with Tailwind CSS
- **Crawler**: Node.js with Cheerio for HTML parsing
- **Data Storage**: JSON files committed to repo
- **CI/CD**: GitHub Actions for scheduled crawling and deployment
- **Hosting**: GitHub Pages (static site)

## Project Structure

```
charlotte-concierge/
├── .github/workflows/    # GitHub Actions workflows
│   └── deploy.yml       # Weekly crawl + deploy
├── config/
│   └── sources.json     # Event source configuration
├── data/                # Crawled event data (JSON)
│   ├── latest.json      # Current events
│   └── cache/          # HTTP response cache
├── scripts/
│   ├── adapters/       # Source-specific parsers
│   │   ├── BaseAdapter.js
│   │   ├── visitCharlotte.js
│   │   └── eventbrite.js
│   ├── utils/          # Helper functions
│   │   ├── normalize.js
│   │   ├── dedupe.js
│   │   ├── logger.js
│   │   └── cache.js
│   └── crawl.js        # Main crawler script
├── src/
│   ├── components/     # React components
│   │   ├── EventCard.js
│   │   └── Filters.js
│   ├── pages/          # Next.js pages
│   │   ├── _app.js
│   │   └── index.js
│   └── styles/
│       └── globals.css
├── public/images/      # Cached event images
├── SOURCES.md          # Data source documentation
└── package.json
```

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/MorganHeinly08/charlotte-concierge.git
   cd charlotte-concierge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get API keys** (Required for Ticketmaster & Eventbrite)

   See [API_SETUP.md](./API_SETUP.md) for detailed instructions.

   Quick steps:
   - Get Ticketmaster API key: https://developer.ticketmaster.com/
   - Get Eventbrite API key: https://www.eventbrite.com/platform/api
   - Copy `.env.example` to `.env`
   - Add your API keys to `.env`

4. **Run the crawler** (fetches fresh event data)
   ```bash
   npm run crawl
   ```
   This will fetch events from all enabled sources and save to `data/latest.json`

5. **Start development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

6. **Build for production**
   ```bash
   npm run build
   ```
   Static files are output to `./out`

## Commands

- `npm run dev` - Start Next.js development server
- `npm run build` - Build static site for production
- `npm run crawl` - Run event crawler manually
- `npm test` - Run tests (when implemented)
- `npm run lint` - Lint code

## Data Sources

Events are aggregated from:

1. **Visit Charlotte** (charlottesgotalot.com) - Official visitor guide
2. **Eventbrite Charlotte** - Community events platform
3. *(More sources can be enabled in `config/sources.json`)*

See [SOURCES.md](./SOURCES.md) for detailed information on each source, legal compliance, and ethical guidelines.

## How It Works

### Weekly Automated Updates

1. **Every Monday at 10:00 AM EST**, GitHub Actions triggers the crawler
2. The crawler fetches events from all enabled sources
3. Events are normalized, deduplicated, and ranked
4. Data is saved to `data/latest.json` and committed to the repo
5. Next.js static site is rebuilt with the new data
6. Site is deployed to GitHub Pages

### Manual Updates

You can trigger a manual crawl and deployment:

1. Go to the [Actions tab](https://github.com/MorganHeinly08/charlotte-concierge/actions)
2. Click "Weekly Crawl & Deploy"
3. Click "Run workflow"

## Configuration

### Adding/Removing Event Sources

Edit `config/sources.json`:

```json
{
  "sources": [
    {
      "id": "visit-charlotte",
      "name": "Visit Charlotte",
      "enabled": true,
      "adapter": "visitCharlotte",
      "priority": 1,
      "method": "scrape",
      "url": "https://www.charlottesgotalot.com/events"
    }
  ]
}
```

Set `"enabled": false` to disable a source.

### Changing Crawl Schedule

Edit `.github/workflows/deploy.yml`:

```yaml
on:
  schedule:
    - cron: '0 15 * * 1'  # Monday 10am EST (15:00 UTC)
```

## Event Data Model

Each event follows this schema:

```json
{
  "id": "unique-hash",
  "title": "Event Name",
  "description": "Event description",
  "start_datetime": "2025-01-10T19:00:00Z",
  "end_datetime": "2025-01-10T23:00:00Z",
  "venue": {
    "name": "Venue Name",
    "address": "123 Main St",
    "neighborhood": "South End",
    "lat": null,
    "lng": null
  },
  "category": ["nightlife", "concert"],
  "price": {
    "min": 20,
    "max": 50,
    "currency": "USD",
    "notes": "Ticketed"
  },
  "image": "https://example.com/image.jpg",
  "source": {
    "name": "Visit Charlotte",
    "url": "https://...",
    "scraped_at": "2025-01-06T12:00:00Z"
  },
  "url": "https://original-event-page.com",
  "confidence": 0.85,
  "tags": []
}
```

## Contributing

Contributions are welcome! Areas for improvement:

- Add more event sources (see SOURCES.md)
- Improve event categorization
- Add neighborhood detection
- Implement image caching
- Add tests

## License

MIT License - See [LICENSE](./LICENSE) for details

## Legal & Ethics

This project:
- Respects `robots.txt` for all sources
- Implements rate limiting (1 req/second minimum)
- Caches responses to minimize load
- Attributes all content to original sources
- Links users back to original event pages
- Only scrapes publicly accessible content

See [SOURCES.md](./SOURCES.md) for full ethical guidelines and removal request procedures.

---

**Questions or Issues?**
Open an issue: https://github.com/MorganHeinly08/charlotte-concierge/issues
