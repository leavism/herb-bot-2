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
      usage: '[Role:role]',
      extendedHelp: ''
    })
  }

  async run (message, [role]) {
    if (!role) return message.send(`Here is a list of roles people can join: ${this.buildRoleList()} Use \`${this.client.options.prefix}rtoggle @rolemention\` if you want to toggle a role.`)
    if (jRoles.joinable.includes(role.name)) {
      jRoles.joinable.splice(jRoles.joinable.indexOf(role.name), 1)
      return message.send(`${role.name} is no longer jonable. Here's a list of roles people can join: ${this.buildRoleList()}`)
    } else {
      jRoles.joinable.push(role.name)
      await this.saveJoinables()
      return message.send(`${role.name} is now joinable. Here's a list of roles people can join: ${this.buildRoleList()}`)
    }
  }

  async saveJoinables () {
    return fs.writeFile('./data/joinable.json', JSON.stringify(jRoles), err => console.log(err))
  }

  buildRoleList () {
    return `\`\`\`${jRoles.joinable.join('\n@')}\`\`\``
  }
}
