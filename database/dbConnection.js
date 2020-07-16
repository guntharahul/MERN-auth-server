require('dotenv').config();
const mongoose = require('mongoose');
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

mongoose
  .connect(dbConnectionURL.DATABASE_CONNECTION_URL, options)
  .then(() => {
    logger.info('Database Connection Successful');
  })
  .catch((err) => {
    logger.error.bind(
      console,
      'Database connection error:' + dbConnectionURL.MONGO_ATLAS_CONNECTION_URL
    );
  });
