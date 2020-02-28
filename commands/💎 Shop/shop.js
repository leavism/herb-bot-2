/* eslint-disable no-throw-literal */
const { Command } = require('klasa')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      subcommands: true,
      description: 'Take a look at the Simbit Shop!',
      usage: '<bank|list|buy|help:default> [item:...string]',
      usageDelim: ' '
    })
    this.db = this.client.providers.get('mysql')
  }

  async bank (message, params) {
    if (this.checkUser(message.author) === false) this.makeUser(message.author)
    const shopUser = await this.getUser(message.author)
    const userEmbed = new MessageEmbed()
      .setTitle(`${message.author.username}'s Shop Profile`)
      .setThumbnail(message.author.avatarURL())
      .setDescription('This is your Simbit Shop profile! Look at what you own and your Simbit balance.')
      .addField(
        'Balance',
        shopUser.balance,
        true
      )
      .addField(
        'Inventory',
        await this.stringifyInventory(shopUser),
        true
      )
    return message.send(userEmbed)
  }

  async list (message, params) {
    if (await this.checkUser(message.author) === false) await this.makeUser(message.author)
    return message.send(await this.buildShopEmbed())
  }

  async buy (message, [itemName]) {
    if (this.checkUser(message.author) === false) this.makeUser(message.author)
    if (itemName == null) {
      throw 'Please specify what item you\'re trying to buy.'
    }

    return message.send(await this.buyItem(message.author, itemName.toLowerCase()))
  }

  async help (message, params) {
    if (this.checkUser(message.author) === false) this.makeUser(message.author)
    return message.send(this.buildHelpEmbed())
  }

  async makeUser (memberObj) {
    const id = await this.db.countRows('user')
    const startingBalance = 0
    await this.db.run(`INSERT INTO user (id, discord_id, balance) VALUES (${id + 1}, ${memberObj.id}, ${startingBalance})`)
  }

  async getUser (memberObj) {
    return this.db.get('user', 'discord_id', memberObj.id)
  }

  async checkUser (memberObj) {
    const result = await this.db.get('user', 'discord_id', memberObj.id)
    if (result == null) {
      return false
    }
    return true
  }

  async getItem (itemName) {
    return this.db.run(`SELECT * FROM item INNER JOIN shop ON item.id = shop.item_id WHERE item.name = '${itemName.toLowerCase()}'`)
  }

  async buyItem (memberObj, itemName) {
    const shopUser = await this.getUser(memberObj)
    const shopItem = await this.getItem(itemName)
    if (shopUser.balance < shopItem.price) {
      return 'You don\'t have enough Simbits!'
    } else if (shopItem.stock === 0) {
      return `The shop is out of stock of ${shopItem.name}.`
    } else {
      const id = await this.db.countRows('transaction')
      await this.db.run(`UPDATE user SET balance = ${shopUser.balance - shopItem.price} WHERE discord_id = ${memberObj.id};`)
      await this.db.run(`UPDATE shop SET stock = ${shopItem.stock - 1} WHERE item_id = ${shopItem.id};`)
      await this.db.run(`INSERT INTO transaction (id, item_id, user_id) VALUES (${id + 1}, ${shopItem.id}, ${shopUser.id})`)
      return `${this.toTitleCase(shopItem.name)} has been added to your inventory!`
    }
  }

  toTitleCase (str) {
    return str.replace(
      /\w\S*/g,
      function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      }
    )
  }

  async stringifyInventory (shopUser) {
    const length = await this.db.run(`SELECT COUNT(*) FROM transaction WHERE user_id = ${shopUser.id}`)
    if (length['COUNT(*)'] === 0) {
      return 'None.'
    }
    const inventory = await this.db.runAll('SELECT name, COUNT(*) as count FROM transaction INNER JOIN item ON transaction.item_id = item.id GROUP BY name;')
    return inventory.map(item => `${this.toTitleCase(item.name)} (${item.count}x)`)
  }

  getOccurrence (array, value) {
    return array.filter((v) => (v.name === value)).length
  }

  buildHelpEmbed () {
    const prefix = this.client.options.prefix
    const helpEmbed = new MessageEmbed()
      .setTitle('🛍 Welcome to the Simbit Shop!')
      .setDescription(`Howdy there! Did you earn some Simbits? Well come here and spend it on our goods. Below are the \`${prefix}shop\` subcommands.`)
      .addField(
        'Show Shop Items',
        `\`\`\`${prefix}shop list\`\`\``,
        true
      )
      .addField(
        'Show Shop Profile',
        `\`\`\`${prefix}shop bank\`\`\``,
        true
      )
      .addField(
        'Buy Shop Item',
        `\`\`\`${prefix}shop buy <item>\`\`\``,
        true
      )
      .setFooter('After a purchase, please contact an Admin to redeem your item! Or save it to redeem later.')
    return helpEmbed
  }

  async buildShopEmbed () {
    const prefix = this.client.options.prefix
    const shop = await this.db.runAll('SELECT i.name, i.description, s.stock, s.price FROM item as i INNER JOIN shop as s ON i.id = s.item_id;')
    const shopEmbed = new MessageEmbed()
      .setTitle('🛒 Simbit Shop')
      .setFooter('Pssst! I wrote out the command to buy each item so you can just copy and paste it!')
    shop.forEach(item => {
      const stock = (item.stock === -1) ? '' : ` There are ${item.stock} ${item.name}(s) remaining.`
      shopEmbed.addField(
        `**${item.name}** (${item.price} Simbits)`,
        `${item.description}${stock}\n\`\`\`${prefix}shop buy ${item.name}\`\`\``,
        false
      )
    })
    return shopEmbed
  }
}
