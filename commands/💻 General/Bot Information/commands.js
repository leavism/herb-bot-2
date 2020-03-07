const { Command, util: { isFunction } } = require('klasa')
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
const { MessageEmbed } = require('discord.js')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      aliases: ['command', 'comands', 'comand'],
      guarded: true,
      description: 'Lists all the commands in a category.',
      usage: '<Command:command>',
      extendedHelp: 'This only works with command categories. Use the `help` command to see all categories.'
    })
  }

  async run (message, [command]) {
    if (command) return message.send(await this.buildCommandEmbed(message, command))
    message.send(await this.buildHelpEmbed(message))
  }

  async buildCommandEmbed (message, command) {
    const { prefix } = message.guildSettings
    const commandEmbed = new MessageEmbed()
      .setTitle(`Command \`\`\`${prefix}${command.name}\`\`\``)
      .setDescription(command.description)
      .addField(
        '🛠 Aliase(s)',
        (command.aliases.length > 0) ? command.aliases : 'None.'
      )
      .addField(
        '📝 Format',
        (command.usage.fullUsage(message).length > 0) ? `\`\`\`${command.usage.fullUsage(message)}\`\`\`` : 'No examples.'
      )
      .addField(
        '💡 Notes',
        (command.extendedHelp.length > 0) ? command.extendedHelp : 'No notes.'
      )
      .setFooter(
        '《 》 aliases │ < > required field │ [ ] optional field '
      )
    return commandEmbed
  }
}
