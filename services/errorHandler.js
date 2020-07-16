/**
 * Invalid error is thrown whenever the request for an endpoint doesn't meet the required conditions. Example: Request body fails to meet Joi conditions
 * UnauthorizedError is thrown from middlewares whenever user accessing an endpoint doesn't have the required roles
 * PageNotFoundError is thrown when in certain conditions you want to hide that the endpoint actually exists
 * Rest of the errors are Internal Server Errors.
 */
const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  res.format({
    html: () => {
      if (typeof err === 'string') {
        return res.status(400).render('400', { message: err });
      }
      if (err.message === 'UnauthorizedError') {
        return res.status(401).render('401', { message: err.message });
      }
      if (err.message === 'PageNotFoundError') {
        return res.status(404).render('404', { message: err.message });
      }

      logger.error(err.message);
      return res
        .status(500)
        .render('500', { message: 'Oops! Something went wrong.' });
    },
    json: () => {
      if (typeof err === 'string') {
        return res.status(400).json({ success: false, message: err });
      }
      if (err.message === 'UnauthorizedError') {
        return res.status(401).json({ success: false, message: err.message });
      }
      if (err.message === 'PageNotFoundError') {
        return res.status(404).json({ success: false, message: err.message });
      }

      logger.error(err.message);
      return res.status(500).json({ message: 'Oops! Something went wrong.' });
    },
    default: () => {
      if (typeof err === 'string') {
        return res.type('txt').send(err);
      }
      if (err.message === 'UnauthorizedError') {
        return res.type('txt').send('Forbidden method.');
      }
      if (err.message === 'PageNotFoundError') {
        return res.type('txt').send('Page not found.');
      }

      logger.error(err.message);
      return res.type('txt').send('Oops! Something went wrong.');
    },
  });
};
