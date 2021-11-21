const axios = require('axios').default;
const { base_url, api_key } = require('../config');

async function getVideosByQueryString(queryString){
    const { data } = await axios.get(base_url, {
      params: {
        key: api_key,
        q: queryString,
        type: 'audio'
      }
    })
    return data
}
module.exports = getVideosByQueryString