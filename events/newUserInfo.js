const { Event, Timestamp } = require('klasa')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Event {
  constructor (...args) {
    super(...args, {
      name: 'newUserInfo',
      enabled: true,
      event: 'guildMemberAdd'
    })
    this.timestamp = new Timestamp('MMMM d YYYY')
  }

  async run (member) {
    const joinLog = await this.db.get('config', 'key', 'join_log_channel')
    console.log(joinLog)
    const joinLogChannel = member.guild.channels.find(channel => channel.name === joinLog.value)
    return joinLogChannel.send(await this.buildTargetInfoEmbed(member))
  }

  async init () {
    this.db = this.client.providers.get('simbad')
  }

  async buildTargetInfoEmbed (memberObj) {
    // If no user mention, then info pulled about author
    const createdDaysAgo = `(${Math.round((new Date() - memberObj.user.createdAt) / (24 * 60 * 60 * 1000))} days ago)`
    const joinedDaysAgo = `(${Math.round((new Date() - memberObj.joinedAt) / (24 * 60 * 60 * 1000))} days ago)`
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
      .setFooter(`Member #${sortedMembers.indexOf(memberObj.user) + 1} | User ID: ${memberObj.id}`)
    return userInfoEmbed
  }
}
