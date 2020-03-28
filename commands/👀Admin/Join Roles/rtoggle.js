const { Command } = require('klasa')
const jRoles = require('../../../data/joinable.json')
const fs = require('fs')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'rtoggle',
      enabled: true,
      aliases: ['rt', 'roletoggle'],
      permissionLevel: 7,
      description: 'Toggle whether people can use the role command on a role.',
      usage: '[Role:...string]',
      extendedHelp: 'You do not need to mention the role. For example: to toggle the Simbian role, do `?rt simbian`.',
    })
    this.managerial = ["ADMINISTRATOR", "KICK_MEMBERS", "BAN_MEMBERS", "MANAGE_CHANNELS", "MANAGE_GUILD", "MANAGE_ROLES", "MANAGE_WEBHOOKS"];
  }

  async run (message, [targetRole]) {
    if (!targetRole) return message.send(`Here is a list of roles people can join: ${this.buildRoleList()} Use \`${this.client.options.prefix}rtoggle <role_name>\` if you want to toggle a role.`)
    const roleExist = message.guild.roles.find(role => role.name.toLowerCase() === targetRole.toLowerCase())
    if (!roleExist) return message.send(`'${targetRole}' isn't a role on this server.`)
    const roleManagerial = roleExist.permissions.toArray().some(role => this.managerial.includes(role))
    if (roleManagerial) return message.send(`'${roleExist.name}' has a managerial persmission. It isn't wise to toggle this role.`)
    if (jRoles.joinable.includes(roleExist.name)) {
      jRoles.joinable.splice(jRoles.joinable.indexOf(roleExist.name), 1)
      return message.send(`'${roleExist.name}' is no longer jonable. Here's a list of roles people can join: ${this.buildRoleList()}`)
    } else {
      jRoles.joinable.push(roleExist.name)
      await this.saveJoinables()
      return message.send(`'${roleExist.name}' is now joinable. Here's a list of roles people can join: ${this.buildRoleList()}`)
    }
  }

  async saveJoinables () {
    return fs.writeFile('./data/joinable.json', JSON.stringify(jRoles), err => console.log(err))
  }

  buildRoleList () {
    return `\`\`\`${jRoles.joinable.join('\n')}\`\`\``
  }
}
