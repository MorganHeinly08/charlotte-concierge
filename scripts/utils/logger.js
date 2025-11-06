const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logs = [];
    this.startTime = new Date();
  }

  log(level, source, message, meta = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      ...meta
    };

    this.logs.push(entry);

    // Also log to console
    const color = {
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      success: '\x1b[32m'
    }[level] || '';

    console.log(`${color}[${level.toUpperCase()}] ${source}: ${message}\x1b[0m`);
  }

  info(source, message, meta) {
    this.log('info', source, message, meta);
  }

  warn(source, message, meta) {
    this.log('warn', source, message, meta);
  }

  error(source, message, meta) {
    this.log('error', source, message, meta);
  }

  success(source, message, meta) {
    this.log('success', source, message, meta);
  }

  async saveLogs(outputPath) {
    const logData = {
      scrape_start: this.startTime.toISOString(),
      scrape_end: new Date().toISOString(),
      duration_ms: Date.now() - this.startTime.getTime(),
      total_logs: this.logs.length,
      logs: this.logs,
      summary: this.generateSummary()
    };

    const logFilename = path.join(
      outputPath,
      `scrape-log-${new Date().toISOString().split('T')[0]}.json`
    );

    await fs.promises.writeFile(
      logFilename,
      JSON.stringify(logData, null, 2),
      'utf-8'
    );

    console.log(`\nLogs saved to: ${logFilename}`);
    return logFilename;
  }

  generateSummary() {
    const summary = {
      total_events: 0,
      sources: {},
      errors: 0,
      warnings: 0
    };

    this.logs.forEach(log => {
      if (log.level === 'error') summary.errors++;
      if (log.level === 'warn') summary.warnings++;

      if (log.items_found) {
        summary.total_events += log.items_found;
      }

      if (log.source) {
        if (!summary.sources[log.source]) {
          summary.sources[log.source] = {
            events: 0,
            errors: 0,
            status: 'unknown'
          };
        }

        if (log.items_found) {
          summary.sources[log.source].events += log.items_found;
        }
        if (log.status) {
          summary.sources[log.source].status = log.status;
        }
        if (log.level === 'error') {
          summary.sources[log.source].errors++;
        }
      }
    });

    return summary;
  }
}

module.exports = Logger;
