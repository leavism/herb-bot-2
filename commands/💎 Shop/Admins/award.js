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
    await this.awardUser(member, amount)
    return message.send(`${member} has been awarded ${amount} Simbits!`)
  }

  async makeUser (memberObj) {
    const startingBalance = 0
    await this.db.run(`INSERT INTO user (discord_id, balance) VALUES (${memberObj.id}, ${startingBalance})`)
  }

  async awardUser (memberObj, amount) {
    return this.db.run(`UPDATE user SET balance = balance + ${amount} WHERE discord_id = ${memberObj.id}`)
  }

  async checkUser (memberObj) {
    const result = await this.db.get('user', 'discord_id', memberObj.id)
    if (result == null) {
      return false
    }
    return true
  }
}
