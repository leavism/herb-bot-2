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
  }

  async init () {
    this.simbad = this.client.providers.get('simbad')
  }

  async bank (message, params) {
    if (!(await this.simbad.checkUser(message.author))) await this.simbad.makeUser(message.author)
    const shopUser = await this.simbad.getUser(message.author)
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
    if (!(await this.simbad.checkUser(message.author))) await this.simbad.makeUser(message.author)
    return message.send(await this.buildShopEmbed())
  }

  async buy (message, [itemName]) {
    if (!(await this.simbad.checkUser(message.author))) await this.simbad.makeUser(message.author)
    if (!itemName) {
      message.send('Please specify what item you\'re trying to buy.')
      return message.send(await this.buildShopEmbed())
    }
    const shopUser = await this.simbad.getUser(message.author)
    const shopItem = await this.simbad.getShopItem(itemName)
    if (shopItem == null) {
      message.send('That item isn\'t in the shop.')
      return message.send(await this.buildShopEmbed())
    } else if (shopItem.stock === 0) {
      message.send(`The shop is out of stock of ${shopItem.name}.`)
      return message.send(await this.buildShopEmbed())
    } else if (shopUser.balance < shopItem.price) {
      message.send('You don\'t have enough Simbits!')
      return this.bank(message)
    }

    message.send(await this.buyItem(message.author, itemName.toLowerCase()))
    let shopLogChannel = await this.simbad.get('config', 'key', 'shop_channel')
    shopLogChannel = message.guild.channels.find(channel => channel.name === shopLogChannel.value)
    shopLogChannel.send(await this.buildShopLogEmbed({ message, itemName, shopUser }))
  }

  async buildShopLogEmbed (data) {
    const shopLogEmbed = new MessageEmbed()
      .setTitle('Item Purchase')
      .setDescription(`${data.message.member} purchased an item.`)
      .setColor([74, 141, 255])
      .addField(
        'Customer',
        data.message.member,
        true
      )
      .addField(
        'Purchased Item',
        data.itemName,
        true
      )
      .addField(
        'New Inventory',
        await this.stringifyInventory(data.shopUser),
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

  async help (message, params) {
    if (!(await this.simbad.checkUser(message.author))) await this.simbad.makeUser(message.author)
    return message.send(this.buildHelpEmbed())
  }

  /**
   * Updates user balance, transaction record, and shop stock for the buying process
   * @param {*} memberObj Target Discord guildMember
   * @param {*} itemName Target item name
   * @returns {string} of the success
   */
  async buyItem (memberObj, itemName) {
    const shopUser = await this.simbad.getUser(memberObj)
    const shopItem = await this.simbad.getShopItem(itemName)
    Promise.all([
      await this.simbad.run(`UPDATE user SET balance = ${shopUser.balance - shopItem.price} WHERE discord_id = ${memberObj.id};`),
      await this.simbad.run(`UPDATE shop SET stock = ${shopItem.stock - 1} WHERE item_id = ${shopItem.id};`),
      await this.simbad.run(`INSERT INTO transaction (item_id, user_id) VALUES (${shopItem.id}, ${shopUser.id})`)
    ])
      .catch((error) => console.log(error))
    return `${this.toTitleCase(shopItem.name)} has been added to your inventory!`
  }

  /**
   * Converts a string to title casing
   * @param {string} string The string to title-case
   * @returns {string}
   * @private
   */
  toTitleCase (string) {
    return string.replace(
      /\w\S*/g,
      function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      }
    )
  }

  /**
   * @param {Object} [shopUser] The user object from database
   * @returns {array} An array of stringified items in the user's inventory
   * @private
   */
  async stringifyInventory (shopUser) {
    const length = await this.simbad.run(`SELECT COUNT(*) FROM transaction WHERE user_id = ${shopUser.id}`)
    if (length['COUNT(*)'] === 0) {
      return 'None.'
    }
    const inventory = await this.simbad.runAll(`SELECT item.name, COUNT(transaction.item_id) AS count FROM transaction INNER JOIN user ON transaction.user_id = user.id INNER JOIN item ON transaction.item_id = item.id WHERE user.discord_id = '${shopUser.discord_id}' GROUP BY transaction.item_id`)
    return inventory.map(item => `${this.toTitleCase(item.name)} (${item.count}x)`)
  }

  /**
   * Builds the default display when using the shop command
   * @returns {MessageEmbed}
   * @private
   */
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

  /**
   * Builds the MessageEmbed displaying items for sale in the shop
   * @returns {MessageEmbed}
   * @private
   */
  async buildShopEmbed () {
    const prefix = this.client.options.prefix
    const shop = await this.simbad.runAll('SELECT i.name, i.description, s.stock, s.price FROM item as i INNER JOIN shop as s ON i.id = s.item_id;')
    const shopEmbed = new MessageEmbed()
      .setTitle('🛒 Simbit Shop')
      .setFooter('Pssst! I wrote out the command to buy each item so you can just copy and paste it!')
    shop.forEach(item => {
      const stock = (item.stock === -1) ? '' : ` There are ${item.stock} ${item.name}(s) remaining.`
      shopEmbed.addField(
        `**${this.toTitleCase(item.name)}** (${item.price} Simbits)`,
        `${item.description}${stock}\n\`\`\`${prefix}shop buy ${item.name}\`\`\``,
        false
      )
    })
    return shopEmbed
  }

  async asyncForEach (array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }
}
