/* eslint-disable no-throw-literal */
const { Command } = require('klasa')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'award',
      description: 'Award someone Simbits.',
      permissionLevel: 9,
      usage: '<User:member> <Amount:integer>',
      usageDelim: ' ',
      extendedHelp: 'Separate the user mention from the amount awarded with a space.'
    })
    this.db = this.client.providers.get('mysql')
  }

  async run (message, [member, amount]) {
    if (await this.checkUser(member) === false) await this.makeUser(member)
    const shopUser = await this.getUser(member)
    if (shopUser.balance + amount >= 2147483647) return message.send('That would exceed the maximum balance of 2147483647 Simbits.')
    if (amount <= 0) return message.send('Cannot award less than 1 Simbit.')
    await this.awardUser(member, amount)
      .then(message.send(`${member} has been awarded ${amount} Simbits! Their balance is now ${shopUser.balance}`))
  }

  /**
   * Add guild member into the user table
   * @param {guildMember} memberObj - The target guild member
   */
  async makeUser (memberObj) {
    const startingBalance = 0
    await this.db.run(`INSERT INTO user (discord_id, balance) VALUES (${memberObj.id}, ${startingBalance})`)
  }

  /**
   * Add Simbits to a shop user's balance
   * @param {guildMember} memberObj - The target guild member
   * @param {integer} amount - The amount to award
   */
  async awardUser (memberObj, amount) {
    this.db.run(`UPDATE user SET balance = balance + ${amount} WHERE discord_id = ${memberObj.id}`)
  }

  /**
   * Gets the user record in user table of a guild member
   * @param {guildMember} memberObj - Target guild member
   * @returns {shopUser} - User record object from user table
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
}
