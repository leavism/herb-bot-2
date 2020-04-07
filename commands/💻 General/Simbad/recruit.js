const { Command } = require('klasa')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'recruit',
      aliases: ['rec'],
      runIn: ['text'],
      description: 'Give someone the Recruit role!',
      usage: '<Mention:member>',
      permissionLevel: 5,
      extendedHelp: 'Don\'t forget to mention the user.'
    })
    this.db = this.client.providers.get('simbad')
  }

  async run (message, [member]) {
    const recruit = message.guild.roles.find(role => role.name === 'Recruit')
    const elite = message.guild.roles.find(role => role.name === 'Elite')
    const simbian = message.guild.roles.find(role => role.name === 'Simbian')
    if (!recruit) return message.send('The Guest role doesn\'t exist.')
    if (!elite) return message.send('The Guest role doesn\'t exist.')
    if (!simbian) return message.send('The Guest role doesn\'t exist.')

    const recruitRoles = [recruit, elite, simbian]
    const currentRoles = member.roles.map(role => role)
    const alreadySimbian = currentRoles.filter(cRole => recruitRoles.includes(cRole))

    if (alreadySimbian.length !== 0) return message.send('They\'re already Simbian.')
    if (!member.manageable) return message.send('They have a higher permission than me!')

    member.roles.add([recruit, elite, simbian], `${message.member.user.tag} called the recruit command on ${member.user.tag}`)
      .then(async () => {
        message.send(`${member.user.username} has been recruited!`)
        let generalChannel = await this.db.get('config', 'key', 'general_channel')
        generalChannel = message.guild.channels.find(channel => channel.name === generalChannel.value)
        generalChannel.send(`You're now a member of Simbad, ${member}! This grants access to our text and voice channels, so feel free to get to know everyone. You've also been given the Recruit role, which indiciates you're a newer member. Once you've grown into our community, you can lose the Recruit role and celebrate with dank memes. Our group's home system is Farowalan - Bamford City, come on down! Everyone, say hello!`)
      })
  }
}
