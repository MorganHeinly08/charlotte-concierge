class BaseAdapter {
  constructor(source, cache, logger) {
    this.source = source;
    this.cache = cache;
    this.logger = logger;
    this.rateLimitDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting - wait before making request
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch URL with caching and rate limiting
   */
  async fetchWithCache(url, options = {}) {
    // Check cache first
    const cached = await this.cache.get(url);
    if (cached) {
      this.logger.info(this.source.name, `Cache hit for ${url}`);
      return cached;
    }

    // Rate limit
    await this.rateLimit();

    try {
      this.logger.info(this.source.name, `Fetching ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CharlotteConcierge/1.0; +https://github.com/MorganHeinly08/charlotte-concierge)',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.text();

      // Cache the response
      await this.cache.set(url, data);

      return data;
    } catch (error) {
      this.logger.error(this.source.name, `Fetch failed for ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Must be implemented by subclasses
   * Fetch raw data from source
   */
  async fetchRaw() {
    throw new Error('fetchRaw() must be implemented by adapter');
  }

  /**
   * Must be implemented by subclasses
   * Parse raw data into structured format
   */
  async parse(rawData) {
    throw new Error('parse() must be implemented by adapter');
  }

  /**
   * Main entry point - fetch and parse
   */
  async fetch() {
    try {
      const rawData = await this.fetchRaw();
      const events = await this.parse(rawData);

      this.logger.success(
        this.source.name,
        `Fetched ${events.length} events`,
        { items_found: events.length, status: 'success' }
      );

      return events;
    } catch (error) {
      this.logger.error(
        this.source.name,
        `Adapter failed: ${error.message}`,
        { status: 'failed', error: error.message }
      );
      return [];
    }
  }
}

module.exports = BaseAdapter;
