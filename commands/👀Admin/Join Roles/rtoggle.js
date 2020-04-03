const { Command } = require('klasa')
const roleList = require('../../../data/joinable.json')
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

  async run (message, [roleName]) {
    if (!roleName) return message.send(`Here is a list of roles people can join: ${this.buildRoleList()} Use \`${this.client.options.prefix}rtoggle <role_name>\` if you want to toggle a role.`)

    const role = message.guild.roles.find(role => role.name.toLowerCase() === roleName.toLowerCase())
    if (!role) return message.send(`'${roleName}' isn't a role on this server.`)

    const isManagerial = role.permissions.toArray().some(role => this.managerial.includes(role))
    if (isManagerial) return message.send(`'${role.name}' has a managerial persmission. It isn't wise to toggle this role.`)
    
    if (roleList.joinable.includes(role.name)) {
      roleList.joinable.splice(roleList.joinable.indexOf(role.name), 1)
      return message.send(`'${role.name}' is no longer jonable. Here's a list of roles people can join: ${this.buildRoleList()}`)
    } else {
      roleList.joinable.push(role.name)
      await this.saveRoleList()
      return message.send(`'${role.name}' is now joinable. Here's a list of roles people can join: ${this.buildRoleList()}`)
    }
  }

  async saveRoleList () {
    return fs.writeFile('./data/joinable.json', JSON.stringify(roleList), err => console.log(err))
  }

  buildRoleList () {
    return `\`\`\`${roleList.joinable.join('\n')}\`\`\``
  }
}
