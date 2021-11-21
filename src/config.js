const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  api_key: process.env.API_KEY,
  token: process.env.TOKEN,
  prefix: process.env.PORTPREFIX,
  base_url: process.env.BASE_URL
};