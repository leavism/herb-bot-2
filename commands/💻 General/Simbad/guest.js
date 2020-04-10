const { Command } = require('klasa')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'guest',
      runIn: ['text'],
      description: 'Give someone the Guest role.',
      usage: '<Mention:member>',
      permissionLevel: 5,
      extendedHelp: 'Don\'t forget to mention the user.'
    })
  }

  async init () {
    this.simbad = this.client.providers.get('simbad')
  }

  async run (message, [member]) {
    const guest = message.guild.roles.find(role => role.name === 'Guest')
    if (!guest) return message.send('The Guest role doesn\'t exist.')
    const alreadySimbian = member.roles.array().filter(role => role === guest)

    if (alreadySimbian.length !== 0) return message.send('They\'re already a Guest.')

    member.roles.add(guest, `${message.member.user.tag} called the guest command on ${member.user.tag}`)
      .then(async () => {
        let generalChannel = await this.simbad.get('config', 'key', 'general_channel')
        message.send(`Great work! Our new guest has been welcomed in ${generalChannel.name}!`)
        generalChannel = message.guild.channels.find(channel => channel.name === generalChannel.value)
        generalChannel.send(`You're now a guest of Simbad, ${member}! This grants access to some of our text and voice channels, so feel free to hang out and get to know everyone. You can always request to become a full member at any time by contacting any of our leadership team! Everyone, say hello!`)
      })
  }
}
