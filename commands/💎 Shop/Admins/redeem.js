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
      return message.send(`'${this.toTitleCase(itemName)}' was redeemed from ${member.user.username}'s inventory.`)
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
