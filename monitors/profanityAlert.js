const { Monitor } = require('klasa')
const { remove } = require('confusables')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Monitor {
  constructor (...args) {
    super(...args, {
      name: 'profanityAlert',
      enabled: true,
      ignoreOthers: false
    })
  }

  async init () {
    this.db = this.client.providers.get('mysql')
  }

  async run (message) {
    if (!message.guild) return
    if (!message.content || !message.content.length) return

    var modChannel = await this.db.get('config', 'key', 'mod_channel')
    const cleanContent = this.sanitize(message.content)
    const filteredWords = await this.db.getAll('banned_words')
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
    const found = filteredWords.find(word => content.includes(this.sanitize(word)))
    if (found) {
      return {
        state: true,
        word: found,
        index: content.indexOf(found)
      }
    }
    return { state: false }
  }

  buildModAlertEmbed (message, checker) {
    const alertEmbed = new MessageEmbed()
      .setTitle('Profanity Alert')
      .setDescription(message.createdAt)
      .setColor([255, 73, 74])
      .addField(
        'Message',
        (message.content.length <= 200) ? `${message.content}`.replace(checker.word, `__**${checker.word}**__`) : this.cutString(message.content, checker.index).replace(checker.word, `__**${checker.word}**__`),
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
        'Profanity',
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
