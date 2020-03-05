const { Event } = require('klasa')
const { MessageEmbed } = require('discord.js')

module.exports = class extends Event {
  constructor (...args) {
    super(...args, {
      enabled: true,
      event: 'message'
    })
    this.db = this.client.providers.get('mysql')
  }

  async run (message) {
    if (this.client.ready) this.client.monitors.run(message)
    if (message.author.bot) return

    let modChannel = await this.db.get('config', 'key', 'mod_channel')
    const bannedWords = await this.db.getAll('banned_words')
      .then(table => table.map(word => word.word))
    const checker = this.profanityChecker(bannedWords, message.content)
    if (checker.state) {
      modChannel = message.guild.channels.find(channel => channel.name === modChannel.value)
      modChannel.send(this.buildModAlertEmbed(message, checker))
    }
  }

  buildModAlertEmbed (message, checker) {
    const alertEmbed = new MessageEmbed()
      .setTitle('Profanity Alert')
      .setDescription(message.createdAt)
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

  profanityChecker (profanityArray, string) {
    string = string.toLowerCase()
    for (let i = 0; i < profanityArray.length; i++) {
      if (string.includes(profanityArray[i])) {
        return { state: true, word: profanityArray[i], index: string.indexOf(profanityArray[i]) }
      }
    }
    return { state: false }
  }
}
