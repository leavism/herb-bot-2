const { Command } = require('klasa')
const { MessageEmbed } = require('discord.js')
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      aliases: ['halp'],
      guarded: true,
      permissionLevel: 0,
      description: 'Lists all the categories or displays detailed info about a command.',
      usage: '[Command:command]',
      extendedHelp: 'You can specify a command to get detailed information about that command. Using the command by itself will list all the different command categories.'
    })

    this.createCustomResolver('command', (arg, possible, message) => {
      if (!arg || arg === '') return undefined
      return this.client.arguments.get('command').run(arg, possible, message)
    })
  }

  async run (message, [command]) {
    if (command) {
      return message.send(await this.buildCommandEmbed(message, command))
    }
    return message.send(await this.buildHelpEmbed(message))
  }

  async buildCommandEmbed (message, command) {
    const { prefix } = message.guildSettings
    const commandEmbed = new MessageEmbed()
      .setTitle(`Command \`\`\`${prefix}${command.name}\`\`\``)
      .setDescription(command.description)
      .addField(
        '🛠 Aliase(s)',
        (command.aliases.length > 0) ? command.aliases : 'None.',
        false
      )
      .addField(
        '📝 Format',
        (command.usage.fullUsage(message).length > 0) ? `\`\`\`${command.usage.fullUsage(message)}\`\`\`` : 'No examples.',
        false
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

  async buildHelpEmbed (message) {
    const { prefix } = message.guildSettings
    const all = {}
    await Promise.all(this.client.commands.map((command) =>
      this.client.inhibitors.run(message, command, true)
        .then(() => {
          if (!has(all, command.category)) all[command.category] = []
          all[command.category].push(command)
        })
        .catch(() => {
          // To pass over commands that aren't included.
        })
    ))
    const helpEmbed = new MessageEmbed()
      .setAuthor(this.client.user.username, this.client.user.displayAvatarURL())
      .setDescription(`To view the commands of each group, use:\n\`\`\`${prefix}commands <group>\`\`\``)
    Object.keys(all).forEach((category) => {
      helpEmbed.addField(
        category,
        `${all[category].length} commands`,
        true
      )
    })
    return helpEmbed
  }
}
