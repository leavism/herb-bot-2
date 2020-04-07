const { Client, PermissionLevels } = require('klasa')
const config = require('./config.js');

(() => {
  const client = new Client({
    prefix: config.prefix,
    readyMessage: (client) => `Successfully initialized. Here is an invite link: ${client.invite}`
  })

  client.permissionLevels = new PermissionLevels()
    .add(0, () => true)
    .add(1, ({ guild, member }) => guild && member.roles.array().length > 1) // Had a role other than @everyone
    .add(2, ({ guild, member }) => guild && member.roles.find(role => role.name.toLowerCase().includes('simbian')), { fetch: true})
    .add(5, ({ guild, member }) => guild && member.roles.find(role => role.name.toLowerCase().includes('regular')), { fetch: true })
    .add(7, ({ guild, member }) => guild && member.roles.find(role => role.name.toLowerCase().includes('moderator')), { fetch: true })
    .add(9, ({ guild, member }) => guild && member.permissions.has('ADMINISTRATOR'), { fetch: true })
    .add(10, ({ author }) => author === client.owner)

  require('./modules/date.js')(client)
  client.login(config.token)
})()
