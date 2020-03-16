/* eslint-disable no-throw-literal */
const { Command } = require('klasa')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'deduct',
      description: 'Deduct Simbits from someone.',
      permissionLevel: 9,
      usage: '<User:member> <Amount:number{1,}>',
      usageDelim: ' ',
      extendedHelp: 'Separate the user mention from the amount deducted with a space.'
    })
    this.db = this.client.providers.get('simbad')
  }

  async run (message, [member, amount]) {
    if (await this.checkUser(member) === false) await this.makeUser(member)
    if (Math.floor(amount) !== amount) return message.send('Only whole numbers can be deducted.')

    const shopUser = await this.getUser(member)
    if (amount > shopUser.balance) return message.send(`Cannot deduct more than ${member}'s balance of ${shopUser.balance} Simbits.`)
    if (amount <= 0) return message.send('Cannot deduct less than 1 Simbit.')

    await this.deductUser(member, amount)
    return message.send(`${member} had ${amount} Simbits deducted.`)
      .then(async () => {
        message.send(`${member} had ${amount} Simbits deducted. Their balance is now ${shopUser.balance - amount} Simbits.`)
        let shopLogChannel = await this.db.get('config', 'key', 'shop_channel')
        shopLogChannel = message.guild.channels.find(channel => channel.name === shopLogChannel.value)
        shopLogChannel.send(this.buildShopLogEmbed({ message, member, shopUser, amount }))
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

  buildShopLogEmbed (data) {
    const shopLogEmbed = new MessageEmbed()
      .setTitle('Deduct Simbits')
      .setDescription(`${data.message.member} deducted Simbits from ${data.member}.`)
      .setColor([255, 250, 74])
      .addField(
        'Deductee',
        data.member,
        true
      )
      .addField(
        'Award Amount',
        data.amount,
        true
      )
      .addField(
        'New Balance',
        data.shopUser.balance - data.amount,
        true
      )
      .addField(
        'Message Link',
        `[Click Here](${this.messageLinkGenerator(data.message)})`
      )
    return shopLogEmbed
  }

  messageLinkGenerator (message) {
    return `https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
  }
}
