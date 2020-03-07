const { Command } = require('klasa')
const customCommands = require('../../../data/ccommands.json')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'clist',
      enabled: true,
      aliases: ['cl'],
      permissionLevel: 0,
      description: 'List all custom commands.',
      usage: ''
    })
  }

  async run (message, [command]) {
    const allCustomCommands = Object.getOwnPropertyNames(customCommands)
    return message.send(`Here is a list of commands:\n\`\`\`${allCustomCommands.sort().join('\n')}\`\`\``)
  }
}
