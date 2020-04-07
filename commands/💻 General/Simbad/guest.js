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
    this.db = this.client.providers.get('simbad')
  }

  async run (message, [member]) {
    const guest = message.guild.roles.find(role => role.name === 'Guest')
    if (!guest) return message.send('The Guest role doesn\'t exist.')
    const alreadySimbian = member.roles.array().filter(role => role === guest)

    if (alreadySimbian.length !== 0) return message.send('They\'re already a Guest.')

    member.roles.add(guest, `${message.member.user.tag} called the guest command on ${member.user.tag}`)
      .then(message.send(`I've given ${member} the Guest role.`))
  }
}
