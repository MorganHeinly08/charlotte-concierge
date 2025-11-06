# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Charlotte Concierge is an automated event aggregator for Charlotte, NC. It crawls multiple event sources weekly, deduplicates and ranks events, and presents them on a static Next.js website hosted on GitHub Pages. The project targets nightlife, restaurants, entertainment, and sports events.

## Common Commands

### Development
```bash
npm run dev          # Start Next.js development server (http://localhost:3000)
npm run build        # Build static site for production (outputs to ./out)
npm run crawl        # Run event crawler manually to fetch latest events
npm test             # Run tests (when implemented)
npm run lint         # Lint code
```

### Crawler Workflow
1. `npm run crawl` - Fetches events from enabled sources in `config/sources.json`
2. Events are normalized, deduplicated, ranked
3. Results saved to `data/latest.json` and `data/events-YYYY-MM-DD.json`
4. Logs saved to `data/scrape-log-YYYY-MM-DD.json`

### Build Process
- Next.js 14 with static export (`output: 'export'`)
- Build reads event data from `data/latest.json` at build time via `getStaticProps`
- Static files output to `./out` directory
- GitHub Actions builds and deploys to GitHub Pages weekly

## Architecture

### Event Crawler System

**Location**: `/scripts/`

- **crawl.js**: Main crawler orchestrator
- **adapters/**: Source-specific parsers (BaseAdapter, visitCharlotte, eventbrite)
- **utils/**: Helper modules (normalize, dedupe, cache, logger)
- **Adapter Pattern**: Each source has its own adapter implementing `fetchRaw()` and `parse()`
- **Rate Limiting**: 1 second minimum between requests
- **Caching**: 7-day file-based cache in `data/cache/`
- **Deduplication**: Events merged if title+venue+date match within 6 hours

### Data Flow

1. **Crawl** (GitHub Actions weekly or manual): `scripts/crawl.js` → `data/latest.json`
2. **Build** (Next.js SSG): `getStaticProps` reads `data/latest.json` → static HTML in `./out`
3. **Deploy**: GitHub Actions uploads `./out` to GitHub Pages

### Event Data Model

See README.md for full schema. Key fields:
- `id`: SHA1 hash of title+venue+date
- `category`: Array (nightlife, restaurant, concert, sports, bar, opening, special)
- `confidence`: 0.0-1.0 score based on data completeness
- `_rank_score`: Calculated score for sorting (category weights + recency + weekend bonus)

### Frontend Architecture

**Location**: `/src/`

- **pages/index.js**: Homepage with event listing, filtering, and SSG data loading
- **components/EventCard.js**: Event card display component
- **components/Filters.js**: Category and time filter UI
- **Styling**: Tailwind CSS with IBM Carbon Design colors (ibm-blue: #0f62fe, ibm-cyan: #1192e8)
- **State Management**: React hooks (useState, useMemo) for client-side filtering
- **Date Handling**: date-fns library for parsing and formatting

### GitHub Actions Workflow

**File**: `.github/workflows/deploy.yml`

**Trigger**:
- Schedule: Every Monday 10:00 AM EST (15:00 UTC)
- Manual: workflow_dispatch
- Push: On pushes to main branch

**Jobs**:
1. **crawl-and-build**: Install deps → Run crawler → Commit data → Build Next.js → Upload artifact
2. **deploy**: Deploy artifact to GitHub Pages

### Configuration

- **config/sources.json**: Enable/disable sources, set priority, configure URLs
- **next.config.js**: Static export, GitHub Pages base path `/charlotte-concierge`
- **tailwind.config.js**: Scans `src/pages/**` and `src/components/**`, custom IBM colors

### Key Technical Details

- React 18 + Next.js 14 (static site generation only, no SSR)
- Node.js crawler with cheerio for HTML parsing, node-fetch for HTTP, rss-parser for RSS
- File-based data storage (JSON) committed to repo
- Image caching to `public/images/events/`
- Ethical crawling: robots.txt compliance, rate limiting, source attribution

## Important Notes for Development

### Adding a New Event Source

1. Create adapter in `scripts/adapters/newSource.js` extending `BaseAdapter`
2. Implement `fetchRaw()` and `parse()` methods
3. Add source to `config/sources.json`
4. Import adapter in `scripts/crawl.js` and add to `ADAPTER_MAP`
5. Document in SOURCES.md

### Modifying Event Ranking

Edit `filterAndRank()` in `scripts/crawl.js`:
- Category weights (nightlife, concert, restaurant prioritized)
- Recency bonus (events <3 days get +15 points)
- Weekend bonus (Friday/Saturday +10 points)
- Family event filter (excludes kids/family events)

### Changing Crawl Schedule

Edit cron expression in `.github/workflows/deploy.yml`:
```yaml
- cron: '0 15 * * 1'  # Monday 10am EST (15:00 UTC)
```

### Testing Locally

1. Run crawler: `npm run crawl` (generates `data/latest.json`)
2. Check logs: `data/scrape-log-YYYY-MM-DD.json`
3. Test build: `npm run build` (creates `./out`)
4. Preview: `npm run dev` and visit http://localhost:3000

## File Locations Reference

- Event data: `data/latest.json` (used by build), `data/events-YYYY-MM-DD.json` (archives)
- Crawler logs: `data/scrape-log-YYYY-MM-DD.json`
- HTTP cache: `data/cache/` (7-day expiry)
- Source config: `config/sources.json`
- Adapters: `scripts/adapters/*.js`
- Components: `src/components/*.js`
- Main page: `src/pages/index.js`