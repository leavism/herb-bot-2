const { Client, PermissionLevels } = require('klasa')
const config = require('./config.js');

(() => {
  const client = new Client({
    prefix: '-',
    readyMessage: (client) => `Successfully initialized. Here is an invite link: ${client.invite}`
  })

  client.permissionLevels = new PermissionLevels()
    .add(0, () => true)
    .add(5, ({ guild, member }) => guild && member.roles.find(role => role.name.toLowerCase().includes('regular').name), { fetch: true })
    .add(7, ({ guild, member }) => guild && member.roles.find(role => role.name.toLowerCase().includes('moderator').name), { fetch: true })
    .add(9, ({ guild, member }) => guild && member.permissions.has('ADMINISTRATOR'), { fetch: true })
    .add(10, ({ author }) => author === client.owner)

  require('./modules/date.js')(client)
  client.login(config.token)
})()
