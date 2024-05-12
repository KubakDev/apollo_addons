const winston = require("winston");
const { createLogger, format, transports } = winston;
const { combine, printf, colorize } = format;

// Set colors for different levels
const myCustomLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    debug: "blue",
  },
};

winston.addColors(myCustomLevels.colors);

const myFormat = printf(({ level, message, timestamp }) => {
  const time = new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: true,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${time} ${level}: ${message}`;
});

const logger = createLogger({
  levels: myCustomLevels.levels,
  format: combine(colorize(), format.timestamp(), myFormat),
  transports: [new transports.Console()],
});

module.exports = logger;
