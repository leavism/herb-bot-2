const { Monitor } = require('klasa')
const { remove } = require('confusables')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Monitor {
  constructor (...args) {
    super(...args, {
      name: 'profanityAlert',
      enabled: true,
      ignoreSelf: true,
      ignoreBots: true,
      ignoreOthers: false,
      ignoreEdits: false
    })
    this.managerial = ['ADMINISTRATOR', 'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS']
  }

  async init () {
    this.simbad = this.client.providers.get('simbad')
  }

  async run (message) {
    if (!message.guild) return
    if (!message.content || !message.content.length) return
    if (message.member.permissions.toArray().some(permission => this.managerial.includes(permission))) return

    var modChannel = await this.simbad.get('config', 'key', 'mod_channel')
    const cleanContent = this.sanitize(message.content)
    const filteredWords = await this.simbad.getAll('banned_words')
      .then(table => table.map(word => word.word))

    if (!filteredWords || !filteredWords.length) return

    const checker = this.filter(filteredWords, this.sanitize(cleanContent))
    if (checker.state) {
      modChannel = message.guild.channels.find(channel => channel.name === modChannel.value)
      modChannel.send(this.buildModAlertEmbed(message, checker))
    }
  }

  sanitize (str) {
    return remove(str).toLowerCase()
  }

  filter (filteredWords, content) {
    const found = filteredWords.find((word) => {
      const regex = new RegExp(`${this.sanitize(word)}\\b`, 'gi')
      if (content.match(regex)) return word
    })
    const regex = new RegExp(`${found}\\b`, 'gi')
    if (found) {
      return {
        state: true,
        word: found,
        regex: regex,
        index: content.search(regex)
      }
    }
    return { state: false }
  }

  buildModAlertEmbed (message, checker) {
    const alertEmbed = new MessageEmbed()
      .setTitle('Possible Profanity Alert')
      .setDescription(message.createdAt)
      .setColor([255, 73, 74])
      .addField(
        'Message',
        (message.content.length <= 200) ? `${message.content}`.replace(checker.regex, `__**${checker.word}**__`) : this.cutString(message.content, checker.index).replace(checker.word, `__**${checker.word}**__`),
        false
      )
      .addField(
        'Author',
        message.member,
        true
      )
      .addField(
        'Channel',
        message.channel,
        true
      )
      .addField(
        'Word',
        checker.word,
        true
      )
      .addField(
        'Message Link',
        `[Click Here](${this.messageLinkGenerator(message)})`
      )
      .setFooter('This alert does not take into account the context of the message. Please read the conversation before making any decisions.')
    return alertEmbed
  }

  messageLinkGenerator (message) {
    return `https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
  }

  cutString (string, index) {
    return `...${string.substring(index - 50, index)}${string.substring(index, index + 50)}...`
  }
}
