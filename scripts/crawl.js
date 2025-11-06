#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Logger = require('./utils/logger');
const Cache = require('./utils/cache');
const { normalizeEvent } = require('./utils/normalize');
const { deduplicateEvents } = require('./utils/dedupe');

// Adapters - API
const TicketmasterAPIAdapter = require('./adapters/ticketmasterAPI');
const EventbriteAPIAdapter = require('./adapters/eventbriteAPI');

// Adapters - Scraping
const VisitCharlotteAdapter = require('./adapters/visitCharlotte');
const EventbriteAdapter = require('./adapters/eventbrite');
const CharlotteOnTheCheapAdapter = require('./adapters/charlotteOnTheCheap');
const CLTTodayAdapter = require('./adapters/cltToday');
const AxiosCharlotteAdapter = require('./adapters/axiosCharlotte');
const UptownCharlotteAdapter = require('./adapters/uptownCharlotte');
const TicketmasterAdapter = require('./adapters/ticketmaster');

const ADAPTER_MAP = {
  // API Adapters
  ticketmasterAPI: TicketmasterAPIAdapter,
  eventbriteAPI: EventbriteAPIAdapter,
  // Scraping Adapters
  visitCharlotte: VisitCharlotteAdapter,
  eventbrite: EventbriteAdapter,
  charlotteOnTheCheap: CharlotteOnTheCheapAdapter,
  cltToday: CLTTodayAdapter,
  axiosCharlotte: AxiosCharlotteAdapter,
  uptownCharlotte: UptownCharlotteAdapter,
  ticketmaster: TicketmasterAdapter
};

class Crawler {
  constructor() {
    this.logger = new Logger();
    this.cache = new Cache();
    this.events = [];
  }

  async run() {
    this.logger.info('Crawler', '🚀 Starting Charlotte event crawler...');

    try {
      // Load sources configuration
      const sources = await this.loadSources();

      // Clear expired cache
      await this.cache.clearExpired();

      // Fetch from each enabled source
      for (const source of sources) {
        if (!source.enabled) {
          this.logger.info('Crawler', `⏭️  Skipping disabled source: ${source.name}`);
          continue;
        }

        await this.fetchFromSource(source);
      }

      // Normalize all events
      this.logger.info('Crawler', `📝 Normalizing ${this.events.length} raw events...`);
      const normalized = this.events.map(event =>
        normalizeEvent(event.data, event.source)
      );

      // Deduplicate
      this.logger.info('Crawler', '🔍 Deduplicating events...');
      const deduplicated = deduplicateEvents(normalized);

      // Filter and rank
      this.logger.info('Crawler', '⭐ Ranking and filtering events...');
      const filtered = this.filterAndRank(deduplicated);

      // Save results
      await this.saveResults(filtered);

      // Save logs
      await this.logger.saveLogs(path.join(process.cwd(), 'data'));

      this.logger.success(
        'Crawler',
        `✅ Crawl complete! Found ${filtered.length} events`
      );

      return filtered;
    } catch (error) {
      this.logger.error('Crawler', `❌ Crawl failed: ${error.message}`);
      throw error;
    }
  }

  async loadSources() {
    const configPath = path.join(process.cwd(), 'config', 'sources.json');
    const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8'));

    // Sort by priority
    return config.sources.sort((a, b) => a.priority - b.priority);
  }

  async fetchFromSource(source) {
    this.logger.info('Crawler', `📡 Fetching from: ${source.name}`);

    try {
      const AdapterClass = ADAPTER_MAP[source.adapter];

      if (!AdapterClass) {
        this.logger.warn('Crawler', `No adapter found for: ${source.adapter}`);
        return;
      }

      const adapter = new AdapterClass(source, this.cache, this.logger);
      const events = await adapter.fetch();

      // Store with source reference
      events.forEach(event => {
        this.events.push({
          source,
          data: event
        });
      });
    } catch (error) {
      this.logger.error('Crawler', `Failed to fetch from ${source.name}: ${error.message}`);
    }
  }

  filterAndRank(events) {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    this.logger.info('Crawler', `Filtering ${events.length} events...`);

    // Count events without dates for debugging
    const eventsWithoutDates = events.filter(e => !e.start_datetime).length;
    if (eventsWithoutDates > 0) {
      this.logger.warn('Crawler', `${eventsWithoutDates} events have no start_datetime`);
    }

    // Filter events
    let filtered = events.filter(event => {
      // If event has a date, check if it's upcoming
      if (event.start_datetime) {
        const eventDate = new Date(event.start_datetime);

        // Only include upcoming events (within next 2 weeks)
        if (eventDate < now || eventDate > new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)) {
          return false;
        }
      }
      // If no date, include it anyway (we'll rank it lower)

      // Filter out family/kids events
      const text = `${event.title} ${event.description}`.toLowerCase();
      if (/kids|children|family|toddler|baby/.test(text)) {
        return false;
      }

      return true;
    });

    // Calculate ranking scores
    filtered = filtered.map(event => {
      let score = 0;

      // Confidence score
      score += event.confidence * 30;

      // Category weights (focused on nightlife, restaurants, sports)
      const categoryWeights = {
        nightlife: 20,
        concert: 15,
        restaurant: 15,
        bar: 15,
        sports: 15,
        opening: 10,
        special: 5,
        active: 5,
        entertainment: 10
      };

      event.category.forEach(cat => {
        score += categoryWeights[cat] || 0;
      });

      // Recency (prefer events happening soon) - only if we have a date
      if (event.start_datetime) {
        const daysUntil = (new Date(event.start_datetime) - now) / (1000 * 60 * 60 * 24);
        if (daysUntil <= 3) score += 15;
        else if (daysUntil <= 7) score += 10;

        // Weekend bonus
        const eventDate = new Date(event.start_datetime);
        const dayOfWeek = eventDate.getDay();
        if (dayOfWeek === 5 || dayOfWeek === 6) score += 10; // Friday or Saturday
      } else {
        // Events without dates get a penalty
        score -= 20;
      }

      return {
        ...event,
        _rank_score: score
      };
    });

    // Sort by score
    filtered.sort((a, b) => b._rank_score - a._rank_score);

    return filtered;
  }

  async saveResults(events) {
    const dataDir = path.join(process.cwd(), 'data');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = path.join(dataDir, `events-${timestamp}.json`);

    await fs.promises.writeFile(
      filename,
      JSON.stringify(events, null, 2),
      'utf-8'
    );

    this.logger.info('Crawler', `💾 Saved events to: ${filename}`);

    // Also save as latest.json
    const latestPath = path.join(dataDir, 'latest.json');
    await fs.promises.writeFile(
      latestPath,
      JSON.stringify({
        updated_at: new Date().toISOString(),
        count: events.length,
        events
      }, null, 2),
      'utf-8'
    );

    this.logger.info('Crawler', `💾 Updated latest.json`);
  }
}

// Run if called directly
if (require.main === module) {
  const crawler = new Crawler();

  crawler.run()
    .then(() => {
      console.log('\n✨ Crawl completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Crawl failed:', error);
      process.exit(1);
    });
}

module.exports = Crawler;
