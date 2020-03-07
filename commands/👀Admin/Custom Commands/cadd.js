const { Command } = require('klasa')
const customCommands = require('../../../data/ccommands.json')
const fs = require('fs')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'cadd',
      enabled: true,
      aliases: ['ca'],
      permissionLevel: 7,
      description: 'Add a new custom command.',
      usage: '<Command:string> <Response:...string>',
      usageDelim: ' ',
      extendedHelp: 'The name of the custom command will be the first word. Anything after the first space will be the custom command response, including any subsequent spaces.'
    })
  }

  async run (message, [command, response]) {
    if ((command in customCommands)) {
      return message.send(`'${command}' already a custom command.`)
    }
    customCommands[command] = response
    await this.saveCommands()
    return message.send(`\`${this.client.options.prefix}${command}\` has to set to: \`\`\`${response}\`\`\``)
  }

  async saveCommands () {
    return fs.writeFile('./data/ccommands.json', JSON.stringify(customCommands), err => console.log(err))
  }
}
