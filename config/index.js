const dotenv = require('dotenv');
const isEnvPresent = dotenv.config();

if (isEnvPresent.error) {
  throw new Error('.env is not present.');
}
module.exports = { PORT: process.env.PORT };
