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
    this.db = this.client.providers.get('simbad')
  }

  async run (member) {
    if (await this.checkUser(member) === false) await this.makeUser(member)
    console.log(this.localISOTime(member.joinedAt))
    const user = await this.getUser(member)
    await this.updateJoinTable({ user, member })
    const joinLogChannelName = await this.db.get('config', 'key', 'join_log_channel')
    const joinLogChannel = member.guild.channels.find(channel => channel.name === joinLogChannelName.value)
    return joinLogChannel.send(await this.buildTargetInfoEmbed(member))
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
        `Joining ${memberObj.guild} on`,
        `${this.timestamp.display(memberObj.joinedAt)}\n${joinedDaysAgo}`,
        true
      )
      .addField(
        'Previous Join Dates (starting March 20, 2020)',
        await this.stringifyJoinDates(await this.getUser(memberObj)),
        false
      )
      .setFooter(`Member #${sortedMembers.indexOf(memberObj.user) + 1} | User ID: ${memberObj.id}`)
    return userInfoEmbed
  }

  /**
   * Add guild member into the user table
   * @param {guildMember} memberObj - The target guild member
   */
  async makeUser (memberObj) {
    const startingBalance = 0
    await this.db.run(`INSERT INTO user (discord_id, balance) VALUES (${memberObj.id}, ${startingBalance})`)
  }

  async updateJoinTable (data) {
    await this.db.run(`INSERT INTO simbad.join (user_id, date) VALUES (${data.user.id}, '${this.localISOTime(data.member.joinedAt)}')`)
  }

  async getJoinDates (user) {
    return this.db.runAll(`SELECT * FROM simbad.join WHERE user_id = ${user.id}`)
  }

  async stringifyJoinDates (user) {
    const joinDates = await this.getJoinDates(user)
    return joinDates.map(obj => `${this.timestamp.display(obj.date)}`).join(', ')
  }

  /**
   * Gets the shop user from the user table based on discord_id
   * @param {guildMember} memberObj - The target guild member
   */
  async getUser (memberObj) {
    return this.db.get('user', 'discord_id', memberObj.id)
  }

  /**
   * Checks if guild member is in the user table
   * @param {guildMember} memberObj - The target guild member
   * @returns {boolean} - Whether guild member is in user table (true) or not in the table (false)
   */
  async checkUser (memberObj) {
    const result = await this.db.get('user', 'discord_id', memberObj.id)
    if (result == null) {
      return false
    }
    return true
  }

  localISOTime (d) {
    if (!d) d = new Date()
    var tzoffset = d.getTimezoneOffset() * 60000 // offset in milliseconds
    return (new Date(d - tzoffset)).toISOString().slice(0, 19).replace('T', ' ')
  }
}
