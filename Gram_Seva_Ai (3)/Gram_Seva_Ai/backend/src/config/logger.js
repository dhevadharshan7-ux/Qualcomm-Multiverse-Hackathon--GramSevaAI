/**
 * Structured logger for Gram Seva AI.
 * Wraps console with timestamps and log levels.
 * Swap this for Winston/Pino in production without changing call sites.
 */

const LOG_LEVELS = Object.freeze({ DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 });

const CURRENT_LEVEL =
  LOG_LEVELS[String(process.env.LOG_LEVEL || 'INFO').toUpperCase()] ??
  LOG_LEVELS.INFO;

const timestamp = () => new Date().toISOString();

const format = (level, message, meta) => {
  const base = `[${timestamp()}] [${level}] ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
};

const logger = {
  debug: (message, meta) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.debug(format('DEBUG', message, meta));
    }
  },
  info: (message, meta) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.info(format('INFO', message, meta));
    }
  },
  warn: (message, meta) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(format('WARN', message, meta));
    }
  },
  error: (message, meta) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(format('ERROR', message, meta));
    }
  },
  /** Legacy compat */
  log: (message, meta) => logger.info(message, meta),
};

module.exports = logger;