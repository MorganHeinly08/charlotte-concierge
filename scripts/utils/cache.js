const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');
const CACHE_DURATION_DAYS = 7;

/**
 * Simple file-based cache for HTTP responses
 */
class Cache {
  constructor() {
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  /**
   * Generate cache key from URL
   */
  getCacheKey(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  /**
   * Get cached response if valid
   */
  async get(url) {
    const key = this.getCacheKey(url);
    const cachePath = path.join(CACHE_DIR, `${key}.json`);

    if (!fs.existsSync(cachePath)) {
      return null;
    }

    try {
      const cached = JSON.parse(await fs.promises.readFile(cachePath, 'utf-8'));
      const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
      const maxAge = CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000;

      if (cacheAge > maxAge) {
        // Cache expired
        await fs.promises.unlink(cachePath);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.warn(`Cache read error for ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Save response to cache
   */
  async set(url, data) {
    const key = this.getCacheKey(url);
    const cachePath = path.join(CACHE_DIR, `${key}.json`);

    const cacheData = {
      url,
      timestamp: new Date().toISOString(),
      data
    };

    try {
      await fs.promises.writeFile(
        cachePath,
        JSON.stringify(cacheData, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn(`Cache write error for ${url}:`, error.message);
    }
  }

  /**
   * Clear old cache files
   */
  async clearExpired() {
    const files = await fs.promises.readdir(CACHE_DIR);
    const maxAge = CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000;
    let cleared = 0;

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = await fs.promises.stat(filePath);
      const age = Date.now() - stats.mtimeMs;

      if (age > maxAge) {
        await fs.promises.unlink(filePath);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`Cleared ${cleared} expired cache files`);
    }
  }
}

module.exports = Cache;
