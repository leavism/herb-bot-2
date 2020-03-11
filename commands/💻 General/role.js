const { Command } = require('klasa')
const jRoles = require('../../data/joinable.json')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'role',
      enabled: true,
      description: 'Join or leave a role. If you already have a role, this will remove it.',
      usage: '<Role:...string>',
      extendedHelp: 'Do not mention the role you\'re trying to join.'
    })
  }

  async run (message, [targetRole]) {
    if (!message.member.manageable) return message.send('You have a higher permission than me!')

    const roleExist = message.guild.roles.find(role => role.name.toLowerCase() === targetRole.toLowerCase())
    if (!roleExist) return message.send(`'${targetRole}' isn't a role on this server.`)

    const joinableRole = jRoles.joinable.find(role => role.toLowerCase() === roleExist.name.toLowerCase())
    if (!joinableRole) return message.send(`You aren't allowed manage the '${targetRole}' role.`)

    const alreadyHave = message.member.roles.find(role => role === roleExist)
    if (alreadyHave) {
      message.member.roles.remove(roleExist, `${message.member} used the leave command.`)
      return message.send(`I've removed the ${roleExist.name} role.`)
    } else {
      message.member.roles.add(roleExist, `${message.member} used the join command.`)
      return message.send(`You now have the ${roleExist.name} role!`)
    }
  }
}
