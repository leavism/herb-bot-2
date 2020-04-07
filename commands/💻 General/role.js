const { Command } = require('klasa')
const jRoles = require('../../data/joinable.json')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'role',
      aliases: ['roles'],
      enabled: true,
      description: 'Add or remove a role. If you already have a role, the command will remove it.',
      usage: '[Role:...string]',
      extendedHelp: 'Do not mention the role you\'re trying to join.'
    })
  }

  // For future reference, if you're wondering why the bot can edit the role of someone higher in role hierarchy than the bot, it's it'll only work if the role doesn't have a managerial permission. If the role has a managerial permission, it cannot give it to someone that has a higher permission than the bot
  async run (message, [targetRole]) {
    if (!targetRole) return message.send(`You didn't specify a role. Do **not** mention the role. Use \`${this.client.options.prefix}roles [role]\` to add or remove a role.\nHere's a list of roles you can join: ${this.buildRoleList()}`)

    const role = message.guild.roles.find(role => role.name.toLowerCase() === targetRole.toLowerCase())
    if (!role) return message.send(`'${targetRole}' isn't a role on this server.`)

    const joinableRole = jRoles.joinable.find(role => role.toLowerCase() === role.name.toLowerCase())
    if (!joinableRole) return message.send(`You aren't allowed manage the '${targetRole}' role.`)

    const alreadyHave = message.member.roles.find(role => role === role)
    if (alreadyHave) {
      message.member.roles.remove(role, `${message.member} used the leave command.`)
      return message.send(`I've removed the ${role.name} role.`)
    } else {
      message.member.roles.add(role, `${message.member} used the join command.`)
      return message.send(`I've given you the ${role.name} role.`)
    }
  }

  buildRoleList () {
    return `\`\`\`${jRoles.joinable.join('\n')}\`\`\``
  }
}
