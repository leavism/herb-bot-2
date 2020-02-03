const { Command, version: klasaVersion, Duration } = require('klasa');
const { version: discordVersion, MessageEmbed } = require('discord.js');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			guarded: true,
			description: language => language.get('COMMAND_STATS_DESCRIPTION')
		});
	}

	async run(message) {
		return message.sendEmbed(new MessageEmbed()
			.setTitle(this.client.user.tag)
			.setColor(0x04ff70)
			.setThumbnail(this.client.user.avatarURL())
			.addField("🍽️ Serving",
				`${this.client.guilds.size} Servers\n${this.client.users.size} Users`,
				true)
			.addField("🕑 Uptime",
				Duration.toNow(Date.now() - (process.uptime() * 1000)),
				true)
			.addField('🧠 Memory',
				`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
				true)
			.setFooter(`Klasa ${klasaVersion} | Discord.js ${discordVersion} | Node.js ${process.version}`)
		)
	}

};
