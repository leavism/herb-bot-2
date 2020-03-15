/* eslint-disable no-throw-literal */
const { Command } = require('klasa')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'award',
      description: 'Award someone Simbits.',
      permissionLevel: 9,
      usage: '<User:member> <Amount:number{1,2147483647}>',
      usageDelim: ' ',
      extendedHelp: 'Separate the user mention from the amount awarded with a space.'
    })
    this.db = this.client.providers.get('mysql')
  }

  async run (message, [member, amount]) {
    if (await this.checkUser(member) === false) await this.makeUser(member)
    if (Math.floor(amount) !== amount) return message.send('Only whole numbers can be awarded.')

    const shopUser = await this.getUser(member)
    if (shopUser.balance + amount >= 2147483647) return message.send('That would exceed the maximum balance of 2147483647 Simbits.')
    if (amount <= 0) return message.send('Cannot award less than 1 Simbit.')

    await this.awardUser(member, amount)
      .then(async () => {
        message.send(`${member} has been awarded ${amount} Simbits! Their balance is now ${shopUser.balance + amount} Simbits.`)
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

  buildShopLogEmbed (data) {
    const shopLogEmbed = new MessageEmbed()
      .setTitle('Award Simbits')
      .setDescription(`${data.message.member} awarded ${data.member} Simbits.`)
      .setColor([74, 255, 141])
      .addField(
        'Receiver',
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
        data.shopUser.balance + data.amount,
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
