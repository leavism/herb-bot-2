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
  }

  async init () {
    this.simbad = this.client.providers.get('simbad')
  }

  async run (message, [member, itemName]) {
    if (!(await this.simbad.checkUser(member))) await this.simbad.makeUser(member)
    if (!itemName) { return message.send(await this.buildInventoryEmbed(member)) }

    itemName = itemName.toLowerCase()
    const redeemed = await this.simbad.redeemItem(member, itemName)
    if (!redeemed) {
      message.send(`'${this.toTitleCase(itemName)}' wasn't in their inventory. Here is their inventory:`)
      return message.send(await this.buildInventoryEmbed(member))
    } else {
      message.send(`'${this.toTitleCase(itemName)}' was redeemed from ${member.user.username}'s inventory.`)
      let shopLogChannel = await this.simbad.get('config', 'key', 'shop_channel')
      shopLogChannel = message.guild.channels.find(channel => channel.name === shopLogChannel.value)
      shopLogChannel.send(await this.buildShopLogEmbed({ message, member, itemName }))
    }
  }

  /**
   * Builds the message embed that list target guild member's inventory
   * @param {guildMember} memberObj - The target guild member
   * @returns {messageEmbed}
   */
  async buildInventoryEmbed (memberObj) {
    const prefix = this.client.options.prefix
    const inventory = await this.simbad.runAll(`SELECT DISTINCT transaction.item_id, item.name, COUNT(*) as count 
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
    const length = await this.simbad.run(`SELECT COUNT(*) FROM transaction WHERE user_id = ${shopUser.id}`)
    if (length['COUNT(*)'] === 0) {
      return 'None.'
    }
    const inventory = await this.simbad.runAll(`SELECT item.name, COUNT(transaction.item_id) AS count FROM transaction INNER JOIN user ON transaction.user_id = user.id INNER JOIN item ON transaction.item_id = item.id WHERE user.discord_id = '${shopUser.discord_id}' GROUP BY transaction.item_id`)
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
        await this.stringifyInventory(await this.simbad.getUser(data.member)),
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
