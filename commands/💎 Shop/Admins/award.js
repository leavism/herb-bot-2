/* eslint-disable no-throw-literal */
const { Command } = require('klasa')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'award',
      description: 'Award someone Simbits.',
      usage: '<User:member> <Amount:integer>',
      usageDelim: ' ',
      extendedHelp: 'Separate the user mention from the amount awarded with a space.'
    })
    this.db = this.client.providers.get('mysql')
  }

  async run (message, [member, amount]) {
    if (await this.checkUser(member) === false) await this.makeUser(member)
    const awarded = await this.awardUser(member, amount)
    if (awarded) {
      return message.send(`${member} has been awarded ${amount} Simbits!`)
    } else {
      return message.send('That would exceed the maximum balance of 2147483647 Simbits.')
    }
  }

  /**
   * Add guild member into the user table
   * @param {guildMember} memberObj - The target guild member
   */
  async makeUser (memberObj) {
    const startingBalance = 0
    await this.db.run(`INSERT INTO user (discord_id, balance) VALUES (${memberObj.id}, ${startingBalance})`)
  }

  async awardUser (memberObj, amount) {
    const shopUser = await this.db.get('user', 'discord_id', memberObj.id)
    if (shopUser.balance + amount >= 2147483647) return false
    this.db.run(`UPDATE user SET balance = balance + ${amount} WHERE discord_id = ${memberObj.id}`)
    return true
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
}
