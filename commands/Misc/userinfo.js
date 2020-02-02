const { Command } = require('klasa');

module.exports = class extends Command {
  constructor(...args){
    super(...args, {
      name: 'userinfo',
      enabled: 'true',
      runIn: ['text'],
      cooldown: 3,
      description: 'Basic user information!'
    }); 
  }

  async run(message, [...params]) {
    let user = ((message.mentions.users.size == 0) ? message.author :  message.mentions.users.first());
    let tag = user.tag;
    let createdAt = user.createdAt;
    let createdDaysAgo = `(${Math.round((new Date() - createdAt) / (24*60*60*1000))} days ago)`
    let joinedAt = message.member.joinedAt;
    let joinedDaysAgo = `(${Math.round((new Date() - joinedAt) / (24*60*60*1000))} days ago)`
    let roles = message.member.roles.map(m => m.name).filter(m => m != '@everyone').join(', ');
    if (roles.length == 0) roles = 'No roles :(';

    return message.send({embed : {
      title: tag,
      thumbnail: { url: user.avatarURL() },
      color: message.member.displayHexColor,
      fields: [
          {
            name: 'Joined Discord on',
            inline: true,
            value: `${createdAt.getDate()} ${createdAt.getMonthText()}${createdAt.getFullYear()}\n${createdDaysAgo}`
          },
          {
            name: 'Joined Simbad on',
            inline: true,
            value: `${joinedAt.getDate()} ${joinedAt.getMonthText()}${joinedAt.getFullYear()}\n${joinedDaysAgo}`
          },
          {
            name: 'Roles',
            inline: true,
            value: roles
          }
        ]
      }
    })
  }
}