const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');
const shop = require('../../data/data.json');
const fs = require("fs");

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      subcommands: true,
      description: 'Take a look at the Simbit Shop!',
      usage: '<bank|list|buy|help:default> [item:...string]',
      usageDelim: ' '
    });
  }

  async bank(message, params) {
    if (this.checkUser(message.author) == false) this.makeUser(message.author)
    let shopUser = this.getUser(message.author)
    const userEmbed = new MessageEmbed()
      .setTitle(`${message.author.username}'s Shop Profile`)
      .setThumbnail(message.author.avatarURL())
      .setDescription('This is your Simbit Shop profile! Look at what you own and your Simbit balance.')
      .addField(
        'Balanace',
        shopUser.balance,
        true
      )
      .addField(
        'Inventory',
        this.stringifyInventory(shopUser),
        true
      )
    return message.send(userEmbed)
  }
  async list(message, params) {
    if (this.checkUser(message.author) == false) this.makeUser(message.author)
    return message.send(this.buildShopEmbed())
  }
  async buy(message, [item]) {
    if (this.checkUser(message.author) == false) this.makeUser(message.author)
    let targetItem = this.getItem(item);
    let user = this.getUser(message.author);

    return message.send(this.buyItem(user, targetItem))
  }

  async help(message, params) {
    if (this.checkUser(message.author) == false) this.makeUser(message.author)
    return message.send(this.buildHelpEmbed())
  }

  async makeUser(memberObj){
    shop["users"].push(
        {
            "id": memberObj.id.toString(),
            "name": memberObj.username,
            "balance": 0,
            "inventory" : []
        }
    )
    return await this.saveShop()
  }

  getUser(memberObj) {
    try {
      return shop.users.find(user => user.id === memberObj.id)
    } catch (TypeError) {
      return null;
    }
  }

  checkUser(memberObj) {
    if (this.getUser(memberObj) == null) {
      return false;
    }
    return true;
  }

  getItem(itemName) {
    return shop.store.find(item => item.item.toLowerCase() === itemName.toLowerCase());
  }

  buyItem(userObj, itemObj) {
    if (userObj.balance < itemObj.cost) { return 'You don\'t have enough Simbits!' }
    else if (itemObj.stock == 0) { return `The shop is out of stock of ${itemObj.item}` }
    else {
      this.addToInventory(userObj, itemObj);
      this.saveShop()
      return `${itemObj.item} has been added to your inventory!`
    }
  }

  addToInventory(userObj, itemObj) {
    let inventoryItemObj = userObj.inventory.find(inventoryItem => 
      inventoryItem.item == itemObj.item
    )
    
    if (inventoryItemObj == undefined) {
      itemObj.stock -= 1;
      userObj.balance -= itemObj.cost;
      userObj.inventory.push({
        item: itemObj.item,
        quantity: 1
      })
    } else {
      itemObj.stock -= 1;
      userObj.balance -= itemObj.cost
      inventoryItemObj.quantity += 1;
    }
  }

  stringifyInventory(shopUserObj) {
    if (shopUserObj.inventory.length == 0) {
      return 'None.';
    }
    let inventory = shopUserObj.inventory.map(item => `${item.item} (${item.quantity}x)`).join('\n')
    return inventory;
  }

  async saveShop() {
    return await fs.writeFile("./data/data.json", JSON.stringify(shop), (err) => console.log(err));
  }

  buildHelpEmbed() {
    let prefix = this.client.options.prefix;
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
    return helpEmbed;
  }

  buildShopEmbed() {
    let prefix = this.client.options.prefix;
    const shopEmbed = new MessageEmbed()
      .setTitle('🛒 Simbit Shop')
      .setFooter('Pssst! I wrote out the command to buy each item so you can just copy and paste it!')
    shop.store.forEach(item => {
      let stock = (item.stock == -1) ? '' : ` There are ${item.stock} ${item.item}(s) remaining.`;
      shopEmbed.addField(
        `**${item.item}** (${item.cost} Simbits)`,
        `${item.description}${stock}\n\`\`\`${prefix}shop buy ${item.item}\`\`\``,
        false
      )
    })
    return shopEmbed
  }
};