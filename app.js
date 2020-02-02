const { Client } = require('klasa');
const config = require('./config.js');

(() => {
  const client = new Client({
    prefix: '-',
    readyMessage: (client) => `Successfully initialized. Serving ${client.guilds.size} guilds.`
  });
  client.login(config.token)
})();