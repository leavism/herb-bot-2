/* eslint-disable no-throw-literal */
const { Command } = require('klasa')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'home',
      description: 'Basic information about the Simbad home system.'
    })
  }

  async run (message, [systemA, systemB]) {
    const embed = {
      title: '**Simbad Regime**',
      description: '**Home: Farowalan / Bamford City**',
      thumbnail: { url: message.guild.iconURL() },
      color: 3447003,
      fields: [
        {
          name: '**EDDB Links:**',
          value: '**System: **https://eddb.io/system/4751\n **Station: **https://eddb.io/station/4799'
        },
        {
          name: '**Nearest Mat Traders:**',
          value: '**Raw: **Estae / Cogswell Dock - 24.78ly\n**Manufactured: **Farowalan / Bamford City - 0.0ly\n**Encoded: **HR 1257 / Jacobi Platform - 19.04ly'
        },
        {
          name: '**Nearest Tech Brokers:**',
          value: '**Guardian: **Diaguandri / Ray Gateway - 36.61ly\n**Human: **Ainunnicori / Tani Hub - 31.93ly'
        },
        {
          name: '**Nearest Interstellar Factors:**',
          value: 'Lokipi / Reed Installation - 8.66ly'
        }
      ]
    }
    message.channel.send({ embed })
  };
}
