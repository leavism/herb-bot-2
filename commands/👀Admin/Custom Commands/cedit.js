const { Command } = require('klasa')
const customCommands = require('../../../data/ccommands.json')
const fs = require('fs')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'cedit',
      enabled: true,
      aliases: ['ce'],
      permissionLevel: 7,
      description: 'Edit the response of a custom command.',
      usage: '<Customcommand:string> <Response:...string>',
      usageDelim: ' ',
      extendedHelp: 'Edit the response to a custom command. You cannot change the name of a custom command. To do that, you need to remove and add it again with the name you\'d like.'
    })
  }

  async run (message, [command, response]) {
    if (!(command in customCommands)) {
      const allCustomCommands = Object.getOwnPropertyNames(customCommands)
      return message.send(`'${command}' isn't a custom command. Here is a list of commands:\n\`\`\`${allCustomCommands.sort().join('\n')}\`\`\``)
    }
    customCommands[command] = response
    await this.saveCommands()
    return message.send(`\`${command}\` has to set to: \`\`\`${response}\`\`\``)
  }

  async saveCommands () {
    return fs.writeFile('./data/ccommands.json', JSON.stringify(customCommands), err => console.log(err))
  }
}
