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
  }

  async init () {
    this.simbad = this.client.providers.get('simbad')
  }

  async run (message, [member]) {
    const elite = message.guild.roles.find(role => role.name === 'Elite')
    const simbian = message.guild.roles.find(role => role.name === 'Simbian')
    if (!elite) return message.send('The elite role doesn\'t exist.')
    if (!simbian) return message.send('The simbian role doesn\'t exist.')

    const recruitRoles = [elite, simbian]
    const currentRoles = member.roles.map(role => role)
    const alreadySimbian = currentRoles.filter(cRole => recruitRoles.includes(cRole))

    if (alreadySimbian.length !== 0) return message.send('They\'re already Simbian.')

    member.roles.add([elite, simbian], `${message.member.user.tag} called the recruit command on ${member.user.tag}`)
      .then(async () => {
        let generalChannel = await this.simbad.get('config', 'key', 'general_channel')
        generalChannel = message.guild.channels.find(channel => channel.name === generalChannel.value)
        const botChannel = message.guild.channels.find(channel => channel.name === 'bot-chat')

        message.send(`Great work! Our new Simbian has been welcomed in ${generalChannel}`)
        generalChannel.send(`You're now a member of Simbad, ${member}! You can now access out text and voice channels, so feel free to look around. Our group's home system is Farowalan - Bamford City, come on down!\n\nSome things to do next:\n- Look at pinned posts in any channel you're interested in\n- Try the bot in ${botChannel} by typing \`?help\` or \`?shop\`\n- Say hello to everyone here!\n\n`)
      })
  }
}
