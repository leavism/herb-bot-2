const { Command, Timestamp } = require('klasa')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'jointransfer',
      aliases: ['jt'],
      permissionLevel: 10,
      guarded: true,
      usageDelim: ' '
    })
    this.timestamp = new Timestamp('MMMM D YYYY')
  }

  async init () {
    this.db = this.client.providers.get('simbad')
  }

  async run (message, [...params]) {
    message.guild.members.map(async (member) => {
      if (await this.checkUser(member) === false) await this.makeUser(member)
      const user = await this.getUser(member)
      await this.updateJoinTable({ user, member })
    })
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
