const { Command } = require('klasa')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'recruit',
      aliases: ['rec'],
      runIn: ['text'],
      description: 'Give someone the Recruit role!',
      usage: '<Mention:member>',
      extendedHelp: 'Don\'t forget to mention the use.'
    })
  }

  async run (message, [member]) {
    const recruit = message.guild.roles.find(role => role.name === 'Recruit')
    const elite = message.guild.roles.find(role => role.name === 'Elite')
    const simbian = message.guild.roles.find(role => role.name === 'Simbian')
    const recruitRoles = [recruit, elite, simbian]
    const currentRoles = member.roles.map(role => role)
    const alreadySimbian = currentRoles.filter(cRole => recruitRoles.includes(cRole))

    if (alreadySimbian.length !== 0) return message.send('They\'re already Simbian.')
    if (!member.manageable) return message.send('They have a higher role than me!')

    return member.roles.add([recruit, elite, simbian], `${message.member.user.tag} called the recruit command on ${member.user.tag}`)
      .then(message.send(`${member} has been recruited!`))
  }
}
