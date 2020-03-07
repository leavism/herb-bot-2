const { Command } = require('klasa')
const customCommands = require('../../../data/ccommands.json')
const fs = require('fs')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'cremove',
      enabled: true,
      aliases: ['cr'],
      permissionLevel: 7,
      description: 'Remove a custom command.',
      usage: '<Customcommand:string>',
      extendedHelp: 'You only need to provide the name of the custom command.'
    })
  }

  async run (message, [command]) {
    if (!(command in customCommands)) {
      const allCustomCommands = Object.getOwnPropertyNames(customCommands)
      return message.send(`\`${this.client.options.prefix}${command}\` isn't a custom command. Here is a list of commands:\n\`\`\`${allCustomCommands.sort().join('\n')}\`\`\``)
    }
    delete customCommands[command]
    await this.saveCommands()
    return message.send(`\`${this.client.options.prefix}${command}\` has been removed from custom commands.`)
  }

  async saveCommands () {
    return fs.writeFile('./data/ccommands.json', JSON.stringify(customCommands), err => console.log(err))
  }
}
