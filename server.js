const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const hpp = require('hpp');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const lusca = require('lusca');
const useragent = require('express-useragent');
const mongoSanitize = require('express-mongo-sanitize');
const logger = require('./config/logger');
const { PORT } = require('./config/index');
require('dotenv').config();
const app = express();

//import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

//Database connection
require('./database/dbConnection');

// application middlewares
app.use(useragent.express());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
  })
);
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');

// It shows the real origin IP in the heroku or Cloudwatch logs
app.enable('trust proxy', true);

//Storing server logs logs
app.use(morgan('dev'));
app.use(morgan('combined', { stream: logger.stream }));

app.use(cookieParser());

//extra protection to handle requests from CSRF and any attacks
app.use(helmet());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//  Data sanitization against NoSQL query Injection
app.use(mongoSanitize());
//  Avoid http parameter pollution
app.use(hpp());
//  Avoid xss injection
app.use(xss());

// app.use(cors()); //allows all orgins
app.use((req, res, next) => {
  req.userip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET, HEAD, OPTIONS, POST, PUT, DELETE'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, authtoken, contentType, Content-Type, authorization'
  );
  next();
});

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  app.use(cors({ origin: `http://localhost:3000` }));
}

// Uncaught Exceptions and Unhandled Rejections Handler
process.on('unhandledRejection', (reason, rejectedPromise) => {
  logger.log('error', `${reason}`);
  throw reason;
});

process.on('uncaughtException', (err) => {
  if (err) {
    logger.error('error', `${err.message}, ${err.stack}`);
    process.exit(1);
  }
});

//API url's
app.options('*', (req, res) => {
  res.end();
});
app.use('/api', authRoutes);
app.use('/api', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'URL not found',
  });
});

app.listen(PORT, (err) => {
  if (err) {
    logger.error('Failed to start server');
    logger.error(err);
    process.exit(1);
  }
  logger.info(`Server listening to port ${PORT}`);
});
