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
  }

  async init () {
    this.simbad = this.client.providers.get('simbad')
  }

  async run (message, [member, amount]) {
    if (!(await this.simbad.checkUser(member))) await this.simbad.makeUser(member)
    if (Math.floor(amount) !== amount) return message.send('Only whole numbers can be awarded.')

    const shopUser = await this.simbad.getUser(member)
    if (shopUser.balance + amount >= 2147483647) return message.send('That would exceed the maximum balance of 2147483647 Simbits.')
    if (amount <= 0) return message.send('Cannot award less than 1 Simbit.')

    await this.simbad.awardUser(member, amount)
      .then(async () => {
        message.send(`${member} has been awarded ${amount} Simbits! Their balance is now ${shopUser.balance + amount} Simbits.`)
        let shopLogChannel = await this.simbad.get('config', 'key', 'shop_channel')
        shopLogChannel = message.guild.channels.find(channel => channel.name === shopLogChannel.value)
        shopLogChannel.send(this.buildShopLogEmbed({ message, member, shopUser, amount }))
      })
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
