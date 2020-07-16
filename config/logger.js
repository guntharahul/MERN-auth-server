const winston = require('winston');
const winstonDailyRotateFile = require('winston-daily-rotate-file');
const appRoot = require('app-root-path');
const { format } = require('winston');
require('dotenv').config();

const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  ),
  winston.format.errors({ stack: true })
);

let transports = [
  new winstonDailyRotateFile({
    filename: `${appRoot}/logs/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    handleExceptions: true,
  }),
  new winstonDailyRotateFile({
    filename: `${appRoot}/logs/combined-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    handleExceptions: true,
    colorize: false,
    json: true,
  }),
];

if (
  process.env.NODE_ENV &&
  (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')
) {
  transports.push(new winston.transports.Console({ level: 'info' }));
}

const logger = winston.createLogger({
  format: logFormat,
  transports,
  exitOnError: false,
});

logger.stream = {
  write: (message, encoding) => {
    logger.info(message);
  },
};

module.exports = logger;
