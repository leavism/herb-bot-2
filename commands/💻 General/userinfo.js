const { Command, Timestamp } = require('klasa')

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
    // If no user mention, then info pulled about author
    const user = ((message.mentions.users.size == 0) ? message.author : message.mentions.users.first())
    const tag = user.tag
    const createdAt = user.createdAt
    const createdDaysAgo = `(${Math.round((new Date() - createdAt) / (24 * 60 * 60 * 1000))} days ago)`
    const joinedAt = message.member.joinedAt
    const joinedDaysAgo = `(${Math.round((new Date() - joinedAt) / (24 * 60 * 60 * 1000))} days ago)`
    const roles = (message.member.roles.length == 0) ? 'No roles :(' : message.member.roles.map(m => m.name).filter(m => m != '@everyone').join(', ')
    const sortedMembers = message.guild.members.sort(compareJoinedAt).map(m => m.user)

    return message.send({
      embed: {
        title: tag,
        thumbnail: { url: user.avatarURL() },
        color: message.member.displayHexColor,
        fields: [
          {
            name: 'Joined Discord on',
            inline: true,
            value: `${this.timestamp.display(createdAt)}\n${createdDaysAgo}`
          },
          {
            name: 'Joined Simbad on',
            inline: true,
            value: `${this.timestamp.display(joinedAt)}\n${joinedDaysAgo}`
          },
          {
            name: 'Roles',
            inline: true,
            value: roles
          }
        ],
        footer: { text: `Member #${sortedMembers.indexOf(user) + 1} | User ID: ${user.id}` }
      }
    })
  }
}

function compareJoinedAt (a, b) {
  if (a.joinedAt > b.joinedAt) return 1
  else if (a.joinedAt < b.joinedAt) return -1
  return 0
}
