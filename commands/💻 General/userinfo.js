const { Command, Timestamp } = require('klasa')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'userinfo',
      enabled: 'true',
      runIn: ['text'],
      cooldown: 3,
      description: 'Get basic user information!',
      usage: '[mention:user]',
      extendedHelp: 'You can mention another user for their user information. If you don\'t, it\'ll pull out author information.'
    })
    this.timestamp = new Timestamp('d MMMM YYYY')
  }

  async run (message, [...params]) {
    return message.send(await this.buildUserInfoEmbed(message))
  }

  async buildUserInfoEmbed (message) {
    // If no user mention, then info pulled about author
    const user = ((message.mentions.users.size === 0) ? message.author : message.mentions.users.first())
    const createdDaysAgo = `(${Math.round((new Date() - user.createdAt) / (24 * 60 * 60 * 1000))} days ago)`
    const joinedDaysAgo = `(${Math.round((new Date() - message.member.joinedAt) / (24 * 60 * 60 * 1000))} days ago)`
    const roles = (message.member.roles.length === 0) ? 'No roles :(' : message.member.roles.map(m => m.name).filter(m => m !== '@everyone').join(', ')
    const sortedMembers = message.guild.members.sort(this.compareJoinedAt).map(m => m.user)

    const userInfoEmbed = new MessageEmbed()
      .setTitle(user.tag)
      .setThumbnail(user.avatarURL())
      .setColor(message.member.displayHexColor)
      .addField(
        'Joined Discord on',
        `${this.timestamp.display(user.createdAt)}\n${createdDaysAgo}`,
        true
      )
      .addField(
        'Joined Simbad on',
        `${this.timestamp.display(message.member.joinedAt)}\n${joinedDaysAgo}`,
        true
      )
      .addField(
        'Roles',
        roles,
        true
      )
      .setFooter(`Member #${sortedMembers.indexOf(user) + 1} | User ID: ${user.id}`)
    return userInfoEmbed
  }

  compareJoinedAt (a, b) {
    if (a.joinedAt > b.joinedAt) return 1
    else if (a.joinedAt < b.joinedAt) return -1
    return 0
  }
}
