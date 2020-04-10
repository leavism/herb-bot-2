const { Command } = require('klasa')
const { MessageEmbed } = require('discord.js')
const fetch = require('node-fetch')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'trend',
      runIn: ['text', 'dm'],
      usage: '<SystemName:string> [Days:integer]',
      usageDelim: ', ',
      description: '',
      extendedHelp: 'No extended help available.'
    })
  }

  async init () {
    this.jegin = this.client.providers.get('jegin')
  }

  async run (message, [systemName, days]) {
    const system = await this.jegin.get('system', 'name', systemName)
    if (system === null) return message.send(`I couldn't find the '${systemName}' system.`)
    message.send(await this.buildTrendEmbed(system, days))
  }

  async buildTrendEmbed (systemObj, days) {
    const trendEmbed = new MessageEmbed()
      .setTitle(systemObj.name)
      .setFooter('Any stats that have the value \'NONE\' will not be displayed')
      .setImage(`http://jegin.net/testchart2.php?sysid=${systemObj.id}&sphere=${'SIMBAD REGIME'.replace(/ /g, '+')}&ts=${days}&rid=${Date.now()}`)

    const data = await this.fetchFactionHistory(systemObj)
    for (var index in data) {
      const faction = data[index]
      if (faction.controlling === 1) {
        trendEmbed.setDescription(`Controlling faction is ${faction.faction}`)
      }
      let string = `Influence: **${faction.influence}%**`
      string = (faction.state === 'NONE') ? string : string += `\nState: **${faction.state}**`
      string = (faction.pending[0].state === 'NONE') ? string : string += `\nPending: **${faction.pending[0].state}**`
      string = (faction.recover[0].state === 'NONE') ? string : string += `\nRecovering: **${faction.recover[0].state}**`
      string += `\nMood: **${faction.happiness}**`

      trendEmbed.addField(
        `**${faction.faction}**`,
        string,
        true
      )
    }
    return trendEmbed
  }

  async fetchFactionHistory (systemObj) {
    const url = `https://jegin.net/api0.php?sysid=${systemObj.id}`
    const response = await fetch(url)
    return response.json()
  }
}
