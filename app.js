const { Client } = require('klasa')
const config = require('./config.js');

(() => {
  const client = new Client({
    prefix: '-',
    readyMessage: (client) => `Successfully initialized. Serving ${client.guilds.size} guilds.`
  })

  require('./modules/date.js')(client)
  client.login(config.token)
})()
