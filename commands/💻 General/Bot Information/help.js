const { Command, util: { isFunction, toTitleCase } } = require('klasa');
const { MessageEmbed } = require('discord.js');
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['halp'],
			guarded: true,
			description: "Lists all the categories or displays detailed info about a command.",
			usage: '[Command:command]',
			extendedHelp: 'You can specify a command to get detailed information about that command. Using the command by itself will list all the different command categories.'
		});

		this.createCustomResolver('command', (arg, possible, message) => {
			if (!arg || arg === '') return undefined;
			return this.client.arguments.get('command').run(arg, possible, message);
		});
	}

	async run(message, [command]) {
		if (command) {
			// const info = [
			// 	`= ${command.name} = `,
			// 	isFunction(command.description) ? command.description(message.language) : command.description,
			// 	message.language.get('COMMAND_HELP_USAGE', command.usage.fullUsage(message)),
			// 	message.language.get('COMMAND_HELP_EXTENDED'),
			// 	isFunction(command.extendedHelp) ? command.extendedHelp(message.language) : command.extendedHelp
			// ].join('\n');
			// return message.sendMessage(info, { code: 'asciidoc' });
			return message.send(await this.buildHelpCommandEmbed(message,command))
		}
		return message.send(await this.buildHelpEmbed(message))
	}

	// async run(message, [command]) {
	// 	if (command) {
	// 		const info = [
	// 			`= ${command.name} = `,
	// 			isFunction(command.description) ? command.description(message.language) : command.description,
	// 			message.language.get('COMMAND_HELP_USAGE', command.usage.fullUsage(message)),
	// 			message.language.get('COMMAND_HELP_EXTENDED'),
	// 			isFunction(command.extendedHelp) ? command.extendedHelp(message.language) : command.extendedHelp
	// 		].join('\n');
	// 		return message.sendMessage(info, { code: 'asciidoc' });
	// 	}
	// 	const help = await this.buildHelp(message);
	// 	const categories = Object.keys(help);
	// 	const helpMessage = [];
	// 	for (let cat = 0; cat < categories.length; cat++) {
	// 		helpMessage.push(`**${categories[cat]} Commands**:`, '```asciidoc');
	// 		const subCategories = Object.keys(help[categories[cat]]);
	// 		for (let subCat = 0; subCat < subCategories.length; subCat++) helpMessage.push(`= ${subCategories[subCat]} =`, `${help[categories[cat]][subCategories[subCat]].join('\n')}\n`);
	// 		helpMessage.push('```', '\u200b');
	// 	}

	// 	return message.author.send(helpMessage, { split: { char: '\u200b' } })
	// 		.then(() => { if (message.channel.type !== 'dm') message.sendLocale('COMMAND_HELP_DM'); })
	// 		.catch(() => { if (message.channel.type !== 'dm') message.sendLocale('COMMAND_HELP_NODM'); });
	// }

	async buildHelpCommandEmbed(message, command) {
		let help = new MessageEmbed()
			.setTitle(`Command \`\`\`${command.name}\`\`\``)
			.setDescription(command.description)
			.addField(
				'🛠 Aliase(s)',
				(command.aliases.length > 0) ? command.aliases : "None.",
				false
			)
			.addField(
				'📝 Format',
				(command.usage.fullUsage(message).length > 0) ? `\`\`\`${command.usage.fullUsage(message)}\`\`\`` : "No examples.",
				false
			)
			.addField(
				'💡 Notes',
				(command.extendedHelp.length > 0) ? command.extendedHelp : "No notes."
			)
			.setFooter(
				'《 》 aliases │ < > required field │ [ ] optional field '
			)
		return help
	}

	async buildHelpEmbed(message) { 
		const { prefix } = message.guildSettings;
		const all = {};
		await Promise.all(this.client.commands.map((command) => 
			this.client.inhibitors.run(message, command, true)
				.then(() => {
					if (!has(all, command.category)) all[command.category] = [];
					all[command.category].push(command)
				})
		))
		const help = new MessageEmbed()
			.setTitle(`${this.client.user.username}`)
			.setDescription(`To view the commands of each group, use:\n\`\`\`${prefix}commands <group>\`\`\``)
		Object.keys(all).forEach((category) => {
			help.addField(
				category,
				`${all[category].length} commands`,
				true
			)
		})
		return help
	}

	async buildHelp(message) {
		const help = {};

		const { prefix } = message.guildSettings;
		// These two lines are for padding the message to be evenly spaced
		const commandNames = [...this.client.commands.keys()];
		const longest = commandNames.reduce((long, str) => Math.max(long, str.length), 0);

		await Promise.all(this.client.commands.map((command) =>
			this.client.inhibitors.run(message, command, true)
				.then(() => {
					if (!has(help, command.category)) help[command.category] = {};
					if (!has(help[command.category], command.subCategory)) help[command.category][command.subCategory] = [];
					const description = isFunction(command.description) ? command.description(message.language) : command.description;
					help[command.category][command.subCategory].push(`• ${command.name.padEnd(longest)} :: ${description}`);
				})
				.catch(() => {
					// noop
				})
		));

		return help;
	}

};
