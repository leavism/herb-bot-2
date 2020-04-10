const { Event, Timestamp } = require('klasa')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Event {
  constructor (...args) {
    super(...args, {
      name: 'newUserInfo',
      enabled: true,
      event: 'guildMemberAdd'
    })
    this.timestamp = new Timestamp('MMMM D YYYY')
  }

  async init () {
    this.simbad = this.client.providers.get('simbad')
  }

  async run (member) {
    if (!(await this.simbad.checkUser(member))) await this.simbad.makeUser(member)
    const user = await this.simbad.getUser(member)
    await this.updateJoinTable({ user, member })

    const joinLogChannelName = await this.simbad.get('config', 'key', 'join_log_channel')
    const joinLogChannel = member.guild.channels.find(channel => channel.name === joinLogChannelName.value)
    return joinLogChannel.send(await this.buildTargetInfoEmbed(member))
  }

  /**
   * Builds the message embed for when a new user joins the Discord
   * @param {GuildMember} memberObj Target guild member
   */
  async buildTargetInfoEmbed (memberObj) {
    const createdDaysAgo = `(${Math.round((new Date() - memberObj.user.createdAt) / (24 * 60 * 60 * 1000))} days ago)`
    const joinedDaysAgo = `(${Math.round((new Date() - memberObj.joinedAt) / (24 * 60 * 60 * 1000))} days ago)`

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
        `Joining ${memberObj.guild} on`,
        `${this.timestamp.display(memberObj.joinedAt)}\n${joinedDaysAgo}`,
        true
      )
      .addField(
        'Previous Join Dates',
        await this.stringifyJoinDates(await this.simbad.getUser(memberObj)),
        false
      )
      .setFooter(`User ID: ${memberObj.id}`)
    return userInfoEmbed
  }

  /**
   * Updates the databate join table
   * @param {objectLiteral} data - Contains the database user object and the Discord member object
   */
  async updateJoinTable (data) {
    await this.simbad.run(`INSERT INTO simbad.join (user_id, date) VALUES (${data.user.id}, '${this.localISOTime(data.member.joinedAt)}')`)
  }

  /**
   * Gets all the rows in the database join table of a specific user
   * @param {userObj} user - Database user object
   */
  async getJoinDates (user) {
    return this.simbad.runAll(`SELECT * FROM simbad.join WHERE user_id = ${user.id}`)
  }

  /**
   * Puts all the previous join dates into a string
   * @param {userObj} user - Database user object
   */
  async stringifyJoinDates (user) {
    const joinDates = await this.getJoinDates(user)
    return joinDates.map(obj => `${this.timestamp.display(obj.date)}`).join(', ')
  }

  /**
   * Converts ISOTime of date object to current timezome, keeping the ISO format
   * @param {Date} date - Date object
   */
  localISOTime (date) {
    if (!date) date = new Date()
    var tzoffset = date.getTimezoneOffset() * 60000 // offset in milliseconds
    return (new Date(date - tzoffset)).toISOString().slice(0, 19).replace('T', ' ')
  }
}
