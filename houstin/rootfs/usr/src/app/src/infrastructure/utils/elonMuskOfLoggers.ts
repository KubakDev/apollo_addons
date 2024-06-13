import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import HttpTransport from './httpTransport';

/**
 * The `ElonMuskOfLoggers` class is a singleton logger class that provides advanced logging functionalities.
 * It supports console, file, and HTTP transports with color-coded log levels and timestamps.
 * This logger class is designed to be highly configurable and easy to use.
 */
class ElonMuskOfLoggers {
  private static instance: ElonMuskOfLoggers;
  private ElonMuskOfLoggers: WinstonLogger;

  /**
   * Private constructor to prevent direct instantiation.
   * Initializes the logger with predefined formats and transports.
   */
  private constructor() {
    const logFormat = format.printf(({ level, message, timestamp, context }) => {
      return `${timestamp} ${level}: ${context ? `[${context}] ` : ''}${message}`;
    });

    const colorizer = format.colorize();

    const consoleFormat = format.combine(
      format.timestamp({ format: 'HH:mm:ss' }),
      format.printf(info => colorizer.colorize(info.level, `${info.timestamp} ${info.level}: ${info.message}`))
    );

    const fileFormat = format.combine(
      format.timestamp({ format: 'HH:mm:ss' }),
      logFormat
    );

    const httpFormat = format.combine(
      format.timestamp({ format: 'HH:mm:ss' }),
      format.json()
    );

    this.ElonMuskOfLoggers = createLogger({
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6
      },
      format: format.combine(
        format.timestamp({ format: 'HH:mm:ss' }),
        logFormat
      ),
      transports: [
        new transports.Console({ format: consoleFormat }),
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: fileFormat
        }),
        new HttpTransport({
          level: 'warn',
          url: 'https://your-monitoring-service/logs',
          format: httpFormat
        })
      ],
    });

    if (process.env.NODE_ENV === 'production') {
      this.ElonMuskOfLoggers.level = 'warn';
    } else if (process.env.NODE_ENV === 'development') {
      this.ElonMuskOfLoggers.level = 'debug';
    }
  }

  /**
   * Returns the singleton instance of the `ElonMuskOfLoggers` class.
   * If the instance does not exist, it creates one.
   */
  public static getInstance(): ElonMuskOfLoggers {
    if (!ElonMuskOfLoggers.instance) {
      ElonMuskOfLoggers.instance = new ElonMuskOfLoggers();
    }
    return ElonMuskOfLoggers.instance;
  }

  /**
   * Logs a message with the specified log level and optional context.
   * @param level - The log level (e.g., 'info', 'warn', 'error', 'debug').
   * @param message - The log message.
   * @param context - Optional context to include with the log message.
   */
  public log(level: string, message: string, context?: string): void {
    this.ElonMuskOfLoggers.log(level, message, { context });
  }

  /**
   * Logs an informational message with optional context.
   * @param message - The log message.
   * @param context - Optional context to include with the log message.
   */
  public info(message: string, context?: string): void {
    this.ElonMuskOfLoggers.info(message, { context });
  }

  /**
   * Logs a warning message with optional context.
   * @param message - The log message.
   * @param context - Optional context to include with the log message.
   */
  public warn(message: string, context?: string): void {
    this.ElonMuskOfLoggers.warn(message, { context });
  }

  /**
   * Logs an error message with optional context.
   * @param message - The log message.
   * @param context - Optional context to include with the log message.
   */
  public error(message: string, context?: string): void {
    this.ElonMuskOfLoggers.error(message, { context });
  }

  /**
   * Logs a debug message with optional context.
   * @param message - The log message.
   * @param context - Optional context to include with the log message.
   */
  public debug(message: string, context?: string): void {
    this.ElonMuskOfLoggers.debug(message, { context });
  }

  /**
   * Sets the log level for the logger.
   * @param level - The log level to set (e.g., 'info', 'warn', 'error', 'debug').
   */
  public setLogLevel(level: string): void {
    this.ElonMuskOfLoggers.level = level;
  }

  /**
   * Adds a new transport to the logger.
   * @param transport - The transport to add.
   */
  public addTransport(transport: any): void {
    this.ElonMuskOfLoggers.add(transport);
  }

  /**
   * Removes an existing transport from the logger.
   * @param transport - The transport to remove.
   */
  public removeTransport(transport: any): void {
    this.ElonMuskOfLoggers.remove(transport);
  }

  /**
   * Logs a performance-related message and calculates the execution time.
   * @param message - The log message.
   * @param context - Optional context to include with the log message.
   */
  public logPerformance(message: string, context?: string): void {
    const startTime = process.hrtime();
    this.ElonMuskOfLoggers.info(message, { context });
    const diff = process.hrtime(startTime);
    const executionTime = `${diff[0] * 1e3 + diff[1] / 1e6} ms`;
    this.ElonMuskOfLoggers.info(`Execution time: ${executionTime}`, { context });
  }

  /**
   * Logs a trace message with a trace ID and optional context.
   * @param message - The log message.
   * @param traceId - The trace ID to include with the log message.
   * @param context - Optional context to include with the log message.
   */
  public trace(message: string, traceId: string, context?: string): void {
    this.ElonMuskOfLoggers.log('http', `${message} - Trace ID: ${traceId}`, { context });
  }

  /**
   * Configures the logger with environment-specific settings.
   * @param envConfig - The environment-specific configuration object.
   */
  public static configure(envConfig: any): void {
    ElonMuskOfLoggers.getInstance().ElonMuskOfLoggers.configure(envConfig);
  }
}

// Usage example
const Elon = ElonMuskOfLoggers.getInstance();
Elon.info('This is an info message');
Elon.warn('This is a warning message');
Elon.error('This is an error message');
Elon.debug('This is a debug message');
Elon.logPerformance('Performance logging example');
Elon.trace('Tracing example', '12345-abcde');

export default Elon;
