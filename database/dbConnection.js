require('dotenv').config();
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const express = require('express');
const app = express();
const logger = require('../config/logger');

const options = {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true,
  autoIndex: false,
  poolSize: 10,
  bufferMaxEntries: 0,
};

const dbConnectionURL = {
  DATABASE_CONNECTION_URL: process.env.DATABASE,
};

mongoose.connect(dbConnectionURL.DATABASE_CONNECTION_URL, options);
const db = mongoose.connection;
db.then(() => {
  logger.info('Database Connection Successful');
}).catch((err) => {
  logger.error.bind(
    console,
    'Database connection error:' + dbConnectionURL.MONGO_ATLAS_CONNECTION_URL
  );
});

// storing session in MongoDB
app.use(
  session(
    {
      resave: true,
      saveUninitialized: true,
      secret: 'qwertyuiopasdfghjkzxcvbnm',
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
      store: new MongoStore({
        mongooseConnection: mongoose.connection,
        autoReconnect: true,
      }),
    },
    { timeStamp: true }
  )
);
