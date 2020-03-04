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
      usage: '[mention:member]',
      extendedHelp: 'You can mention another user for their user information. If you don\'t, it\'ll pull out author information.'
    })
    this.timestamp = new Timestamp('MMMM d YYYY')
  }

  async run (message, [target]) {
    target = target || message.member
    return message.send(await this.buildTargetInfoEmbed(target))
  }

  /**
   * Builds a message embed containing information about a guild member
   * @param {guildMember} memberObj - The target guild member
   */
  async buildTargetInfoEmbed (memberObj) {
    // If no user mention, then info pulled about author
    const createdDaysAgo = `(${Math.round((new Date() - memberObj.user.createdAt) / (24 * 60 * 60 * 1000))} days ago)`
    const joinedDaysAgo = `(${Math.round((new Date() - memberObj.joinedAt) / (24 * 60 * 60 * 1000))} days ago)`
    const roles = (memberObj.roles.size === 1) ? 'No roles :(' : memberObj.roles.map(m => m).filter(m => m.name !== '@everyone').join(' ')
    const sortedMembers = memberObj.guild.members.sort(this.compareJoinedAt).map(m => m.user)

    const userInfoEmbed = new MessageEmbed()
      .setAuthor(`${memberObj.user.tag} ${(memberObj.nickname) ? `(${memberObj.nickname})` : ''}`, memberObj.user.displayAvatarURL())
      .setThumbnail(memberObj.user.displayAvatarURL())
      .setDescription(`${memberObj.user}`)
      .setColor(memberObj.displayHexColor)
      .addField(
        'Joined Discord on',
        `${this.timestamp.display(memberObj.user.createdAt)}\n${createdDaysAgo}`,
        true
      )
      .addField(
        `Joined ${memberObj.guild} on`,
        `${this.timestamp.display(memberObj.joinedAt)}\n${joinedDaysAgo}`,
        true
      )
      .addField(
        'Roles',
        roles,
        false
      )
      .setFooter(`Member #${sortedMembers.indexOf(memberObj.user) + 1} | User ID: ${memberObj.id}`)
    return userInfoEmbed
  }

  compareJoinedAt (a, b) {
    if (a.joinedAt > b.joinedAt) return 1
    else if (a.joinedAt < b.joinedAt) return -1
    return 0
  }
}
