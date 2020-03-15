/* eslint-disable no-throw-literal */
const { Command } = require('klasa')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'redeem',
      description: 'Redeem an item from a user\'s inventory.',
      permissionLevel: 9,
      usage: '<User:member> [Item_Name:...string]',
      usageDelim: ' ',
      extendedHelp: 'Separate the user mention from the item name with a space. Any subsequent spaces after that first space is included in the item name. Notice that the Item_Name argument is only optional.'
    })
    this.db = this.client.providers.get('mysql')
  }

  async run (message, [member, itemName]) {
    if (await this.checkUser(member) === false) await this.makeUser(member)

    if (itemName === undefined) {
      return message.send(await this.buildInventoryEmbed(member))
    }

    itemName = itemName.toLowerCase()
    if (!(await this.redeemItem(member, itemName))) {
      message.send(`'${this.toTitleCase(itemName)}' wasn't in their inventory. Here is their inventory:`)
      return message.send(await this.buildInventoryEmbed(member))
    } else {
      message.send(`'${this.toTitleCase(itemName)}' was redeemed from ${member.user.username}'s inventory.`)
      let shopLogChannel = await this.db.get('config', 'key', 'shop_channel')
      shopLogChannel = message.guild.channels.find(channel => channel.name === shopLogChannel.value)
      shopLogChannel.send(await this.buildShopLogEmbed({ message, member, itemName }))
    }
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

  /**
   * Gets the shop user from the user table based on discord_id
   * @param {guildMember} memberObj - The target guild member
   */
  async getUser (memberObj) {
    return this.db.get('user', 'discord_id', memberObj.id)
  }

  /**
   * Gets a record from the item table
   * @param {string} itemName
   */
  async getItem (itemName) {
    return this.db.get('item', 'name', itemName)
  }

  /**
   * Removes a record from the transaction table
   * @param {guildMember} memberObj - The target guild member
   * @param {string} itemName - The name of the item
   * @returns {boolean} - Whether removing the record from the table successful (true) or not (false)
   */
  async redeemItem (memberObj, itemName) {
    const item = await this.getItem(itemName)

    if (item === null) {
      return false
    }

    const targetTransaction = await this.db.run(
      `SELECT transaction.id, transaction.item_id
      FROM user INNER JOIN transaction
      ON transaction.user_id = user.id
      WHERE user.discord_id = ${memberObj.id}
      AND transaction.item_id = ${item.id}`
    )
    if (targetTransaction === undefined) return false
    await this.db.run(`DELETE FROM transaction WHERE id = ${targetTransaction.id}`)
    return true
  }

  /**
   * Builds the message embed that list target guild member's inventory
   * @param {guildMember} memberObj - The target guild member
   * @returns {messageEmbed}
   */
  async buildInventoryEmbed (memberObj) {
    const prefix = this.client.options.prefix
    const inventory = await this.db.runAll(`SELECT DISTINCT transaction.item_id, item.name, COUNT(*) as count 
    FROM user INNER JOIN transaction
    ON transaction.user_id = user.id
    INNER JOIN item
    ON transaction.item_id = item.id
    WHERE user.discord_id = ${memberObj.id}
    GROUP BY transaction.item_id`)

    const inventoryEmbed = new MessageEmbed()
      .setAuthor(`${memberObj.user.tag} ${(memberObj.nickname) ? `(${memberObj.nickname})` : ''}`, memberObj.user.displayAvatarURL())
      .setDescription(`This is ${memberObj.user.username}'s inventory.`)
      .setFooter('Pssst! I wrote out the command to redeem each item so you can just copy and paste it!')

    if (inventory.length === 0) {
      inventoryEmbed.setDescription('The user has an empty inventory.')
    } else {
      inventory.forEach(item => {
        inventoryEmbed.addField(
          `**${this.toTitleCase(item.name)}** (${item.count}x)`,
          `\`\`\`${prefix}redeem ${memberObj} ${item.name}\`\`\``,
          false
        )
      })
    }
    return inventoryEmbed
  }

  async stringifyInventory (shopUser) {
    const length = await this.db.run(`SELECT COUNT(*) FROM transaction WHERE user_id = ${shopUser.id}`)
    if (length['COUNT(*)'] === 0) {
      return 'None.'
    }
    const inventory = await this.db.runAll(`SELECT item.name, COUNT(transaction.item_id) AS count FROM transaction INNER JOIN user ON transaction.user_id = user.id INNER JOIN item ON transaction.item_id = item.id WHERE user.discord_id = '${shopUser.discord_id}' GROUP BY transaction.item_id`)
    return inventory.map(item => `${this.toTitleCase(item.name)} (${item.count}x)`)
  }

  async buildShopLogEmbed (data) {
    const shopLogEmbed = new MessageEmbed()
      .setTitle('Item Redeem')
      .setDescription(`${data.message.member} redeemed an item for ${data.member}.`)
      .setColor([74, 141, 255])
      .addField(
        'Customer',
        data.member,
        true
      )
      .addField(
        'Redeemed Item',
        data.itemName,
        true
      )
      .addField(
        'New Inventory',
        await this.stringifyInventory(await this.getUser(data.member)),
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

  /**
   * Converts a string to title casing
   * @param {string} string - The string to title-case
   * @returns {string}
   */
  toTitleCase (string) {
    return string.replace(
      /\w\S*/g,
      function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      }
    )
  }
}
