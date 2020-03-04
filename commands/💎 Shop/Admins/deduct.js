/* eslint-disable no-throw-literal */
const { Command } = require('klasa')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'deduct',
      description: 'Deduct Simbits from someone.',
      permissionLevel: 9,
      usage: '<User:member> <Amount:integer>',
      usageDelim: ' ',
      extendedHelp: 'Separate the user mention from the amount deducted with a space.'
    })
    this.db = this.client.providers.get('mysql')
  }

  async run (message, [member, amount]) {
    if (await this.checkUser(member) === false) await this.makeUser(member)
    const shopUser = await this.getUser(member)
    if (amount > shopUser.balance) return message.send(`Cannot deduct more than ${member}'s balance of ${shopUser.balance}`)
    if (amount <= 0) return message.send('Cannot deduct less than 1 Simbit.')
    await this.deductUser(member, amount)
    return message.send(`${member} had ${amount} Simbits deducted.`)
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
   * Gets the user record in user table of a guild member
   * @param {guildMember} memberObj - Target guild member
   * @returns {shopUser} - User record object from user table
   */
  async getUser (memberObj) {
    return this.db.get('user', 'discord_id', memberObj.id)
  }

  /**
   * Deduct an amount of Simbits from a shop user
   * @param {guildMember} memberObj - The target guild member
   * @param {integer} amount - The amount to deduct from shop user
   */
  async deductUser (memberObj, amount) {
    return this.db.run(`UPDATE user SET balance = balance - ${amount} WHERE discord_id = ${memberObj.id}`)
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
