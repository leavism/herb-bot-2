/* eslint-disable no-throw-literal */
const { Command } = require('klasa')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'deduct',
      description: 'Deduct Simbits from someone.',
      usage: '<User:member> <Amount:integer>',
      usageDelim: ' ',
      extendedHelp: 'Separate the user mention from the amount deducted with a space.'
    })
    this.db = this.client.providers.get('mysql')
  }

  async run (message, [member, amount]) {
    if (await this.checkUser(member) === false) await this.makeUser(member)
    await this.deductUser(member, amount)
    return message.send(`${member} had ${amount} Simbits deducted.`)
  }

  async makeUser (memberObj) {
    const startingBalance = 0
    await this.db.run(`INSERT INTO user (discord_id, balance) VALUES (${memberObj.id}, ${startingBalance})`)
  }

  async deductUser (memberObj, amount) {
    const shopUser = await this.db.get('user', 'discord_id', memberObj.id)
    if (amount > shopUser.balance) {
      throw `Cannot deduct more than ${memberObj}'s balance of ${shopUser.balance}`
    }
    return this.db.run(`UPDATE user SET balance = balance - ${amount} WHERE discord_id = ${memberObj.id}`)
  }

  async checkUser (memberObj) {
    const result = await this.db.get('user', 'discord_id', memberObj.id)
    if (result == null) {
      return false
    }
    return true
  }
}
