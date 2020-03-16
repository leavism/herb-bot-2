const { Command } = require('klasa')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'chart',
      runIn: ['text', 'dm'],
      usage: '<SystemName:string> [Days:integer]',
      usageDelim: ', ',
      description: '',
      extendedHelp: 'No extended help available.'
    })
    this.db = this.client.providers.get('jegin')
  }

  async run (message, [systemName, days]) {
    const system = await this.db.get('system', 'name', systemName)
    const graph = new MessageEmbed()
      .setTitle(system.name)
      .setImage(`http://jegin.net/testchart2.php?sysid=${system.id}&sphere=${'SIMBAD REGIME'.replace(/ /g, '+')}&ts=${days}&rid=${Date.now()}`)
    message.send(graph)
  }
}
