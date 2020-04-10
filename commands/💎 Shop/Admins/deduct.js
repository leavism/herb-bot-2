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
  }

  async init () {
    this.simbad = this.client.providers.get('simbad')
  }

  async run (message, [member, amount]) {
    if (!(await this.simbad.checkUser(member))) await this.simbad.makeUser(member)
    if (Math.floor(amount) !== amount) return message.send('Only whole numbers can be deducted.')

    const shopUser = await this.simbad.getUser(member)
    if (amount > shopUser.balance) return message.send(`Cannot deduct more than ${member}'s balance of ${shopUser.balance} Simbits.`)
    if (amount <= 0) return message.send('Cannot deduct less than 1 Simbit.')

    await this.simbad.deductUser(member, amount)
    return message.send(`${member} had ${amount} Simbits deducted.`)
      .then(async () => {
        message.send(`${member} had ${amount} Simbits deducted. Their balance is now ${shopUser.balance - amount} Simbits.`)
        let shopLogChannel = await this.simbad.get('config', 'key', 'shop_channel')
        shopLogChannel = message.guild.channels.find(channel => channel.name === shopLogChannel.value)
        shopLogChannel.send(this.buildShopLogEmbed({ message, member, shopUser, amount }))
      })
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
